#!/bin/bash

# Rollback script for secure-api-system
# Usage: ./rollback.sh [staging|production] [revision]

set -e

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
NAMESPACE_PREFIX="secure-api"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to show usage
show_usage() {
    echo "Usage: $0 [staging|production] [revision]"
    echo ""
    echo "Arguments:"
    echo "  environment  Target environment (staging or production)"
    echo "  revision     Revision number to rollback to (optional, defaults to previous)"
    echo ""
    echo "Examples:"
    echo "  $0 staging"
    echo "  $0 production 3"
    echo "  $0 staging --list  # List available revisions"
    exit 1
}

# Function to validate prerequisites
validate_prerequisites() {
    log_info "Validating prerequisites..."
    
    # Check if kubectl is installed
    if ! command -v kubectl &> /dev/null; then
        log_error "kubectl is not installed or not in PATH"
        exit 1
    fi
    
    # Check if helm is installed
    if ! command -v helm &> /dev/null; then
        log_error "helm is not installed or not in PATH"
        exit 1
    fi
    
    # Check if we can connect to Kubernetes cluster
    if ! kubectl cluster-info &> /dev/null; then
        log_error "Cannot connect to Kubernetes cluster"
        exit 1
    fi
    
    log_success "Prerequisites validated"
}

# Function to list available revisions
list_revisions() {
    local namespace=$1
    
    log_info "Available revisions for $RELEASE_NAME in $namespace:"
    helm history "$RELEASE_NAME" -n "$namespace" --max 10
}

# Function to get current revision
get_current_revision() {
    local namespace=$1
    
    helm list -n "$namespace" -f "$RELEASE_NAME" -o json | jq -r '.[0].revision'
}

# Function to get previous revision
get_previous_revision() {
    local namespace=$1
    local current_revision=$2
    
    echo $((current_revision - 1))
}

# Function to validate revision
validate_revision() {
    local namespace=$1
    local revision=$2
    
    # Check if revision exists
    if ! helm history "$RELEASE_NAME" -n "$namespace" | grep -q "^$revision"; then
        log_error "Revision $revision not found"
        log_info "Available revisions:"
        list_revisions "$namespace"
        exit 1
    fi
}

# Function to create backup before rollback
create_backup() {
    local namespace=$1
    local current_revision=$2
    
    log_info "Creating backup of current state..."
    
    # Create backup directory
    local backup_dir="/tmp/rollback-backup-$(date +%Y%m%d-%H%M%S)"
    mkdir -p "$backup_dir"
    
    # Backup current Helm values
    helm get values "$RELEASE_NAME" -n "$namespace" > "$backup_dir/current-values.yaml"
    
    # Backup current manifest
    helm get manifest "$RELEASE_NAME" -n "$namespace" > "$backup_dir/current-manifest.yaml"
    
    # Backup current pods info
    kubectl get pods -n "$namespace" -l app.kubernetes.io/instance="$RELEASE_NAME" -o yaml > "$backup_dir/current-pods.yaml"
    
    log_success "Backup created at: $backup_dir"
    echo "$backup_dir" > /tmp/last-rollback-backup
}

# Function to perform rollback
perform_rollback() {
    local namespace=$1
    local revision=$2
    
    log_info "Rolling back $RELEASE_NAME to revision $revision..."
    
    # Perform the rollback
    helm rollback "$RELEASE_NAME" "$revision" -n "$namespace" --wait --timeout=10m
    
    log_success "Rollback completed"
}

# Function to verify rollback
verify_rollback() {
    local namespace=$1
    local target_revision=$2
    
    log_info "Verifying rollback..."
    
    # Check current revision
    local current_revision=$(get_current_revision "$namespace")
    log_info "Current revision after rollback: $current_revision"
    
    # Wait for pods to be ready
    log_info "Waiting for pods to be ready..."
    kubectl wait --for=condition=ready pod -l app.kubernetes.io/instance="$RELEASE_NAME" -n "$namespace" --timeout=300s
    
    # Check pod status
    log_info "Checking pod status..."
    kubectl get pods -n "$namespace" -l app.kubernetes.io/instance="$RELEASE_NAME"
    
    # Check if all pods are running
    local not_ready_pods=$(kubectl get pods -n "$namespace" -l app.kubernetes.io/instance="$RELEASE_NAME" --field-selector=status.phase!=Running --no-headers | wc -l)
    
    if [[ $not_ready_pods -gt 0 ]]; then
        log_warning "Some pods are not in Running state"
        kubectl get pods -n "$namespace" -l app.kubernetes.io/instance="$RELEASE_NAME"
    else
        log_success "All pods are running"
    fi
}

# Function to run health checks after rollback
health_checks() {
    local namespace=$1
    
    log_info "Running health checks..."
    
    # Get service endpoints
    local backend_service=$(kubectl get service -n "$namespace" -l app.kubernetes.io/name=backend,app.kubernetes.io/instance="$RELEASE_NAME" -o jsonpath='{.items[0].metadata.name}' 2>/dev/null || echo "")
    
    if [[ -n "$backend_service" ]]; then
        log_info "Testing backend health endpoint..."
        kubectl run curl-test-rollback --image=curlimages/curl:latest --rm -i --restart=Never -n "$namespace" -- \
            curl -f "http://$backend_service:8080/actuator/health" || log_warning "Backend health check failed"
    fi
    
    log_success "Health checks completed"
}

# Function to show rollback status
show_rollback_status() {
    local namespace=$1
    
    echo ""
    log_info "=== Rollback Status ==="
    echo "Environment: $ENVIRONMENT"
    echo "Release: $RELEASE_NAME"
    echo "Namespace: $namespace"
    echo ""
    
    log_info "Current revision:"
    helm list -n "$namespace" -f "$RELEASE_NAME"
    
    echo ""
    log_info "Recent history:"
    helm history "$RELEASE_NAME" -n "$namespace" --max 5
    
    echo ""
    log_info "Pods:"
    kubectl get pods -n "$namespace" -l app.kubernetes.io/instance="$RELEASE_NAME"
    
    echo ""
    log_info "Services:"
    kubectl get services -n "$namespace" -l app.kubernetes.io/instance="$RELEASE_NAME"
    
    echo ""
    log_success "Rollback completed successfully!"
    
    # Show backup location
    if [[ -f /tmp/last-rollback-backup ]]; then
        local backup_dir=$(cat /tmp/last-rollback-backup)
        log_info "Backup of previous state available at: $backup_dir"
    fi
}

# Function to confirm rollback
confirm_rollback() {
    local environment=$1
    local revision=$2
    
    echo ""
    log_warning "You are about to rollback the $environment environment to revision $revision"
    log_warning "This action cannot be undone automatically"
    echo ""
    read -p "Are you sure you want to proceed? (yes/no): " -r
    echo ""
    
    if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
        log_info "Rollback cancelled"
        exit 0
    fi
}

# Main rollback function
main() {
    # Parse arguments
    if [[ $# -lt 1 ]]; then
        show_usage
    fi
    
    ENVIRONMENT=$1
    
    # Check for list option
    if [[ "$2" == "--list" ]]; then
        LIST_ONLY=true
        REVISION=""
    else
        LIST_ONLY=false
        REVISION=$2
    fi
    
    # Validate environment
    if [[ "$ENVIRONMENT" != "staging" && "$ENVIRONMENT" != "production" ]]; then
        log_error "Invalid environment: $ENVIRONMENT"
        show_usage
    fi
    
    # Set configuration based on environment
    NAMESPACE="$NAMESPACE_PREFIX-$ENVIRONMENT"
    RELEASE_NAME="secure-api-$ENVIRONMENT"
    
    log_info "Connecting to $ENVIRONMENT environment..."
    
    # Validate prerequisites
    validate_prerequisites
    
    # Check if release exists
    if ! helm list -n "$NAMESPACE" -f "$RELEASE_NAME" | grep -q "$RELEASE_NAME"; then
        log_error "Release $RELEASE_NAME not found in namespace $NAMESPACE"
        exit 1
    fi
    
    # If list only, show revisions and exit
    if [[ "$LIST_ONLY" == true ]]; then
        list_revisions "$NAMESPACE"
        exit 0
    fi
    
    # Get current revision
    local current_revision=$(get_current_revision "$NAMESPACE")
    log_info "Current revision: $current_revision"
    
    # Determine target revision
    if [[ -z "$REVISION" ]]; then
        REVISION=$(get_previous_revision "$NAMESPACE" "$current_revision")
        log_info "No revision specified, using previous revision: $REVISION"
    fi
    
    # Validate target revision
    validate_revision "$NAMESPACE" "$REVISION"
    
    # Check if we're already at the target revision
    if [[ "$current_revision" == "$REVISION" ]]; then
        log_warning "Already at revision $REVISION"
        exit 0
    fi
    
    # Confirm rollback for production
    if [[ "$ENVIRONMENT" == "production" ]]; then
        confirm_rollback "$ENVIRONMENT" "$REVISION"
    fi
    
    log_info "Starting rollback process..."
    
    # Perform rollback
    create_backup "$NAMESPACE" "$current_revision"
    perform_rollback "$NAMESPACE" "$REVISION"
    verify_rollback "$NAMESPACE" "$REVISION"
    health_checks "$NAMESPACE"
    show_rollback_status "$NAMESPACE"
}

# Run main function with all arguments
main "$@"
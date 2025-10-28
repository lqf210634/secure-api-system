#!/bin/bash

# Deployment Test Script for secure-api-system
# This script tests the actual deployment of the Helm chart in a Kubernetes cluster

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
NAMESPACE="secure-api-test"
RELEASE_NAME="secure-api-test"
CHART_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TEST_VALUES="$(dirname "${BASH_SOURCE[0]}")/test-values.yaml"
TIMEOUT="300s"

# Function to print status
print_status() {
    local status=$1
    local message=$2
    if [ "$status" = "PASS" ]; then
        echo -e "${GREEN}[PASS]${NC} $message"
    elif [ "$status" = "FAIL" ]; then
        echo -e "${RED}[FAIL]${NC} $message"
    elif [ "$status" = "WARN" ]; then
        echo -e "${YELLOW}[WARN]${NC} $message"
    else
        echo -e "${BLUE}[INFO]${NC} $message"
    fi
}

# Function to wait for deployment
wait_for_deployment() {
    local deployment=$1
    local timeout=${2:-300}
    
    print_status "INFO" "Waiting for deployment $deployment to be ready..."
    
    if kubectl wait --for=condition=available deployment/$deployment \
        --namespace=$NAMESPACE --timeout=${timeout}s >/dev/null 2>&1; then
        print_status "PASS" "Deployment $deployment is ready"
        return 0
    else
        print_status "FAIL" "Deployment $deployment failed to become ready within ${timeout}s"
        return 1
    fi
}

# Function to check pod status
check_pod_status() {
    local label_selector=$1
    local expected_count=${2:-1}
    
    local running_pods=$(kubectl get pods -l "$label_selector" \
        --namespace=$NAMESPACE --field-selector=status.phase=Running \
        --no-headers 2>/dev/null | wc -l)
    
    if [ "$running_pods" -ge "$expected_count" ]; then
        print_status "PASS" "Found $running_pods running pods for $label_selector"
        return 0
    else
        print_status "FAIL" "Expected at least $expected_count running pods for $label_selector, found $running_pods"
        return 1
    fi
}

# Function to test service connectivity
test_service_connectivity() {
    local service=$1
    local port=$2
    local path=${3:-"/"}
    
    print_status "INFO" "Testing connectivity to service $service:$port$path"
    
    # Create a test pod for connectivity testing
    kubectl run test-connectivity-$(date +%s) \
        --image=curlimages/curl:latest \
        --rm -i --restart=Never \
        --namespace=$NAMESPACE \
        --command -- curl -s -o /dev/null -w "%{http_code}" \
        "http://$service:$port$path" >/dev/null 2>&1
    
    if [ $? -eq 0 ]; then
        print_status "PASS" "Service $service is accessible"
        return 0
    else
        print_status "FAIL" "Service $service is not accessible"
        return 1
    fi
}

# Function to cleanup
cleanup() {
    print_status "INFO" "Cleaning up test deployment..."
    
    # Delete the release
    if helm list --namespace=$NAMESPACE | grep -q "$RELEASE_NAME"; then
        helm uninstall "$RELEASE_NAME" --namespace=$NAMESPACE >/dev/null 2>&1 || true
    fi
    
    # Delete the namespace
    kubectl delete namespace "$NAMESPACE" --ignore-not-found=true >/dev/null 2>&1 || true
    
    print_status "INFO" "Cleanup completed"
}

# Trap to ensure cleanup on exit
trap cleanup EXIT

echo -e "${BLUE}=== Deployment Test for secure-api-system ===${NC}"
echo "Chart directory: $CHART_DIR"
echo "Test values: $TEST_VALUES"
echo "Namespace: $NAMESPACE"
echo "Release name: $RELEASE_NAME"
echo

# Check prerequisites
echo -e "${BLUE}=== Checking Prerequisites ===${NC}"

# Check if kubectl is available and cluster is accessible
if kubectl cluster-info >/dev/null 2>&1; then
    print_status "PASS" "Kubernetes cluster is accessible"
else
    print_status "FAIL" "Cannot access Kubernetes cluster"
    exit 1
fi

# Check if helm is available
if command -v helm >/dev/null 2>&1; then
    print_status "PASS" "Helm is available"
else
    print_status "FAIL" "Helm is not available"
    exit 1
fi

# Check if chart directory exists
if [ -d "$CHART_DIR" ]; then
    print_status "PASS" "Chart directory exists"
else
    print_status "FAIL" "Chart directory not found: $CHART_DIR"
    exit 1
fi

# Check if test values file exists
if [ -f "$TEST_VALUES" ]; then
    print_status "PASS" "Test values file exists"
else
    print_status "FAIL" "Test values file not found: $TEST_VALUES"
    exit 1
fi

# Create test namespace
echo -e "\n${BLUE}=== Setting up Test Environment ===${NC}"

kubectl create namespace "$NAMESPACE" >/dev/null 2>&1 || true
print_status "INFO" "Test namespace created/verified: $NAMESPACE"

# Deploy the chart
echo -e "\n${BLUE}=== Deploying Helm Chart ===${NC}"

print_status "INFO" "Installing Helm chart..."

if helm install "$RELEASE_NAME" "$CHART_DIR" \
    --namespace="$NAMESPACE" \
    --values="$TEST_VALUES" \
    --wait --timeout="$TIMEOUT" >/dev/null 2>&1; then
    print_status "PASS" "Helm chart installed successfully"
else
    print_status "FAIL" "Helm chart installation failed"
    
    # Show some debug information
    echo -e "\n${YELLOW}Debug Information:${NC}"
    kubectl get pods --namespace="$NAMESPACE"
    kubectl get events --namespace="$NAMESPACE" --sort-by='.lastTimestamp'
    exit 1
fi

# Wait for deployments to be ready
echo -e "\n${BLUE}=== Waiting for Deployments ===${NC}"

# Check if frontend is enabled and wait for it
if helm get values "$RELEASE_NAME" --namespace="$NAMESPACE" | grep -q "frontend:" && \
   helm get values "$RELEASE_NAME" --namespace="$NAMESPACE" | grep -A 5 "frontend:" | grep -q "enabled: true"; then
    wait_for_deployment "$RELEASE_NAME-frontend" 300
fi

# Check if backend is enabled and wait for it
if helm get values "$RELEASE_NAME" --namespace="$NAMESPACE" | grep -q "backend:" && \
   helm get values "$RELEASE_NAME" --namespace="$NAMESPACE" | grep -A 5 "backend:" | grep -q "enabled: true"; then
    wait_for_deployment "$RELEASE_NAME-backend" 300
fi

# Test pod status
echo -e "\n${BLUE}=== Testing Pod Status ===${NC}"

# Check frontend pods
if kubectl get deployment "$RELEASE_NAME-frontend" --namespace="$NAMESPACE" >/dev/null 2>&1; then
    check_pod_status "app.kubernetes.io/name=secure-api-system,app.kubernetes.io/component=frontend" 1
fi

# Check backend pods
if kubectl get deployment "$RELEASE_NAME-backend" --namespace="$NAMESPACE" >/dev/null 2>&1; then
    check_pod_status "app.kubernetes.io/name=secure-api-system,app.kubernetes.io/component=backend" 1
fi

# Test service connectivity
echo -e "\n${BLUE}=== Testing Service Connectivity ===${NC}"

# Test frontend service
if kubectl get service "$RELEASE_NAME-frontend" --namespace="$NAMESPACE" >/dev/null 2>&1; then
    FRONTEND_PORT=$(kubectl get service "$RELEASE_NAME-frontend" --namespace="$NAMESPACE" -o jsonpath='{.spec.ports[0].port}')
    test_service_connectivity "$RELEASE_NAME-frontend" "$FRONTEND_PORT"
fi

# Test backend service
if kubectl get service "$RELEASE_NAME-backend" --namespace="$NAMESPACE" >/dev/null 2>&1; then
    BACKEND_PORT=$(kubectl get service "$RELEASE_NAME-backend" --namespace="$NAMESPACE" -o jsonpath='{.spec.ports[0].port}')
    # Test backend health endpoint if available
    test_service_connectivity "$RELEASE_NAME-backend" "$BACKEND_PORT" "/actuator/health"
fi

# Test configuration
echo -e "\n${BLUE}=== Testing Configuration ===${NC}"

# Check if ConfigMaps are created
if kubectl get configmap --namespace="$NAMESPACE" | grep -q "$RELEASE_NAME"; then
    print_status "PASS" "ConfigMaps are created"
else
    print_status "WARN" "No ConfigMaps found"
fi

# Check if Secrets are created
if kubectl get secret --namespace="$NAMESPACE" | grep -q "$RELEASE_NAME"; then
    print_status "PASS" "Secrets are created"
else
    print_status "WARN" "No Secrets found"
fi

# Check if ServiceAccount is created
if kubectl get serviceaccount --namespace="$NAMESPACE" | grep -q "$RELEASE_NAME"; then
    print_status "PASS" "ServiceAccount is created"
else
    print_status "WARN" "No ServiceAccount found"
fi

# Test resource limits
echo -e "\n${BLUE}=== Testing Resource Configuration ===${NC}"

# Check if pods have resource limits
PODS_WITHOUT_LIMITS=$(kubectl get pods --namespace="$NAMESPACE" -o jsonpath='{range .items[*]}{.metadata.name}{"\t"}{.spec.containers[*].resources.limits}{"\n"}{end}' | grep -c "^[^[:space:]]*[[:space:]]*$" || true)

if [ "$PODS_WITHOUT_LIMITS" -eq 0 ]; then
    print_status "PASS" "All pods have resource limits configured"
else
    print_status "WARN" "$PODS_WITHOUT_LIMITS pods are missing resource limits"
fi

# Test scaling (if HPA is enabled)
echo -e "\n${BLUE}=== Testing Scaling ===${NC}"

# Check if HPA is configured
if kubectl get hpa --namespace="$NAMESPACE" >/dev/null 2>&1; then
    print_status "PASS" "HPA is configured"
    
    # Test manual scaling
    if kubectl get deployment "$RELEASE_NAME-backend" --namespace="$NAMESPACE" >/dev/null 2>&1; then
        print_status "INFO" "Testing manual scaling..."
        kubectl scale deployment "$RELEASE_NAME-backend" --replicas=2 --namespace="$NAMESPACE" >/dev/null 2>&1
        
        if wait_for_deployment "$RELEASE_NAME-backend" 120; then
            print_status "PASS" "Manual scaling works"
            
            # Scale back to 1
            kubectl scale deployment "$RELEASE_NAME-backend" --replicas=1 --namespace="$NAMESPACE" >/dev/null 2>&1
        else
            print_status "FAIL" "Manual scaling failed"
        fi
    fi
else
    print_status "INFO" "HPA is not configured (expected for test environment)"
fi

# Test upgrade
echo -e "\n${BLUE}=== Testing Upgrade ===${NC}"

print_status "INFO" "Testing Helm upgrade..."

if helm upgrade "$RELEASE_NAME" "$CHART_DIR" \
    --namespace="$NAMESPACE" \
    --values="$TEST_VALUES" \
    --set app.version="1.0.1" \
    --wait --timeout="$TIMEOUT" >/dev/null 2>&1; then
    print_status "PASS" "Helm upgrade successful"
else
    print_status "FAIL" "Helm upgrade failed"
fi

# Test rollback
echo -e "\n${BLUE}=== Testing Rollback ===${NC}"

print_status "INFO" "Testing Helm rollback..."

if helm rollback "$RELEASE_NAME" 1 --namespace="$NAMESPACE" --wait --timeout="$TIMEOUT" >/dev/null 2>&1; then
    print_status "PASS" "Helm rollback successful"
else
    print_status "FAIL" "Helm rollback failed"
fi

# Final health check
echo -e "\n${BLUE}=== Final Health Check ===${NC}"

# Check overall deployment status
FAILED_PODS=$(kubectl get pods --namespace="$NAMESPACE" --field-selector=status.phase!=Running --no-headers 2>/dev/null | wc -l)

if [ "$FAILED_PODS" -eq 0 ]; then
    print_status "PASS" "All pods are running"
else
    print_status "FAIL" "$FAILED_PODS pods are not running"
    
    # Show failed pods
    echo -e "\n${YELLOW}Failed pods:${NC}"
    kubectl get pods --namespace="$NAMESPACE" --field-selector=status.phase!=Running
fi

# Check if all services are accessible
SERVICES=$(kubectl get services --namespace="$NAMESPACE" --no-headers -o custom-columns=":metadata.name" | grep "$RELEASE_NAME")
SERVICE_FAILURES=0

for service in $SERVICES; do
    if kubectl get endpoints "$service" --namespace="$NAMESPACE" -o jsonpath='{.subsets[*].addresses[*].ip}' | grep -q .; then
        print_status "PASS" "Service $service has endpoints"
    else
        print_status "FAIL" "Service $service has no endpoints"
        SERVICE_FAILURES=$((SERVICE_FAILURES + 1))
    fi
done

# Summary
echo -e "\n${BLUE}=== Test Summary ===${NC}"

if [ "$FAILED_PODS" -eq 0 ] && [ "$SERVICE_FAILURES" -eq 0 ]; then
    print_status "PASS" "All deployment tests passed"
    echo -e "\n${GREEN}✅ Deployment test completed successfully!${NC}"
    
    # Show deployment information
    echo -e "\n${BLUE}Deployment Information:${NC}"
    echo "Namespace: $NAMESPACE"
    echo "Release: $RELEASE_NAME"
    echo "Pods:"
    kubectl get pods --namespace="$NAMESPACE" -o wide
    echo -e "\nServices:"
    kubectl get services --namespace="$NAMESPACE"
    
    exit 0
else
    print_status "FAIL" "Some deployment tests failed"
    echo -e "\n${RED}❌ Deployment test failed!${NC}"
    
    # Show debug information
    echo -e "\n${YELLOW}Debug Information:${NC}"
    kubectl get all --namespace="$NAMESPACE"
    echo -e "\nEvents:"
    kubectl get events --namespace="$NAMESPACE" --sort-by='.lastTimestamp'
    
    exit 1
fi
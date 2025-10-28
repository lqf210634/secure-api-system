#!/bin/bash

# Secure API System Build Script
# Usage: ./build.sh [component] [version]

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
COMPONENT="${1:-all}"
VERSION="${2:-latest}"
REGISTRY="${REGISTRY:-ghcr.io/yourusername}"

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

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."
    
    # Check if docker is installed
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed"
        exit 1
    fi
    
    # Check if docker is running
    if ! docker info &> /dev/null; then
        log_error "Docker is not running"
        exit 1
    fi
    
    log_success "Prerequisites check passed"
}

# Build frontend
build_frontend() {
    log_info "Building frontend..."
    
    cd "$PROJECT_ROOT/frontend"
    
    # Install dependencies
    log_info "Installing frontend dependencies..."
    npm ci
    
    # Run linting
    log_info "Running frontend linting..."
    npm run lint
    
    # Run type checking
    log_info "Running frontend type checking..."
    npm run type-check
    
    # Run tests
    log_info "Running frontend tests..."
    npm run test:ci
    
    # Build application
    log_info "Building frontend application..."
    npm run build
    
    # Build Docker image
    log_info "Building frontend Docker image..."
    docker build -t "$REGISTRY/secure-api-frontend:$VERSION" .
    docker tag "$REGISTRY/secure-api-frontend:$VERSION" "$REGISTRY/secure-api-frontend:latest"
    
    log_success "Frontend build completed"
    cd "$PROJECT_ROOT"
}

# Build backend
build_backend() {
    log_info "Building backend..."
    
    cd "$PROJECT_ROOT/backend"
    
    # Run tests
    log_info "Running backend tests..."
    mvn clean test
    
    # Run code quality checks
    log_info "Running backend code quality checks..."
    mvn checkstyle:check spotbugs:check
    
    # Package application
    log_info "Packaging backend application..."
    mvn clean package -DskipTests
    
    # Build Docker image
    log_info "Building backend Docker image..."
    docker build -t "$REGISTRY/secure-api-backend:$VERSION" .
    docker tag "$REGISTRY/secure-api-backend:$VERSION" "$REGISTRY/secure-api-backend:latest"
    
    log_success "Backend build completed"
    cd "$PROJECT_ROOT"
}

# Push images to registry
push_images() {
    log_info "Pushing images to registry..."
    
    case $COMPONENT in
        frontend)
            docker push "$REGISTRY/secure-api-frontend:$VERSION"
            docker push "$REGISTRY/secure-api-frontend:latest"
            ;;
        backend)
            docker push "$REGISTRY/secure-api-backend:$VERSION"
            docker push "$REGISTRY/secure-api-backend:latest"
            ;;
        all)
            docker push "$REGISTRY/secure-api-frontend:$VERSION"
            docker push "$REGISTRY/secure-api-frontend:latest"
            docker push "$REGISTRY/secure-api-backend:$VERSION"
            docker push "$REGISTRY/secure-api-backend:latest"
            ;;
    esac
    
    log_success "Images pushed to registry"
}

# Run security scan
run_security_scan() {
    log_info "Running security scan..."
    
    # Install trivy if not available
    if ! command -v trivy &> /dev/null; then
        log_warning "Trivy not installed, skipping security scan"
        return 0
    fi
    
    case $COMPONENT in
        frontend)
            trivy image "$REGISTRY/secure-api-frontend:$VERSION"
            ;;
        backend)
            trivy image "$REGISTRY/secure-api-backend:$VERSION"
            ;;
        all)
            trivy image "$REGISTRY/secure-api-frontend:$VERSION"
            trivy image "$REGISTRY/secure-api-backend:$VERSION"
            ;;
    esac
    
    log_success "Security scan completed"
}

# Generate build report
generate_build_report() {
    log_info "Generating build report..."
    
    REPORT_FILE="$PROJECT_ROOT/build-report-$(date +%Y%m%d-%H%M%S).txt"
    
    {
        echo "Secure API System Build Report"
        echo "=============================="
        echo "Build Date: $(date)"
        echo "Component: $COMPONENT"
        echo "Version: $VERSION"
        echo "Registry: $REGISTRY"
        echo ""
        echo "Docker Images:"
        
        case $COMPONENT in
            frontend)
                docker images "$REGISTRY/secure-api-frontend" --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}\t{{.CreatedAt}}"
                ;;
            backend)
                docker images "$REGISTRY/secure-api-backend" --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}\t{{.CreatedAt}}"
                ;;
            all)
                docker images "$REGISTRY/secure-api-frontend" --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}\t{{.CreatedAt}}"
                docker images "$REGISTRY/secure-api-backend" --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}\t{{.CreatedAt}}"
                ;;
        esac
        
        echo ""
        echo "Build completed successfully!"
    } > "$REPORT_FILE"
    
    log_success "Build report generated: $REPORT_FILE"
}

# Cleanup old images
cleanup_old_images() {
    log_info "Cleaning up old images..."
    
    # Remove dangling images
    docker image prune -f
    
    # Remove old versions (keep last 5)
    case $COMPONENT in
        frontend)
            docker images "$REGISTRY/secure-api-frontend" --format "{{.ID}} {{.CreatedAt}}" | \
                sort -k2 -r | tail -n +6 | awk '{print $1}' | xargs -r docker rmi -f
            ;;
        backend)
            docker images "$REGISTRY/secure-api-backend" --format "{{.ID}} {{.CreatedAt}}" | \
                sort -k2 -r | tail -n +6 | awk '{print $1}' | xargs -r docker rmi -f
            ;;
        all)
            docker images "$REGISTRY/secure-api-frontend" --format "{{.ID}} {{.CreatedAt}}" | \
                sort -k2 -r | tail -n +6 | awk '{print $1}' | xargs -r docker rmi -f
            docker images "$REGISTRY/secure-api-backend" --format "{{.ID}} {{.CreatedAt}}" | \
                sort -k2 -r | tail -n +6 | awk '{print $1}' | xargs -r docker rmi -f
            ;;
    esac
    
    log_success "Cleanup completed"
}

# Main build function
main() {
    log_info "Starting build process for $COMPONENT with version $VERSION"
    
    check_prerequisites
    
    case $COMPONENT in
        frontend)
            build_frontend
            ;;
        backend)
            build_backend
            ;;
        all)
            build_frontend
            build_backend
            ;;
        *)
            log_error "Invalid component: $COMPONENT"
            log_info "Valid components: frontend, backend, all"
            exit 1
            ;;
    esac
    
    # Ask if user wants to push images
    read -p "Push images to registry? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        push_images
    fi
    
    # Ask if user wants to run security scan
    read -p "Run security scan? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        run_security_scan
    fi
    
    generate_build_report
    cleanup_old_images
    
    log_success "Build process completed successfully!"
}

# Show usage
show_usage() {
    echo "Usage: $0 [component] [version]"
    echo ""
    echo "Components:"
    echo "  frontend            - Build frontend only"
    echo "  backend             - Build backend only"
    echo "  all                 - Build all components (default)"
    echo ""
    echo "Version:"
    echo "  latest              - Use latest tag (default)"
    echo "  v1.0.0              - Use specific version"
    echo ""
    echo "Environment Variables:"
    echo "  REGISTRY            - Docker registry URL (default: ghcr.io/yourusername)"
    echo ""
    echo "Examples:"
    echo "  $0 frontend v1.0.0"
    echo "  $0 backend latest"
    echo "  $0 all"
    echo "  REGISTRY=my-registry.com $0 all v1.0.0"
}

# Handle command line arguments
case "${1:-}" in
    -h|--help)
        show_usage
        exit 0
        ;;
    *)
        main "$@"
        ;;
esac
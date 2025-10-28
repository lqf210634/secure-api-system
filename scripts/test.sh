#!/bin/bash

# Secure API System - Test Script
# This script runs various types of tests for the application

set -e

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
ENVIRONMENT="${ENVIRONMENT:-test}"
TEST_TYPE="${1:-all}"
VERBOSE="${VERBOSE:-false}"

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

# Help function
show_help() {
    cat << EOF
Usage: $0 [TEST_TYPE] [OPTIONS]

Test Types:
    all             Run all tests (default)
    unit            Run unit tests only
    integration     Run integration tests only
    e2e             Run end-to-end tests only
    performance     Run performance tests only
    security        Run security tests only
    frontend        Run frontend tests only
    backend         Run backend tests only

Options:
    -h, --help      Show this help message
    -v, --verbose   Enable verbose output
    --clean         Clean test artifacts before running
    --coverage      Generate coverage reports
    --parallel      Run tests in parallel where possible

Environment Variables:
    ENVIRONMENT     Test environment (default: test)
    TEST_DB_URL     Test database URL
    REDIS_URL       Redis URL for testing
    API_BASE_URL    Base URL for API tests
    FRONTEND_URL    Frontend URL for E2E tests

Examples:
    $0                          # Run all tests
    $0 unit                     # Run unit tests only
    $0 integration --coverage   # Run integration tests with coverage
    $0 e2e --verbose           # Run E2E tests with verbose output
EOF
}

# Parse command line arguments
parse_args() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            -h|--help)
                show_help
                exit 0
                ;;
            -v|--verbose)
                VERBOSE=true
                shift
                ;;
            --clean)
                CLEAN=true
                shift
                ;;
            --coverage)
                COVERAGE=true
                shift
                ;;
            --parallel)
                PARALLEL=true
                shift
                ;;
            *)
                if [[ -z "$TEST_TYPE" || "$TEST_TYPE" == "all" ]]; then
                    TEST_TYPE="$1"
                fi
                shift
                ;;
        esac
    done
}

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."
    
    # Check if Docker is running
    if ! docker info >/dev/null 2>&1; then
        log_error "Docker is not running. Please start Docker and try again."
        exit 1
    fi
    
    # Check if Node.js is installed
    if ! command -v node >/dev/null 2>&1; then
        log_error "Node.js is not installed. Please install Node.js and try again."
        exit 1
    fi
    
    # Check if Java is installed
    if ! command -v java >/dev/null 2>&1; then
        log_error "Java is not installed. Please install Java and try again."
        exit 1
    fi
    
    # Check if Maven is installed
    if ! command -v mvn >/dev/null 2>&1; then
        log_error "Maven is not installed. Please install Maven and try again."
        exit 1
    fi
    
    # Check if k6 is installed for performance tests
    if [[ "$TEST_TYPE" == "all" || "$TEST_TYPE" == "performance" ]]; then
        if ! command -v k6 >/dev/null 2>&1; then
            log_warning "k6 is not installed. Performance tests will be skipped."
            log_info "To install k6, visit: https://k6.io/docs/getting-started/installation/"
        fi
    fi
    
    log_success "Prerequisites check completed"
}

# Clean test artifacts
clean_artifacts() {
    if [[ "$CLEAN" == "true" ]]; then
        log_info "Cleaning test artifacts..."
        
        # Clean frontend artifacts
        if [[ -d "$PROJECT_ROOT/frontend" ]]; then
            cd "$PROJECT_ROOT/frontend"
            rm -rf coverage/ test-results/ playwright-report/
            npm run clean 2>/dev/null || true
        fi
        
        # Clean backend artifacts
        if [[ -d "$PROJECT_ROOT/backend" ]]; then
            cd "$PROJECT_ROOT/backend"
            mvn clean -q
            rm -rf target/site/jacoco/
        fi
        
        # Clean Docker test containers
        docker-compose -f "$PROJECT_ROOT/docker-compose.test.yml" down -v 2>/dev/null || true
        
        log_success "Test artifacts cleaned"
    fi
}

# Setup test environment
setup_test_environment() {
    log_info "Setting up test environment..."
    
    # Start test services
    cd "$PROJECT_ROOT"
    docker-compose -f docker-compose.test.yml up -d mysql redis
    
    # Wait for services to be ready
    log_info "Waiting for test services to be ready..."
    sleep 10
    
    # Check MySQL
    for i in {1..30}; do
        if docker-compose -f docker-compose.test.yml exec -T mysql mysqladmin ping -h localhost --silent; then
            log_success "MySQL is ready"
            break
        fi
        if [[ $i -eq 30 ]]; then
            log_error "MySQL failed to start"
            exit 1
        fi
        sleep 2
    done
    
    # Check Redis
    for i in {1..30}; do
        if docker-compose -f docker-compose.test.yml exec -T redis redis-cli ping | grep -q PONG; then
            log_success "Redis is ready"
            break
        fi
        if [[ $i -eq 30 ]]; then
            log_error "Redis failed to start"
            exit 1
        fi
        sleep 2
    done
}

# Run frontend tests
run_frontend_tests() {
    log_info "Running frontend tests..."
    
    cd "$PROJECT_ROOT/frontend"
    
    # Install dependencies
    npm ci
    
    # Run linting
    log_info "Running frontend linting..."
    npm run lint
    
    # Run type checking
    log_info "Running TypeScript type checking..."
    npm run type-check
    
    # Run unit tests
    log_info "Running frontend unit tests..."
    if [[ "$COVERAGE" == "true" ]]; then
        npm run test:coverage
    else
        npm test
    fi
    
    # Run E2E tests if requested
    if [[ "$TEST_TYPE" == "all" || "$TEST_TYPE" == "e2e" ]]; then
        log_info "Running E2E tests..."
        npm run test:e2e
    fi
    
    log_success "Frontend tests completed"
}

# Run backend tests
run_backend_tests() {
    log_info "Running backend tests..."
    
    cd "$PROJECT_ROOT/backend"
    
    # Run unit tests
    log_info "Running backend unit tests..."
    if [[ "$COVERAGE" == "true" ]]; then
        mvn test jacoco:report
    else
        mvn test
    fi
    
    # Run integration tests if requested
    if [[ "$TEST_TYPE" == "all" || "$TEST_TYPE" == "integration" ]]; then
        log_info "Running backend integration tests..."
        mvn verify -Pintegration-tests
    fi
    
    log_success "Backend tests completed"
}

# Run performance tests
run_performance_tests() {
    if ! command -v k6 >/dev/null 2>&1; then
        log_warning "k6 not found, skipping performance tests"
        return
    fi
    
    log_info "Running performance tests..."
    
    # Start application for performance testing
    cd "$PROJECT_ROOT"
    docker-compose -f docker-compose.test.yml up -d backend frontend
    
    # Wait for application to be ready
    log_info "Waiting for application to be ready..."
    sleep 30
    
    # Check if backend is ready
    for i in {1..60}; do
        if curl -f http://localhost:8080/actuator/health >/dev/null 2>&1; then
            log_success "Backend is ready"
            break
        fi
        if [[ $i -eq 60 ]]; then
            log_error "Backend failed to start"
            return 1
        fi
        sleep 2
    done
    
    # Run k6 performance tests
    cd "$PROJECT_ROOT/tests/performance"
    k6 run --out json=results.json load-test.js
    
    log_success "Performance tests completed"
}

# Run security tests
run_security_tests() {
    if ! command -v k6 >/dev/null 2>&1; then
        log_warning "k6 not found, skipping security tests"
        return
    fi
    
    log_info "Running security tests..."
    
    # Ensure application is running
    cd "$PROJECT_ROOT"
    docker-compose -f docker-compose.test.yml up -d backend frontend
    
    # Wait for application to be ready
    sleep 10
    
    # Run security tests with k6
    cd "$PROJECT_ROOT/tests/security"
    k6 run security-test.js
    
    # Run OWASP ZAP security scan if available
    if command -v docker >/dev/null 2>&1; then
        log_info "Running OWASP ZAP security scan..."
        docker run -t owasp/zap2docker-stable zap-baseline.py \
            -t http://host.docker.internal:8080 \
            -J zap-report.json || true
    fi
    
    log_success "Security tests completed"
}

# Generate test reports
generate_reports() {
    log_info "Generating test reports..."
    
    REPORTS_DIR="$PROJECT_ROOT/test-reports"
    mkdir -p "$REPORTS_DIR"
    
    # Copy frontend coverage reports
    if [[ -d "$PROJECT_ROOT/frontend/coverage" ]]; then
        cp -r "$PROJECT_ROOT/frontend/coverage" "$REPORTS_DIR/frontend-coverage"
    fi
    
    # Copy backend coverage reports
    if [[ -d "$PROJECT_ROOT/backend/target/site/jacoco" ]]; then
        cp -r "$PROJECT_ROOT/backend/target/site/jacoco" "$REPORTS_DIR/backend-coverage"
    fi
    
    # Copy performance test results
    if [[ -f "$PROJECT_ROOT/tests/performance/results.json" ]]; then
        cp "$PROJECT_ROOT/tests/performance/results.json" "$REPORTS_DIR/performance-results.json"
    fi
    
    # Copy security test results
    if [[ -f "$PROJECT_ROOT/tests/security/zap-report.json" ]]; then
        cp "$PROJECT_ROOT/tests/security/zap-report.json" "$REPORTS_DIR/security-results.json"
    fi
    
    log_success "Test reports generated in $REPORTS_DIR"
}

# Cleanup function
cleanup() {
    log_info "Cleaning up test environment..."
    cd "$PROJECT_ROOT"
    docker-compose -f docker-compose.test.yml down -v
    log_success "Cleanup completed"
}

# Main execution
main() {
    # Parse arguments
    parse_args "$@"
    
    # Show configuration
    log_info "Test Configuration:"
    log_info "  Test Type: $TEST_TYPE"
    log_info "  Environment: $ENVIRONMENT"
    log_info "  Verbose: $VERBOSE"
    log_info "  Coverage: ${COVERAGE:-false}"
    log_info "  Parallel: ${PARALLEL:-false}"
    log_info "  Clean: ${CLEAN:-false}"
    
    # Set trap for cleanup
    trap cleanup EXIT
    
    # Check prerequisites
    check_prerequisites
    
    # Clean artifacts if requested
    clean_artifacts
    
    # Setup test environment
    setup_test_environment
    
    # Run tests based on type
    case "$TEST_TYPE" in
        "all")
            run_frontend_tests
            run_backend_tests
            run_performance_tests
            run_security_tests
            ;;
        "unit")
            cd "$PROJECT_ROOT/frontend" && npm test
            cd "$PROJECT_ROOT/backend" && mvn test
            ;;
        "integration")
            run_backend_tests
            ;;
        "e2e")
            cd "$PROJECT_ROOT/frontend" && npm run test:e2e
            ;;
        "performance")
            run_performance_tests
            ;;
        "security")
            run_security_tests
            ;;
        "frontend")
            run_frontend_tests
            ;;
        "backend")
            run_backend_tests
            ;;
        *)
            log_error "Unknown test type: $TEST_TYPE"
            show_help
            exit 1
            ;;
    esac
    
    # Generate reports
    generate_reports
    
    log_success "All tests completed successfully!"
}

# Run main function
main "$@"
#!/bin/bash

# Helm Chart Validation Script for secure-api-system
# This script validates the Helm chart syntax, templates, and configurations

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CHART_DIR="$(dirname "$SCRIPT_DIR")"
TEST_VALUES="$SCRIPT_DIR/test-values.yaml"

echo -e "${BLUE}=== Helm Chart Validation for secure-api-system ===${NC}"
echo "Chart directory: $CHART_DIR"
echo "Test values: $TEST_VALUES"
echo

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

# Function to run test and capture output
run_test() {
    local test_name=$1
    local command=$2
    local expected_exit_code=${3:-0}
    
    echo -e "\n${BLUE}--- Testing: $test_name ---${NC}"
    
    if output=$(eval "$command" 2>&1); then
        if [ $? -eq $expected_exit_code ]; then
            print_status "PASS" "$test_name"
            return 0
        else
            print_status "FAIL" "$test_name - Unexpected exit code"
            echo "$output"
            return 1
        fi
    else
        exit_code=$?
        if [ $exit_code -eq $expected_exit_code ]; then
            print_status "PASS" "$test_name"
            return 0
        else
            print_status "FAIL" "$test_name"
            echo "$output"
            return 1
        fi
    fi
}

# Check prerequisites
echo -e "${BLUE}=== Checking Prerequisites ===${NC}"

# Check if helm is installed
if command -v helm >/dev/null 2>&1; then
    HELM_VERSION=$(helm version --short)
    print_status "PASS" "Helm is installed: $HELM_VERSION"
else
    print_status "FAIL" "Helm is not installed"
    exit 1
fi

# Check if kubectl is installed
if command -v kubectl >/dev/null 2>&1; then
    KUBECTL_VERSION=$(kubectl version --client --short 2>/dev/null || echo "kubectl client")
    print_status "PASS" "kubectl is installed: $KUBECTL_VERSION"
else
    print_status "WARN" "kubectl is not installed (optional for chart validation)"
fi

# Check if chart directory exists
if [ -d "$CHART_DIR" ]; then
    print_status "PASS" "Chart directory exists"
else
    print_status "FAIL" "Chart directory not found: $CHART_DIR"
    exit 1
fi

# Check if Chart.yaml exists
if [ -f "$CHART_DIR/Chart.yaml" ]; then
    print_status "PASS" "Chart.yaml exists"
else
    print_status "FAIL" "Chart.yaml not found"
    exit 1
fi

# Check if values.yaml exists
if [ -f "$CHART_DIR/values.yaml" ]; then
    print_status "PASS" "values.yaml exists"
else
    print_status "FAIL" "values.yaml not found"
    exit 1
fi

# Check if templates directory exists
if [ -d "$CHART_DIR/templates" ]; then
    print_status "PASS" "templates directory exists"
    TEMPLATE_COUNT=$(find "$CHART_DIR/templates" -name "*.yaml" -o -name "*.yml" | wc -l)
    print_status "INFO" "Found $TEMPLATE_COUNT template files"
else
    print_status "FAIL" "templates directory not found"
    exit 1
fi

# Validation tests
echo -e "\n${BLUE}=== Running Validation Tests ===${NC}"

# Test 1: Helm lint
run_test "Helm lint with default values" "helm lint '$CHART_DIR'"

# Test 2: Helm lint with test values
if [ -f "$TEST_VALUES" ]; then
    run_test "Helm lint with test values" "helm lint '$CHART_DIR' --values '$TEST_VALUES'"
else
    print_status "WARN" "Test values file not found, skipping test values lint"
fi

# Test 3: Template rendering with default values
run_test "Template rendering with default values" "helm template test-release '$CHART_DIR' --dry-run > /dev/null"

# Test 4: Template rendering with test values
if [ -f "$TEST_VALUES" ]; then
    run_test "Template rendering with test values" "helm template test-release '$CHART_DIR' --values '$TEST_VALUES' --dry-run > /dev/null"
fi

# Test 5: Template rendering with different configurations
echo -e "\n${BLUE}--- Testing Different Configurations ---${NC}"

# Test with monitoring enabled
run_test "Template rendering with monitoring enabled" "helm template test-release '$CHART_DIR' --set monitoring.enabled=true --dry-run > /dev/null"

# Test with logging enabled
run_test "Template rendering with logging enabled" "helm template test-release '$CHART_DIR' --set logging.enabled=true --dry-run > /dev/null"

# Test with backup enabled
run_test "Template rendering with backup enabled" "helm template test-release '$CHART_DIR' --set backup.enabled=true --dry-run > /dev/null"

# Test with external database
run_test "Template rendering with external database" "helm template test-release '$CHART_DIR' --set mysql.enabled=false --set mysql.external.enabled=true --dry-run > /dev/null"

# Test with TLS enabled
run_test "Template rendering with TLS enabled" "helm template test-release '$CHART_DIR' --set tls.enabled=true --set frontend.ingress.enabled=true --dry-run > /dev/null"

# Test 6: Check for required values
echo -e "\n${BLUE}--- Testing Required Values ---${NC}"

# Test without required values (should fail gracefully)
run_test "Template rendering without image repository" "helm template test-release '$CHART_DIR' --set frontend.image.repository='' --dry-run > /dev/null" 1

# Test 7: Validate YAML syntax
echo -e "\n${BLUE}--- Validating YAML Syntax ---${NC}"

# Check Chart.yaml syntax
if python3 -c "import yaml; yaml.safe_load(open('$CHART_DIR/Chart.yaml'))" 2>/dev/null; then
    print_status "PASS" "Chart.yaml has valid YAML syntax"
else
    print_status "FAIL" "Chart.yaml has invalid YAML syntax"
fi

# Check values.yaml syntax
if python3 -c "import yaml; yaml.safe_load(open('$CHART_DIR/values.yaml'))" 2>/dev/null; then
    print_status "PASS" "values.yaml has valid YAML syntax"
else
    print_status "FAIL" "values.yaml has invalid YAML syntax"
fi

# Check template files syntax
YAML_ERRORS=0
for template_file in $(find "$CHART_DIR/templates" -name "*.yaml" -o -name "*.yml"); do
    # Skip files that are not valid YAML (like NOTES.txt)
    if [[ "$template_file" == *"NOTES.txt" ]]; then
        continue
    fi
    
    # Render template and check YAML syntax
    if helm template test-release "$CHART_DIR" --show-only "$(basename "$template_file")" 2>/dev/null | python3 -c "import sys, yaml; yaml.safe_load_all(sys.stdin)" 2>/dev/null; then
        print_status "PASS" "$(basename "$template_file") renders to valid YAML"
    else
        print_status "FAIL" "$(basename "$template_file") renders to invalid YAML"
        YAML_ERRORS=$((YAML_ERRORS + 1))
    fi
done

# Test 8: Check for common issues
echo -e "\n${BLUE}--- Checking for Common Issues ---${NC}"

# Check for hardcoded values
if grep -r "localhost" "$CHART_DIR/templates" >/dev/null 2>&1; then
    print_status "WARN" "Found hardcoded 'localhost' in templates"
else
    print_status "PASS" "No hardcoded 'localhost' found"
fi

# Check for missing labels
RENDERED_TEMPLATES=$(helm template test-release "$CHART_DIR" 2>/dev/null)
if echo "$RENDERED_TEMPLATES" | grep -E "^kind: (Deployment|Service|ConfigMap|Secret)" | while read -r line; do
    # This is a simplified check - in practice, you'd want more sophisticated validation
    echo "$RENDERED_TEMPLATES" | grep -A 10 "$line" | grep -q "app.kubernetes.io/name"
done; then
    print_status "PASS" "Resources have proper labels"
else
    print_status "WARN" "Some resources might be missing standard labels"
fi

# Test 9: Security checks
echo -e "\n${BLUE}--- Security Checks ---${NC}"

# Check for privileged containers
if echo "$RENDERED_TEMPLATES" | grep -q "privileged: true"; then
    print_status "WARN" "Found privileged containers"
else
    print_status "PASS" "No privileged containers found"
fi

# Check for containers running as root
if echo "$RENDERED_TEMPLATES" | grep -q "runAsUser: 0"; then
    print_status "WARN" "Found containers running as root"
else
    print_status "PASS" "No containers explicitly running as root"
fi

# Test 10: Resource validation
echo -e "\n${BLUE}--- Resource Validation ---${NC}"

# Check if resources have limits
if echo "$RENDERED_TEMPLATES" | grep -A 20 "kind: Deployment" | grep -q "limits:"; then
    print_status "PASS" "Deployments have resource limits"
else
    print_status "WARN" "Some deployments might be missing resource limits"
fi

# Summary
echo -e "\n${BLUE}=== Validation Summary ===${NC}"

if [ $YAML_ERRORS -eq 0 ]; then
    print_status "PASS" "All YAML syntax checks passed"
else
    print_status "FAIL" "$YAML_ERRORS YAML syntax errors found"
fi

# Final validation with helm template
echo -e "\n${BLUE}--- Final Validation ---${NC}"
if helm template test-release "$CHART_DIR" >/dev/null 2>&1; then
    print_status "PASS" "Chart templates render successfully"
    echo -e "\n${GREEN}✅ Helm chart validation completed successfully!${NC}"
    exit 0
else
    print_status "FAIL" "Chart templates failed to render"
    echo -e "\n${RED}❌ Helm chart validation failed!${NC}"
    exit 1
fi
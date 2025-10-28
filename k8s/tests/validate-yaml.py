#!/usr/bin/env python3
"""
YAML Validation Script for secure-api-system Helm Chart
This script validates YAML syntax and basic structure of Helm templates
"""

import os
import sys
import yaml
import glob
import re
from pathlib import Path

# Colors for output
class Colors:
    RED = '\033[0;31m'
    GREEN = '\033[0;32m'
    YELLOW = '\033[1;33m'
    BLUE = '\033[0;34m'
    NC = '\033[0m'  # No Color

def print_status(status, message):
    """Print status message with color"""
    if status == "PASS":
        print(f"{Colors.GREEN}[PASS]{Colors.NC} {message}")
    elif status == "FAIL":
        print(f"{Colors.RED}[FAIL]{Colors.NC} {message}")
    elif status == "WARN":
        print(f"{Colors.YELLOW}[WARN]{Colors.NC} {message}")
    else:
        print(f"{Colors.BLUE}[INFO]{Colors.NC} {message}")

def validate_yaml_syntax(file_path):
    """Validate YAML syntax of a file"""
    try:
        with open(file_path, 'r', encoding='utf-8') as file:
            yaml.safe_load(file)
        return True, None
    except yaml.YAMLError as e:
        return False, str(e)
    except Exception as e:
        return False, str(e)

def validate_helm_template_syntax(file_path):
    """Basic validation of Helm template syntax"""
    try:
        with open(file_path, 'r', encoding='utf-8') as file:
            content = file.read()
        
        # Check for common Helm template issues
        issues = []
        
        # Check for unmatched braces
        open_braces = content.count('{{')
        close_braces = content.count('}}')
        if open_braces != close_braces:
            issues.append(f"Unmatched braces: {open_braces} opening, {close_braces} closing")
        
        # Check for common template functions
        template_functions = [
            'include', 'template', 'toYaml', 'quote', 'default',
            'required', 'printf', 'print', 'println'
        ]
        
        # Check for potential syntax issues
        lines = content.split('\n')
        for i, line in enumerate(lines, 1):
            # Check for unclosed quotes in template expressions
            if '{{' in line and '}}' in line:
                template_part = line[line.find('{{'):line.rfind('}}') + 2]
                if template_part.count('"') % 2 != 0:
                    issues.append(f"Line {i}: Potential unclosed quote in template expression")
        
        return len(issues) == 0, issues
    except Exception as e:
        return False, [str(e)]

def check_required_files(chart_dir):
    """Check if required Helm chart files exist"""
    required_files = [
        'Chart.yaml',
        'values.yaml',
        'templates'
    ]
    
    missing_files = []
    for file_name in required_files:
        file_path = os.path.join(chart_dir, file_name)
        if not os.path.exists(file_path):
            missing_files.append(file_name)
    
    return len(missing_files) == 0, missing_files

def validate_chart_yaml(chart_dir):
    """Validate Chart.yaml structure"""
    chart_file = os.path.join(chart_dir, 'Chart.yaml')
    
    try:
        with open(chart_file, 'r', encoding='utf-8') as file:
            chart_data = yaml.safe_load(file)
        
        required_fields = ['apiVersion', 'name', 'version']
        missing_fields = []
        
        for field in required_fields:
            if field not in chart_data:
                missing_fields.append(field)
        
        # Check API version
        if 'apiVersion' in chart_data and chart_data['apiVersion'] not in ['v1', 'v2']:
            missing_fields.append('invalid apiVersion (should be v1 or v2)')
        
        return len(missing_fields) == 0, missing_fields, chart_data
    except Exception as e:
        return False, [str(e)], None

def validate_values_yaml(chart_dir):
    """Validate values.yaml structure"""
    values_file = os.path.join(chart_dir, 'values.yaml')
    
    try:
        with open(values_file, 'r', encoding='utf-8') as file:
            values_data = yaml.safe_load(file)
        
        # Basic structure validation
        if not isinstance(values_data, dict):
            return False, ["values.yaml should contain a dictionary"], None
        
        return True, [], values_data
    except Exception as e:
        return False, [str(e)], None

def find_template_files(chart_dir):
    """Find all template files in the chart"""
    templates_dir = os.path.join(chart_dir, 'templates')
    if not os.path.exists(templates_dir):
        return []
    
    template_files = []
    for root, dirs, files in os.walk(templates_dir):
        for file in files:
            if file.endswith(('.yaml', '.yml')):
                template_files.append(os.path.join(root, file))
    
    return template_files

def check_security_issues(chart_dir):
    """Check for potential security issues in templates"""
    template_files = find_template_files(chart_dir)
    security_issues = []
    
    for template_file in template_files:
        try:
            with open(template_file, 'r', encoding='utf-8') as file:
                content = file.read()
            
            # Check for hardcoded secrets
            if re.search(r'password:\s*["\']?[^{}\s]+["\']?', content, re.IGNORECASE):
                security_issues.append(f"{os.path.basename(template_file)}: Potential hardcoded password")
            
            # Check for privileged containers
            if 'privileged: true' in content:
                security_issues.append(f"{os.path.basename(template_file)}: Privileged container found")
            
            # Check for containers running as root
            if 'runAsUser: 0' in content:
                security_issues.append(f"{os.path.basename(template_file)}: Container running as root")
            
        except Exception as e:
            security_issues.append(f"{os.path.basename(template_file)}: Error reading file - {e}")
    
    return security_issues

def main():
    """Main validation function"""
    print(f"{Colors.BLUE}=== Helm Chart YAML Validation ==={Colors.NC}")
    
    # Get chart directory
    script_dir = os.path.dirname(os.path.abspath(__file__))
    chart_dir = os.path.dirname(script_dir)
    
    print(f"Chart directory: {chart_dir}")
    print()
    
    # Check if chart directory exists
    if not os.path.exists(chart_dir):
        print_status("FAIL", f"Chart directory not found: {chart_dir}")
        sys.exit(1)
    
    # Check required files
    print(f"{Colors.BLUE}=== Checking Required Files ==={Colors.NC}")
    files_ok, missing_files = check_required_files(chart_dir)
    
    if files_ok:
        print_status("PASS", "All required files exist")
    else:
        print_status("FAIL", f"Missing required files: {', '.join(missing_files)}")
        sys.exit(1)
    
    # Validate Chart.yaml
    print(f"\n{Colors.BLUE}=== Validating Chart.yaml ==={Colors.NC}")
    chart_ok, chart_issues, chart_data = validate_chart_yaml(chart_dir)
    
    if chart_ok:
        print_status("PASS", "Chart.yaml is valid")
        if chart_data:
            print_status("INFO", f"Chart name: {chart_data.get('name', 'unknown')}")
            print_status("INFO", f"Chart version: {chart_data.get('version', 'unknown')}")
            print_status("INFO", f"API version: {chart_data.get('apiVersion', 'unknown')}")
    else:
        print_status("FAIL", f"Chart.yaml validation failed: {', '.join(chart_issues)}")
    
    # Validate values.yaml
    print(f"\n{Colors.BLUE}=== Validating values.yaml ==={Colors.NC}")
    values_ok, values_issues, values_data = validate_values_yaml(chart_dir)
    
    if values_ok:
        print_status("PASS", "values.yaml is valid")
        if values_data:
            print_status("INFO", f"Found {len(values_data)} top-level configuration sections")
    else:
        print_status("FAIL", f"values.yaml validation failed: {', '.join(values_issues)}")
    
    # Validate template files
    print(f"\n{Colors.BLUE}=== Validating Template Files ==={Colors.NC}")
    template_files = find_template_files(chart_dir)
    
    if not template_files:
        print_status("WARN", "No template files found")
    else:
        print_status("INFO", f"Found {len(template_files)} template files")
        
        yaml_errors = 0
        template_errors = 0
        
        for template_file in template_files:
            file_name = os.path.basename(template_file)
            
            # Skip NOTES.txt as it's not a YAML template
            if file_name == 'NOTES.txt':
                continue
            
            # Validate YAML syntax (basic check, ignoring Helm templates)
            yaml_ok, yaml_error = validate_yaml_syntax(template_file)
            if not yaml_ok and 'found character that cannot start any token' not in str(yaml_error):
                print_status("FAIL", f"{file_name}: YAML syntax error - {yaml_error}")
                yaml_errors += 1
            else:
                print_status("PASS", f"{file_name}: Basic YAML structure OK")
            
            # Validate Helm template syntax
            template_ok, template_issues = validate_helm_template_syntax(template_file)
            if not template_ok:
                print_status("FAIL", f"{file_name}: Template issues - {', '.join(template_issues)}")
                template_errors += 1
            else:
                print_status("PASS", f"{file_name}: Template syntax OK")
    
    # Security checks
    print(f"\n{Colors.BLUE}=== Security Checks ==={Colors.NC}")
    security_issues = check_security_issues(chart_dir)
    
    if not security_issues:
        print_status("PASS", "No obvious security issues found")
    else:
        for issue in security_issues:
            print_status("WARN", f"Security concern: {issue}")
    
    # Check for best practices
    print(f"\n{Colors.BLUE}=== Best Practices Check ==={Colors.NC}")
    
    # Check if .helmignore exists
    helmignore_path = os.path.join(chart_dir, '.helmignore')
    if os.path.exists(helmignore_path):
        print_status("PASS", ".helmignore file exists")
    else:
        print_status("WARN", ".helmignore file not found")
    
    # Check if README exists
    readme_files = glob.glob(os.path.join(chart_dir, 'README*'))
    if readme_files:
        print_status("PASS", "README file exists")
    else:
        print_status("WARN", "README file not found")
    
    # Summary
    print(f"\n{Colors.BLUE}=== Validation Summary ==={Colors.NC}")
    
    total_errors = 0
    if not chart_ok:
        total_errors += 1
    if not values_ok:
        total_errors += 1
    if 'yaml_errors' in locals():
        total_errors += yaml_errors
    if 'template_errors' in locals():
        total_errors += template_errors
    
    if total_errors == 0:
        print_status("PASS", "All validations passed")
        print(f"\n{Colors.GREEN}✅ Helm chart validation completed successfully!{Colors.NC}")
        sys.exit(0)
    else:
        print_status("FAIL", f"Found {total_errors} validation errors")
        print(f"\n{Colors.RED}❌ Helm chart validation failed!{Colors.NC}")
        sys.exit(1)

if __name__ == "__main__":
    main()
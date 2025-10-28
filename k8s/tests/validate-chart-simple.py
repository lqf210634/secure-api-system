#!/usr/bin/env python3
"""
Simple Helm Chart Validation Script
This script performs basic validation without external dependencies
"""

import os
import sys
import re
import json

def print_status(status, message):
    """Print status message"""
    if status == "PASS":
        print(f"[PASS] {message}")
    elif status == "FAIL":
        print(f"[FAIL] {message}")
    elif status == "WARN":
        print(f"[WARN] {message}")
    else:
        print(f"[INFO] {message}")

def check_file_exists(file_path):
    """Check if file exists"""
    return os.path.exists(file_path)

def read_file_content(file_path):
    """Read file content safely"""
    try:
        with open(file_path, 'r', encoding='utf-8') as file:
            return file.read()
    except Exception as e:
        return None

def basic_yaml_check(content):
    """Basic YAML syntax check"""
    lines = content.split('\n')
    issues = []
    
    for i, line in enumerate(lines, 1):
        # Skip empty lines and comments
        stripped = line.strip()
        if not stripped or stripped.startswith('#'):
            continue
            
        # Check for basic YAML issues
        if line.startswith(' ') and not line.startswith('  '):
            if ':' in line:
                issues.append(f"Line {i}: Possible indentation issue (use 2 spaces)")
        
        # Check for tabs
        if '\t' in line:
            issues.append(f"Line {i}: Contains tabs (use spaces instead)")
    
    return issues

def check_helm_template_syntax(content):
    """Check basic Helm template syntax"""
    issues = []
    
    # Count braces
    open_braces = content.count('{{')
    close_braces = content.count('}}')
    if open_braces != close_braces:
        issues.append(f"Unmatched template braces: {open_braces} opening, {close_braces} closing")
    
    # Check for common template issues
    lines = content.split('\n')
    for i, line in enumerate(lines, 1):
        if '{{' in line and '}}' in line:
            # Check for basic template syntax
            template_parts = re.findall(r'\{\{.*?\}\}', line)
            for template in template_parts:
                # Check for unclosed quotes
                if template.count('"') % 2 != 0:
                    issues.append(f"Line {i}: Possible unclosed quote in template")
    
    return issues

def check_security_issues(content, filename):
    """Check for basic security issues"""
    issues = []
    
    # Check for hardcoded passwords
    if re.search(r'password:\s*["\']?[^{}\s\'"]+["\']?', content, re.IGNORECASE):
        if '{{' not in content or '}}' not in content:
            issues.append(f"{filename}: Possible hardcoded password")
    
    # Check for privileged containers
    if 'privileged: true' in content:
        issues.append(f"{filename}: Privileged container found")
    
    # Check for root user
    if 'runAsUser: 0' in content:
        issues.append(f"{filename}: Container running as root")
    
    return issues

def main():
    """Main validation function"""
    print("=== Simple Helm Chart Validation ===")
    
    # Get chart directory
    script_dir = os.path.dirname(os.path.abspath(__file__))
    chart_dir = os.path.dirname(script_dir)
    
    print(f"Chart directory: {chart_dir}")
    print()
    
    # Check required files
    print("=== Checking Required Files ===")
    required_files = ['Chart.yaml', 'values.yaml']
    missing_files = []
    
    for file_name in required_files:
        file_path = os.path.join(chart_dir, file_name)
        if check_file_exists(file_path):
            print_status("PASS", f"{file_name} exists")
        else:
            print_status("FAIL", f"{file_name} missing")
            missing_files.append(file_name)
    
    # Check templates directory
    templates_dir = os.path.join(chart_dir, 'templates')
    if check_file_exists(templates_dir):
        print_status("PASS", "templates directory exists")
    else:
        print_status("FAIL", "templates directory missing")
        missing_files.append("templates/")
    
    if missing_files:
        print_status("FAIL", f"Missing required files: {', '.join(missing_files)}")
        return False
    
    # Validate Chart.yaml
    print("\n=== Validating Chart.yaml ===")
    chart_file = os.path.join(chart_dir, 'Chart.yaml')
    chart_content = read_file_content(chart_file)
    
    if chart_content:
        yaml_issues = basic_yaml_check(chart_content)
        if not yaml_issues:
            print_status("PASS", "Chart.yaml basic syntax OK")
        else:
            for issue in yaml_issues:
                print_status("FAIL", f"Chart.yaml: {issue}")
        
        # Check for required fields
        required_fields = ['apiVersion:', 'name:', 'version:']
        for field in required_fields:
            if field in chart_content:
                print_status("PASS", f"Chart.yaml contains {field.rstrip(':')}")
            else:
                print_status("FAIL", f"Chart.yaml missing {field.rstrip(':')}")
    else:
        print_status("FAIL", "Cannot read Chart.yaml")
    
    # Validate values.yaml
    print("\n=== Validating values.yaml ===")
    values_file = os.path.join(chart_dir, 'values.yaml')
    values_content = read_file_content(values_file)
    
    if values_content:
        yaml_issues = basic_yaml_check(values_content)
        if not yaml_issues:
            print_status("PASS", "values.yaml basic syntax OK")
        else:
            for issue in yaml_issues:
                print_status("FAIL", f"values.yaml: {issue}")
    else:
        print_status("FAIL", "Cannot read values.yaml")
    
    # Validate template files
    print("\n=== Validating Template Files ===")
    templates_dir = os.path.join(chart_dir, 'templates')
    
    if os.path.exists(templates_dir):
        template_files = []
        for root, dirs, files in os.walk(templates_dir):
            for file in files:
                if file.endswith(('.yaml', '.yml')) and file != 'NOTES.txt':
                    template_files.append(os.path.join(root, file))
        
        print_status("INFO", f"Found {len(template_files)} template files")
        
        total_issues = 0
        for template_file in template_files:
            file_name = os.path.basename(template_file)
            content = read_file_content(template_file)
            
            if content:
                # Basic YAML check
                yaml_issues = basic_yaml_check(content)
                if not yaml_issues:
                    print_status("PASS", f"{file_name}: Basic YAML syntax OK")
                else:
                    for issue in yaml_issues:
                        print_status("FAIL", f"{file_name}: {issue}")
                        total_issues += 1
                
                # Helm template check
                template_issues = check_helm_template_syntax(content)
                if not template_issues:
                    print_status("PASS", f"{file_name}: Template syntax OK")
                else:
                    for issue in template_issues:
                        print_status("FAIL", f"{file_name}: {issue}")
                        total_issues += 1
                
                # Security check
                security_issues = check_security_issues(content, file_name)
                for issue in security_issues:
                    print_status("WARN", f"Security: {issue}")
            else:
                print_status("FAIL", f"Cannot read {file_name}")
                total_issues += 1
    
    # Check for best practices
    print("\n=== Best Practices Check ===")
    
    # Check .helmignore
    helmignore_path = os.path.join(chart_dir, '.helmignore')
    if check_file_exists(helmignore_path):
        print_status("PASS", ".helmignore exists")
    else:
        print_status("WARN", ".helmignore not found")
    
    # Check README
    readme_files = ['README.md', 'README.txt', 'README']
    readme_found = False
    for readme in readme_files:
        if check_file_exists(os.path.join(chart_dir, readme)):
            print_status("PASS", f"{readme} exists")
            readme_found = True
            break
    
    if not readme_found:
        print_status("WARN", "No README file found")
    
    # Check NOTES.txt
    notes_path = os.path.join(chart_dir, 'templates', 'NOTES.txt')
    if check_file_exists(notes_path):
        print_status("PASS", "NOTES.txt exists")
    else:
        notes_path = os.path.join(chart_dir, 'NOTES.txt')
        if check_file_exists(notes_path):
            print_status("PASS", "NOTES.txt exists")
        else:
            print_status("WARN", "NOTES.txt not found")
    
    print("\n=== Validation Summary ===")
    
    if 'total_issues' in locals() and total_issues > 0:
        print_status("FAIL", f"Found {total_issues} issues")
        print("\n❌ Validation completed with issues!")
        return False
    else:
        print_status("PASS", "Basic validation passed")
        print("\n✅ Basic validation completed successfully!")
        return True

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
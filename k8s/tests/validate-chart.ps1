# Helm Chart Validation Script for Windows PowerShell
# This script performs basic validation of Helm chart structure and syntax

param(
    [string]$ChartPath = ".."
)

# Colors for output
$Red = "`e[31m"
$Green = "`e[32m"
$Yellow = "`e[33m"
$Blue = "`e[34m"
$Reset = "`e[0m"

function Write-Status {
    param(
        [string]$Status,
        [string]$Message
    )
    
    switch ($Status) {
        "PASS" { Write-Host "${Green}[PASS]${Reset} $Message" }
        "FAIL" { Write-Host "${Red}[FAIL]${Reset} $Message" }
        "WARN" { Write-Host "${Yellow}[WARN]${Reset} $Message" }
        "INFO" { Write-Host "${Blue}[INFO]${Reset} $Message" }
        default { Write-Host "[INFO] $Message" }
    }
}

function Test-FileExists {
    param([string]$FilePath)
    return Test-Path $FilePath
}

function Test-YamlBasicSyntax {
    param([string]$FilePath)
    
    if (-not (Test-Path $FilePath)) {
        return @{ Valid = $false; Issues = @("File not found") }
    }
    
    $content = Get-Content $FilePath -Raw
    $issues = @()
    
    # Check for tabs (should use spaces)
    if ($content -match "`t") {
        $issues += "Contains tabs (should use spaces for indentation)"
    }
    
    # Check for basic YAML structure
    $lines = Get-Content $FilePath
    for ($i = 0; $i -lt $lines.Count; $i++) {
        $line = $lines[$i]
        $lineNum = $i + 1
        
        # Skip empty lines and comments
        if ($line.Trim() -eq "" -or $line.Trim().StartsWith("#")) {
            continue
        }
        
        # Check indentation (should be multiples of 2)
        if ($line -match "^( +)") {
            $indent = $matches[1].Length
            if ($indent % 2 -ne 0) {
                $issues += "Line $lineNum`: Indentation should be multiples of 2 spaces"
            }
        }
    }
    
    return @{ Valid = ($issues.Count -eq 0); Issues = $issues }
}

function Test-HelmTemplateSyntax {
    param([string]$FilePath)
    
    if (-not (Test-Path $FilePath)) {
        return @{ Valid = $false; Issues = @("File not found") }
    }
    
    $lines = Get-Content $FilePath
    $issues = @()
    $openBraces = 0
    $closeBraces = 0
    $inJsonBlock = $false
    
    # Count template braces excluding JSON content
    foreach ($line in $lines) {
        # Detect JSON block start
        if ($line -match 'dashboard\.json:\s*\|') {
            $inJsonBlock = $true
            continue
        }
        
        # Detect JSON block end
        if ($inJsonBlock -and $line -match '^---') {
            $inJsonBlock = $false
            continue
        }
        
        # Only count Helm template braces outside JSON blocks
        if (-not $inJsonBlock) {
            $openBraces += ($line | Select-String -Pattern "\{\{" -AllMatches).Matches.Count
            $closeBraces += ($line | Select-String -Pattern "\}\}" -AllMatches).Matches.Count
        }
    }
    
    if ($openBraces -ne $closeBraces) {
        $issues += "Unmatched template braces: $openBraces opening, $closeBraces closing"
    }
    
    # Check for common template issues
    $lines = Get-Content $FilePath
    for ($i = 0; $i -lt $lines.Count; $i++) {
        $line = $lines[$i]
        $lineNum = $i + 1
        
        if ($line -match "\{\{.*\}\}") {
            # Check for unclosed quotes in templates
            $templateMatches = [regex]::Matches($line, "\{\{.*?\}\}")
            foreach ($match in $templateMatches) {
                $template = $match.Value
                $quoteCount = ($template | Select-String -Pattern '"' -AllMatches).Matches.Count
                if ($quoteCount % 2 -ne 0) {
                    $issues += "Line $lineNum`: Possible unclosed quote in template"
                }
            }
        }
    }
    
    return @{ Valid = ($issues.Count -eq 0); Issues = $issues }
}

function Test-SecurityIssues {
    param([string]$FilePath)
    
    if (-not (Test-Path $FilePath)) {
        return @()
    }
    
    $content = Get-Content $FilePath -Raw
    $issues = @()
    $fileName = Split-Path $FilePath -Leaf
    
    # Check for hardcoded passwords
    if ($content -match "password:\s*[`"']?[^{}\s`"']+[`"']?" -and $content -notmatch "\{\{.*\}\}") {
        $issues += "$fileName`: Possible hardcoded password"
    }
    
    # Check for privileged containers
    if ($content -match "privileged:\s*true") {
        $issues += "$fileName`: Privileged container found"
    }
    
    # Check for root user
    if ($content -match "runAsUser:\s*0") {
        $issues += "$fileName`: Container running as root"
    }
    
    return $issues
}

# Main validation
Write-Host "${Blue}=== Helm Chart Validation ===${Reset}"
Write-Host "Chart directory: $ChartPath"
Write-Host ""

# Resolve chart path
$ChartDir = Resolve-Path $ChartPath -ErrorAction SilentlyContinue
if (-not $ChartDir) {
    Write-Status "FAIL" "Chart directory not found: $ChartPath"
    exit 1
}

# Check required files
Write-Host "${Blue}=== Checking Required Files ===${Reset}"
$requiredFiles = @("Chart.yaml", "values.yaml")
$missingFiles = @()

foreach ($file in $requiredFiles) {
    $filePath = Join-Path $ChartDir $file
    if (Test-FileExists $filePath) {
        Write-Status "PASS" "$file exists"
    } else {
        Write-Status "FAIL" "$file missing"
        $missingFiles += $file
    }
}

# Check templates directory
$templatesDir = Join-Path $ChartDir "templates"
if (Test-FileExists $templatesDir) {
    Write-Status "PASS" "templates directory exists"
} else {
    Write-Status "FAIL" "templates directory missing"
    $missingFiles += "templates/"
}

if ($missingFiles.Count -gt 0) {
    Write-Status "FAIL" "Missing required files: $($missingFiles -join ', ')"
    exit 1
}

# Validate Chart.yaml
Write-Host ""
Write-Host "${Blue}=== Validating Chart.yaml ===${Reset}"
$chartFile = Join-Path $ChartDir "Chart.yaml"
$chartValidation = Test-YamlBasicSyntax $chartFile

if ($chartValidation.Valid) {
    Write-Status "PASS" "Chart.yaml basic syntax OK"
} else {
    foreach ($issue in $chartValidation.Issues) {
        Write-Status "FAIL" "Chart.yaml: $issue"
    }
}

# Check for required fields in Chart.yaml
$chartContent = Get-Content $chartFile -Raw
$requiredFields = @("apiVersion:", "name:", "version:")
foreach ($field in $requiredFields) {
    if ($chartContent -match $field) {
        Write-Status "PASS" "Chart.yaml contains $($field.TrimEnd(':'))"
    } else {
        Write-Status "FAIL" "Chart.yaml missing $($field.TrimEnd(':'))"
    }
}

# Validate values.yaml
Write-Host ""
Write-Host "${Blue}=== Validating values.yaml ===${Reset}"
$valuesFile = Join-Path $ChartDir "values.yaml"
$valuesValidation = Test-YamlBasicSyntax $valuesFile

if ($valuesValidation.Valid) {
    Write-Status "PASS" "values.yaml basic syntax OK"
} else {
    foreach ($issue in $valuesValidation.Issues) {
        Write-Status "FAIL" "values.yaml: $issue"
    }
}

# Validate template files
Write-Host ""
Write-Host "${Blue}=== Validating Template Files ===${Reset}"

if (Test-Path $templatesDir) {
    $templateFiles = Get-ChildItem $templatesDir -Recurse -Include "*.yaml", "*.yml" | Where-Object { $_.Name -ne "NOTES.txt" }
    
    Write-Status "INFO" "Found $($templateFiles.Count) template files"
    
    $totalIssues = 0
    foreach ($templateFile in $templateFiles) {
        $fileName = $templateFile.Name
        
        # Basic YAML check
        $yamlValidation = Test-YamlBasicSyntax $templateFile.FullName
        if ($yamlValidation.Valid) {
            Write-Status "PASS" "$fileName`: Basic YAML syntax OK"
        } else {
            foreach ($issue in $yamlValidation.Issues) {
                Write-Status "FAIL" "$fileName`: $issue"
                $totalIssues++
            }
        }
        
        # Helm template check
        $templateValidation = Test-HelmTemplateSyntax $templateFile.FullName
        if ($templateValidation.Valid) {
            Write-Status "PASS" "$fileName`: Template syntax OK"
        } else {
            foreach ($issue in $templateValidation.Issues) {
                Write-Status "FAIL" "$fileName`: $issue"
                $totalIssues++
            }
        }
        
        # Security check
        $securityIssues = Test-SecurityIssues $templateFile.FullName
        foreach ($issue in $securityIssues) {
            Write-Status "WARN" "Security: $issue"
        }
    }
}

# Best practices check
Write-Host ""
Write-Host "${Blue}=== Best Practices Check ===${Reset}"

# Check .helmignore
$helmignorePath = Join-Path $ChartDir ".helmignore"
if (Test-FileExists $helmignorePath) {
    Write-Status "PASS" ".helmignore exists"
} else {
    Write-Status "WARN" ".helmignore not found"
}

# Check README
$readmeFiles = @("README.md", "README.txt", "README")
$readmeFound = $false
foreach ($readme in $readmeFiles) {
    $readmePath = Join-Path $ChartDir $readme
    if (Test-FileExists $readmePath) {
        Write-Status "PASS" "$readme exists"
        $readmeFound = $true
        break
    }
}

if (-not $readmeFound) {
    Write-Status "WARN" "No README file found"
}

# Check NOTES.txt
$notesPath1 = Join-Path $templatesDir "NOTES.txt"
$notesPath2 = Join-Path $ChartDir "NOTES.txt"
if ((Test-FileExists $notesPath1) -or (Test-FileExists $notesPath2)) {
    Write-Status "PASS" "NOTES.txt exists"
} else {
    Write-Status "WARN" "NOTES.txt not found"
}

# Summary
Write-Host ""
Write-Host "${Blue}=== Validation Summary ===${Reset}"

if ($totalIssues -gt 0) {
    Write-Status "FAIL" "Found $totalIssues issues"
    Write-Host ""
    Write-Host "${Red}❌ Validation completed with issues!${Reset}"
    exit 1
} else {
    Write-Status "PASS" "Basic validation passed"
    Write-Host ""
    Write-Host "${Green}✅ Basic validation completed successfully!${Reset}"
    exit 0
}
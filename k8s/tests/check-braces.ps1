# Check for unmatched Helm template braces in monitoring.yaml
param(
    [string]$FilePath = "../templates/monitoring.yaml"
)

Write-Host "Checking Helm template braces in $FilePath..." -ForegroundColor Yellow

if (-not (Test-Path $FilePath)) {
    Write-Host "File not found: $FilePath" -ForegroundColor Red
    exit 1
}

$content = Get-Content $FilePath -Raw
$lines = Get-Content $FilePath

$openBraces = 0
$lineNumber = 0
$issues = @()
$inJsonBlock = $false

foreach ($line in $lines) {
    $lineNumber++
    
    # Detect if we're in a JSON block (dashboard.json content)
    if ($line -match 'dashboard\.json:\s*\|') {
        $inJsonBlock = $true
        continue
    }
    if ($inJsonBlock -and $line -match '^---') {
        $inJsonBlock = $false
        continue
    }
    
    # Only check Helm template braces, not JSON braces
    if (-not $inJsonBlock) {
        # Count Helm template opening and closing braces
        $openCount = ($line | Select-String -Pattern '\{\{' -AllMatches).Matches.Count
        $closeCount = ($line | Select-String -Pattern '\}\}' -AllMatches).Matches.Count
        
        $openBraces += $openCount - $closeCount
        
        if ($openBraces -lt 0) {
            $issues += "Line $lineNumber`: Too many closing braces - $line"
            $openBraces = 0  # Reset to prevent cascading errors
        }
    }
}

if ($openBraces -gt 0) {
    $issues += "End of file: $openBraces unclosed Helm template opening braces"
}

if ($issues.Count -eq 0) {
    Write-Host "✓ No Helm template brace matching issues found!" -ForegroundColor Green
} else {
    Write-Host "✗ Found $($issues.Count) Helm template brace issues:" -ForegroundColor Red
    foreach ($issue in $issues) {
        Write-Host "  $issue" -ForegroundColor Yellow
    }
}

$totalOpen = ($content | Select-String -Pattern '\{\{' -AllMatches).Matches.Count
$totalClose = ($content | Select-String -Pattern '\}\}' -AllMatches).Matches.Count

Write-Host "`nTotal Helm template opening braces: $totalOpen"
Write-Host "Total Helm template closing braces: $totalClose"

if ($totalOpen -eq $totalClose) {
    Write-Host "✓ Overall brace count matches!" -ForegroundColor Green
} else {
    Write-Host "✗ Brace count mismatch: $($totalOpen - $totalClose) difference" -ForegroundColor Red
}
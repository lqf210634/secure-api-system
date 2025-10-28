# Count Helm template braces excluding JSON content
param(
    [string]$FilePath = "../templates/monitoring.yaml"
)

Write-Host "Counting Helm template braces in $FilePath..." -ForegroundColor Yellow

if (-not (Test-Path $FilePath)) {
    Write-Host "File not found: $FilePath" -ForegroundColor Red
    exit 1
}

$lines = Get-Content $FilePath
$lineNumber = 0
$openCount = 0
$closeCount = 0
$inJsonBlock = $false

foreach ($line in $lines) {
    $lineNumber++
    
    # Detect JSON block start
    if ($line -match 'dashboard\.json:\s*\|') {
        $inJsonBlock = $true
        Write-Host "JSON block starts at line $lineNumber" -ForegroundColor Cyan
        continue
    }
    
    # Detect JSON block end
    if ($inJsonBlock -and $line -match '^---') {
        $inJsonBlock = $false
        Write-Host "JSON block ends at line $lineNumber" -ForegroundColor Cyan
        continue
    }
    
    # Only count Helm template braces outside JSON blocks
    if (-not $inJsonBlock) {
        $lineOpenCount = ($line | Select-String -Pattern '\{\{' -AllMatches).Matches.Count
        $lineCloseCount = ($line | Select-String -Pattern '\}\}' -AllMatches).Matches.Count
        
        if ($lineOpenCount -gt 0 -or $lineCloseCount -gt 0) {
            Write-Host "Line $lineNumber`: Open=$lineOpenCount, Close=$lineCloseCount - $($line.Trim())" -ForegroundColor Gray
        }
        
        $openCount += $lineOpenCount
        $closeCount += $lineCloseCount
    }
}

Write-Host "`nResults:" -ForegroundColor Yellow
Write-Host "Total Helm template opening braces: $openCount" -ForegroundColor White
Write-Host "Total Helm template closing braces: $closeCount" -ForegroundColor White

if ($openCount -eq $closeCount) {
    Write-Host "✓ Helm template braces are balanced!" -ForegroundColor Green
} else {
    $diff = $openCount - $closeCount
    if ($diff -gt 0) {
        Write-Host "✗ $diff unclosed opening braces" -ForegroundColor Red
    } else {
        Write-Host "✗ $([Math]::Abs($diff)) extra closing braces" -ForegroundColor Red
    }
}
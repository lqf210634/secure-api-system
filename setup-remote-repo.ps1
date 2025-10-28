# GitHub 远程仓库设置脚本
# 使用方法: .\setup-remote-repo.ps1 YOUR_GITHUB_USERNAME

param(
    [Parameter(Mandatory=$true)]
    [string]$GitHubUsername
)

Write-Host "🚀 开始设置 GitHub 远程仓库..." -ForegroundColor Green
Write-Host "📋 GitHub 用户名: $GitHubUsername" -ForegroundColor Cyan

# 检查是否已经有远程仓库
$remoteExists = git remote get-url origin 2>$null
if ($remoteExists) {
    Write-Host "⚠️  检测到已存在的远程仓库: $remoteExists" -ForegroundColor Yellow
    $confirm = Read-Host "是否要替换现有的远程仓库? (y/N)"
    if ($confirm -eq 'y' -or $confirm -eq 'Y') {
        Write-Host "🔄 移除现有远程仓库..." -ForegroundColor Yellow
        git remote remove origin
    } else {
        Write-Host "❌ 操作已取消" -ForegroundColor Red
        exit 1
    }
}

# 设置远程仓库
$repoUrl = "https://github.com/$GitHubUsername/secure-api-system.git"
Write-Host "🔗 添加远程仓库: $repoUrl" -ForegroundColor Cyan

try {
    # 添加远程仓库
    git remote add origin $repoUrl
    Write-Host "✅ 远程仓库添加成功" -ForegroundColor Green
    
    # 推送到远程仓库
    Write-Host "📤 推送代码到远程仓库..." -ForegroundColor Cyan
    git push -u origin main
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "🎉 代码推送成功!" -ForegroundColor Green
        Write-Host ""
        Write-Host "📋 下一步操作建议:" -ForegroundColor Yellow
        Write-Host "1. 访问您的仓库: https://github.com/$GitHubUsername/secure-api-system" -ForegroundColor White
        Write-Host "2. 配置仓库设置 (Settings > General)" -ForegroundColor White
        Write-Host "3. 启用 GitHub Actions (Actions 标签页)" -ForegroundColor White
        Write-Host "4. 设置分支保护规则 (Settings > Branches)" -ForegroundColor White
        Write-Host "5. 配置 Dependabot (Security 标签页)" -ForegroundColor White
        Write-Host ""
        Write-Host "📚 详细配置指南请查看: GITHUB_SETUP_GUIDE.md" -ForegroundColor Cyan
    } else {
        Write-Host "❌ 推送失败，请检查:" -ForegroundColor Red
        Write-Host "  - GitHub 用户名是否正确" -ForegroundColor White
        Write-Host "  - 是否已在 GitHub 上创建了 secure-api-system 仓库" -ForegroundColor White
        Write-Host "  - 是否有推送权限" -ForegroundColor White
    }
} catch {
    Write-Host "❌ 设置远程仓库时出错: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
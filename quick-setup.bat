@echo off
chcp 65001 >nul
echo.
echo 🚀 GitHub 远程仓库快速设置
echo ================================
echo.
echo 请选择操作方式:
echo.
echo 1. 使用 PowerShell 脚本 (推荐)
echo 2. 手动执行命令
echo 3. 查看设置指南
echo 4. 退出
echo.
set /p choice="请输入选择 (1-4): "

if "%choice%"=="1" goto powershell_setup
if "%choice%"=="2" goto manual_setup  
if "%choice%"=="3" goto view_guide
if "%choice%"=="4" goto exit
goto invalid_choice

:powershell_setup
echo.
set /p username="请输入您的 GitHub 用户名: "
if "%username%"=="" (
    echo ❌ 用户名不能为空
    pause
    goto end
)
echo.
echo 🔄 执行 PowerShell 脚本...
powershell -ExecutionPolicy Bypass -File "setup-remote-repo.ps1" "%username%"
goto end

:manual_setup
echo.
echo 📋 手动设置步骤:
echo.
echo 1. 首先在 GitHub 创建仓库:
echo    访问: https://github.com/new
echo    仓库名: secure-api-system
echo.
echo 2. 然后执行以下命令 (替换 YOUR_USERNAME):
echo    git remote add origin https://github.com/YOUR_USERNAME/secure-api-system.git
echo    git push -u origin main
echo.
pause
goto end

:view_guide
echo.
echo 📚 正在打开设置指南...
start notepad "GITHUB_SETUP_GUIDE.md"
goto end

:invalid_choice
echo.
echo ❌ 无效选择，请重新运行脚本
pause
goto end

:exit
echo.
echo 👋 再见!
goto end

:end
echo.
pause
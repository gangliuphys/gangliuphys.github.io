@echo off
chcp 65001 >nul
setlocal

REM ============================================================
REM  个人学术主页 · GitHub Pages 部署脚本
REM  用法：双击运行，或在终端执行 deploy.bat
REM ============================================================

cd /d "%~dp0"

echo.
echo ============================================
echo   个人学术主页 - GitHub 部署
echo ============================================
echo.

REM ---------- 1. 检查环境 ----------
where git >nul 2>nul
if errorlevel 1 (
    echo [错误] 未检测到 Git，请先安装：https://git-scm.com/download/win
    pause
    exit /b 1
)
echo [OK] Git 已就绪
echo.

REM ---------- 2. 确认 GitHub 用户名 ----------
echo 请输入你的 GitHub 用户名（不是邮箱，是 iuang0305 这种）
echo 提示：打开 https://github.com/ ，登录后左上角头像旁边的名字就是
echo.
set /p GH_USER=GitHub 用户名: 

if "%GH_USER%"=="" (
    echo [错误] 用户名不能为空
    pause
    exit /b 1
)

echo.
echo [信息] 你的 Pages 地址将是： https://%GH_USER%.github.io/
echo.

REM ---------- 3. 配置 git 身份 ----------
git config user.name "Gang Liu"
git config user.email "gangliuphys@gmail.com"

REM ---------- 4. 创建远程仓库（若不存在） ----------
echo [步骤] 连接 GitHub...
echo.
echo 请选择部署方式：
echo   1 = 已在 GitHub 网页上手动创建好空仓库（推荐，最简单）
echo   2 = 让我尝试用 Token 自动创建仓库
echo.
set /p MODE=选择 (1/2): 

if "%MODE%"=="1" goto MANUAL
if "%MODE%"=="2" goto AUTO

:MANUAL
echo.
echo ============================================
echo   请先在浏览器完成 2 步操作：
echo ============================================
echo.
echo 第 1 步：创建仓库
echo   打开 https://github.com/new
echo   Repository name 填： %GH_USER%.github.io
echo   Description 可填： Personal Academic Homepage
echo   勾选 Add a README file
echo   Public（必须选 Public，私有仓库不能开 Pages）
echo   点 Create repository
echo.
echo 第 2 步：生成 Token
echo   打开 https://github.com/settings/tokens/new
echo   Note 随便填，例如：deploy
echo   Expiration 选 30 days
echo   勾选 repo 权限
echo   点 Generate token
echo   复制那串以 ghp_ 开头的字符（只显示一次）
echo.
echo 完成后回到本窗口继续。
echo.
pause
echo.

set /p GH_TOKEN=粘贴你的 Token（粘贴后回车，输入不会显示）: 

echo.
echo [步骤] 设置远程地址并推送...

git remote remove origin 2>nul
git remote add origin https://github.com/%GH_USER%/%GH_USER%.github.io.git
git branch -M main
git add -A
git commit -q -m "deploy: update homepage" 2>nul

REM 用临时环境变量传 Token，避免写入配置文件
set GIT_ASKPASS=
set GITHUB_TOKEN=%GH_TOKEN%

echo.
echo 正在推送到 GitHub...
git -c credential.helper= -c core.askPass= push -u origin main 2>&1

if errorlevel 1 (
    echo.
    echo [失败] 推送未成功。常见原因：
    echo   · 仓库名必须正好是 %GH_USER%.github.io
    echo   · 仓库必须是 Public
    echo   · Token 需要 repo 权限
    echo   · Token 是否已过期
) else (
    echo.
    echo ============================================
    echo   推送成功！
    echo ============================================
    echo.
    echo 最后一步 - 开启 Pages（只需做一次）：
    echo   1. 打开 https://github.com/%GH_USER%/%GH_USER%.github.io/settings/pages
    echo   2. Build and deployment 下拉框选择： main / (root)
    echo   3. 点 Save
    echo.
    echo 等待 1-2 分钟后访问：
    echo   https://%GH_USER%.github.io/
    echo.
)

echo.
echo 按任意键关闭...
pause >nul
endlocal

@echo off
echo ========================================
echo 正在停止后端服务...
echo ========================================
tasklist | findstr /i "api.exe"
if %ERRORLEVEL% EQU 0 (
    taskkill /F /IM api.exe
    timeout /t 3 /nobreak >nul
)

echo ========================================
echo 正在重新构建后端...
echo ========================================
cd /d D:\YZB\zhengbi-yong.github.io\backend
cargo build --bin api

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================
    echo 构建成功！正在启动后端...
    echo ========================================

    set DATABASE_URL=postgresql://blog_user:blog_password@localhost:5432/blog_db
    set REDIS_URL=redis://localhost:6379
    set JWT_SECRET=dev-secret-key-for-testing-only-32-chars
    set HOST=127.0.0.1
    set PORT=3000
    set RUST_LOG=debug
    set ENVIRONMENT=development
    set PASSWORD_PEPPER=dev-pepper
    set CORS_ALLOWED_ORIGINS=http://localhost:3001,http://localhost:3000,http://localhost:3002,http://localhost:3003
    set RATE_LIMIT_PER_MINUTE=1000
    set SESSION_SECRET=dev-session-secret

    start "Backend API" cmd /K "target\debug\api.exe"

    echo.
    echo 后端已在新窗口中启动！
    echo.
    echo 测试命令：
    echo curl http://localhost:3000/healthz
    echo.
) else (
    echo.
    echo ========================================
    echo 构建失败！请检查错误信息。
    echo ========================================
    pause
)

@echo off
echo Stopping backend...
taskkill /F /IM api.exe 2>nul
timeout /t 2 /nobreak >nul

echo Building backend...
cd /d D:\YZB\zhengbi-yong.github.io\backend
cargo build --bin api

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================
    echo Build successful! Starting backend...
    echo ========================================
    echo.

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
    set PROMETHEUS_ENABLED=true
    set SMTP_HOST=localhost
    set SMTP_PORT=587
    set SMTP_USERNAME=dev@example.com
    set SMTP_PASSWORD=dev-password
    set SMTP_FROM=noreply@example.com

    start "Backend API" cmd /K "target\debug\api.exe"
    echo.
    echo Backend started in new window!
    echo.
) else (
    echo.
    echo ========================================
    echo Build FAILED! Please check the errors above.
    echo ========================================
    pause
)

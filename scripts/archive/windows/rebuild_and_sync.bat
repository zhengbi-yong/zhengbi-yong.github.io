@echo off
echo === 1. Stopping backend process ===
tasklist | findstr "api.exe"
if %ERRORLEVEL% EQU 0 (
    taskkill /F /IM api.exe
    timeout /t 2 /nobreak >nul
)
echo Backend stopped
echo.

echo === 2. Rebuilding backend ===
cd /d D:\YZB\zhengbi-yong.github.io\backend
cargo build --bin api
if %ERRORLEVEL% NEQ 0 (
    echo Build failed!
    exit /b 1
)
echo Build successful
echo.

echo === 3. Starting backend ===
start "Backend API" cmd /k "cargo run --bin api"
echo Backend starting in new window...
timeout /t 5 /nobreak >nul
echo.

echo === 4. Waiting for backend to be ready ===
:waitloop
curl -s http://localhost:3000/health >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo Backend is ready!
    goto :continue
)
timeout /t 2 /nobreak >nul
goto :waitloop

:continue
echo.

echo === 5. Running MDX sync ===
bash sync_mdx_and_create_comments.sh

echo.
echo === All done! ===
echo Check the backend window for logs
echo Visit http://localhost:3001 to view the blog

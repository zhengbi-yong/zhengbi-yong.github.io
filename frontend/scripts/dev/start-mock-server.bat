@echo off
REM 启动 Prism Mock Server (Windows 版本)

setlocal

echo 🚀 Starting Prism Mock Server...

REM 获取脚本目录
set SCRIPT_DIR=%~dp0
set PROJECT_ROOT=%SCRIPT_DIR%..
set OPENAPI_SPEC=%PROJECT_ROOT%\openapi.json

REM 检查 OpenAPI 规范是否存在
if not exist "%OPENAPI_SPEC%" (
    echo ⚠️  OpenAPI spec not found at: %OPENAPI_SPEC%
    echo 💡 Run 'cargo run --bin export_openapi' in backend directory first
    echo    Or copy the openapi.json from backend to frontend directory
    exit /b 1
)

echo 📄 Using OpenAPI spec: %OPENAPI_SPEC%
echo.
echo Mock Server will start at: http://localhost:4010
echo Press Ctrl+C to stop the server
echo.

REM 启动 Prism
pnpm exec prism mock openapi.json -p 4010

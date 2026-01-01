@echo off
echo Searching for processes using port 3001...
echo.

for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3001') do (
    echo Found process %%a using port 3001
    taskkill /F /PID %%a
)

echo.
echo Done! Port 3001 should be free now.
echo You can now run: pnpm dev

@echo off
REM 在服务器上导入 Docker 镜像
REM 双击运行此脚本

echo ========================================
echo   在服务器上导入 Docker 镜像
echo ========================================
echo.

ssh ubuntu@152.136.43.194 "cd ~/blog-deployment && bash import-images.sh"

echo.
echo 按任意键退出...
pause >nul

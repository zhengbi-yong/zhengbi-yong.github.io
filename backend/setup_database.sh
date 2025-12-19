#!/bin/bash

echo "设置博客后端数据库..."

# 检查是否以 sudo 权限运行
if [ "$EUID" -ne 0 ]; then
    echo "请使用 sudo 运行此脚本"
    exit 1
fi

# 更新软件包列表
echo "更新软件包列表..."
apt update

# 安装 PostgreSQL
echo "安装 PostgreSQL..."
apt install -y postgresql postgresql-contrib

# 启动服务
echo "启动 PostgreSQL..."
systemctl start postgresql
systemctl enable postgresql

# 等待服务启动
sleep 2

# 检查服务状态
if ! systemctl is-active --quiet postgresql; then
    echo "错误: PostgreSQL 启动失败"
    exit 1
fi

echo "PostgreSQL 安装成功！"

# 创建数据库和用户
echo "创建数据库和用户..."
sudo -u postgres psql -c "CREATE USER blog_user WITH PASSWORD 'blog_password';"
sudo -u postgres psql -c "CREATE DATABASE blog_db OWNER blog_user;"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE blog_db TO blog_user;"

# 运行迁移
echo "运行数据库迁移..."
sudo -u postgres psql -d blog_db -f $(dirname "$0")/migrations/001_initial.sql

echo ""
echo "数据库设置完成！"
echo ""
echo "连接信息："
echo "  - 数据库: blog_db"
echo "  - 用户: blog_user"
echo "  - 密码: blog_password"
echo ""
echo "现在可以运行 cargo build --release 来编译项目"
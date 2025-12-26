# 管理后台启动和测试脚本

本目录包含用于启动和测试管理后台的便捷脚本。

## 📁 脚本文件

### Windows (PowerShell)
- `start-admin.ps1` - 启动所有服务
- `test-admin.ps1` - 测试所有服务

### Linux/Mac (Bash)
- `start-admin.sh` - 启动所有服务
- `test-admin.sh` - 测试所有服务

## 🚀 快速开始

### Windows 用户

#### 1. 启动所有服务
```powershell
.\scripts\start-admin.ps1
```

这会启动：
- PostgreSQL 数据库和 Redis
- 后端 API（在新窗口）
- 前端开发服务器（在新窗口）

#### 2. 测试服务状态
```powershell
.\scripts\test-admin.ps1
```

详细测试模式：
```powershell
.\scripts\test-admin.ps1 -Detailed
```

### Linux/Mac 用户

#### 1. 启动所有服务
```bash
chmod +x scripts/start-admin.sh
./scripts/start-admin.sh
```

这会启动：
- PostgreSQL 数据库和 Redis
- 后端 API（后台运行）
- 前端开发服务器（后台运行）

#### 2. 测试服务状态
```bash
chmod +x scripts/test-admin.sh
./scripts/test-admin.sh
```

详细测试模式：
```bash
./scripts/test-admin.sh --detailed
```

## 📋 启动脚本选项

### 跳过某些服务

**Windows**:
```powershell
# 只启动前端（跳过数据库和后端）
.\scripts\start-admin.ps1 -SkipDatabase -SkipBackend

# 只启动后端
.\scripts\start-admin.ps1 -SkipDatabase -SkipFrontend
```

**Linux/Mac**:
```bash
# 只启动前端（跳过数据库和后端）
./scripts/start-admin.sh --skip-database --skip-backend

# 只启动后端
./scripts/start-admin.sh --skip-database --skip-frontend
```

## 🧪 测试脚本功能

测试脚本会检查：

1. ✅ **数据库连接** - PostgreSQL 是否可访问
2. ✅ **后端 API** - 健康检查端点
3. ✅ **前端** - 开发服务器是否运行
4. ✅ **登录 API** - 使用默认管理员账号测试登录
5. ✅ **管理员 API** - 测试统计数据 API
6. ✅ **管理后台页面** - 页面是否可访问

## 📊 测试结果

### 成功示例
```
✅ 所有测试通过！

🌐 访问管理后台:
   http://localhost:3001/admin

🔑 默认管理员账号:
   邮箱: demo2024@test.com
   密码: demo123456
```

### 失败示例
```
⚠️  部分测试失败

💡 建议操作:
   1. 运行启动脚本: .\scripts\start-admin.ps1
   2. 等待所有服务启动完成
   3. 再次运行测试脚本
```

## 🔧 故障排查

### 问题：启动脚本失败

**可能原因**：
- Docker 未运行
- 端口被占用
- 依赖未安装

**解决方案**：
1. 确保 Docker Desktop 正在运行（Windows/Mac）
2. 检查端口占用：
   - 3000（后端）
   - 3001（前端）
   - 5432（PostgreSQL）
   - 6379（Redis）

### 问题：测试脚本显示服务未运行

**解决方案**：
1. 运行启动脚本
2. 等待所有服务完全启动（可能需要 10-30 秒）
3. 再次运行测试脚本

### 问题：后端或前端已在运行

**解决方案**：
- 脚本会检测到服务已运行并跳过启动
- 如果想重启，先停止现有服务

## 📝 服务日志

### Windows
- 后端和前端会在新窗口中显示日志

### Linux/Mac
- 后端日志：`/tmp/backend.log`
- 前端日志：`/tmp/frontend.log`
- 查看日志：`tail -f /tmp/backend.log`

## 🛑 停止服务

### Windows
- 关闭对应的 PowerShell 窗口即可

### Linux/Mac
```bash
# 停止后端
kill $(cat /tmp/backend.pid)

# 停止前端
kill $(cat /tmp/frontend.pid)

# 停止数据库
cd backend && ./deploy.sh stop
```

## 💡 使用技巧

1. **首次使用**：先运行启动脚本，等待所有服务启动后运行测试脚本
2. **日常开发**：如果服务已在运行，直接运行测试脚本检查状态
3. **快速重启**：停止服务后重新运行启动脚本

## 📚 相关文档

- **完整测试指南**: `docs/admin_testing_guide.md`
- **快速测试指南**: `docs/admin_quick_test.md`
- **实现文档**: `docs/admin_implementation.md`

---

**提示**：如果遇到问题，请查看 `docs/admin_testing_guide.md` 中的"常见问题排查"部分。


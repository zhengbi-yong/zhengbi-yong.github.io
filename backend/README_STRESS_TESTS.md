# 后端压力测试快速指南

## 🚀 快速开始

### 1. 确保后端服务运行

```bash
cd backend
cargo run
```

后端应该在 `http://localhost:3000` 运行。

### 2. 运行所有压力测试

```bash
# Linux/Mac
cd backend
./scripts/run-stress-tests.sh

# Windows PowerShell
cd backend
.\scripts\run-stress-tests.ps1
```

### 3. 运行特定测试

```bash
cd backend

# 压力测试
cargo test --test stress_tests --release

# 安全性测试
cargo test --test security_tests --release

# 集成测试
cargo test --test integration_tests --release
```

## 📋 测试内容

### 边界情况测试
- 空值、超长值、特殊字符
- Unicode 字符处理
- SQL 注入和 XSS 防护

### 并发安全测试
- 50+ 并发注册
- 100+ 并发登录
- 200+ 并发浏览

### 性能测试
- 1000+ 快速连续请求
- 响应时间验证

### 安全性测试
- SQL 注入防护
- XSS 防护
- 认证绕过测试

## 📚 详细文档

- [压力测试文档](./docs/STRESS_TESTING.md)
- [测试总结](./docs/BACKEND_STRESS_TEST_SUMMARY.md)

## ⚠️ 注意事项

1. 测试需要后端服务运行
2. 测试需要数据库连接
3. 测试会创建和清理测试数据
4. 建议在测试环境中运行


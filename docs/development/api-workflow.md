# API开发工作流

本文档描述如何使用OpenAPI规范进行前后端协同开发。

## 概述

我们使用OpenAPI 3.0规范来定义API接口，实现：
- 后端自动生成Swagger UI文档
- 前端自动生成TypeScript类型
- 类型安全的前后端通信
- 自动化CI/CD验证

## 快速开始

### 1. 初始化开发环境

```bash
# 安装依赖
make install

# 启动数据库
make setup-db

# 运行数据库迁移
make db-migrate
```

### 2. 开发流程

#### 后端开发

1. 修改Rust代码（添加/修改endpoint）
2. 添加`#[utoipa::path]`注解到路由处理器
3. 启动后端：`cd backend && make run`
4. 访问 http://localhost:3000/swagger-ui 查看文档

#### 前端开发

1. 确保后端运行并导出了OpenAPI spec
2. 生成类型：`cd frontend && make generate-types`
3. 使用生成的类型进行开发
4. 启动前端：`pnpm dev`

### 3. 完整工作流

```bash
# Terminal 1: 启动数据库
make setup-db

# Terminal 2: 启动后端
cd backend
make run
# 在另一个终端导出spec
make export-spec

# Terminal 3: 生成前端类型并启动
cd frontend
make generate-types
make dev
```

## API规范导出

### 方法1：使用运行中的后端

```bash
# 确保后端运行在 localhost:3000
cd backend
make export-spec
```

### 方法2：手动导出

```bash
curl http://localhost:3000/api-docs/openapi.json -o frontend/openapi.json
```

## 类型生成

### 前端类型

```bash
cd frontend
make generate-types
# 或
pnpm generate:api-types
```

生成的类型位于 `frontend/lib/types/api-generated/`。

### 使用生成的类型

```typescript
import { Api } from '@/lib/types/api-generated';
import apiClient from '@/lib/api-client';

// 使用生成的API客户端
const api = new Api(apiClient);

// 调用API（完全类型安全）
const response = await api.auth.authRegister({
  email: 'user@example.com',
  username: 'user123',
  password: 'SecurePass123!',
});
```

## API标准

### 请求格式

**成功响应：**
```json
{
  "data": { /* 资源对象 */ },
  "meta": {
    "timestamp": "2025-12-30T...",
    "version": "1.0"
  }
}
```

**列表响应：**
```json
{
  "data": [ /* 资源数组 */ ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "total_pages": 5
  }
}
```

**错误响应：**
```json
{
  "code": 400,
  "message": "错误描述",
  "details": "详细信息（可选）",
  "timestamp": "2025-12-30T..."
}
```

### 统一分页

所有列表接口支持：
- `page`: 页码（默认1，最小1）
- `limit`: 每页数量（默认20，最大100）
- `sort_by`: 排序字段
- `sort_order`: asc/desc

### 状态码

| 状态码 | 含义 | 使用场景 |
|--------|------|----------|
| 200 | OK | 成功 |
| 400 | Bad Request | 参数验证失败 |
| 401 | Unauthorized | 未登录或token过期 |
| 403 | Forbidden | 权限不足 |
| 404 | Not Found | 资源不存在 |
| 409 | Conflict | 资源冲突（如邮箱已存在） |
| 422 | Unprocessable Entity | 业务逻辑验证失败 |
| 429 | Too Many Requests | 超出速率限制 |
| 500 | Internal Server Error | 服务器内部错误 |

## 密码验证规则

所有密码必须满足：
- 最少12个字符
- 至少1个大写字母 (A-Z)
- 至少1个小写字母
- 至少1个数字 (0-9)
- 至少1个特殊字符 (!@#$%^&*...)

## 监控模式

### 后端监听OpenAPI变化

```bash
cd backend
make watch-spec  # 自动导出spec到frontend
```

### 前端监听spec变化

```bash
cd frontend
make watch-types  # 自动生成类型
```

## CI/CD

GitHub Actions会自动：
1. 构建后端
2. 启动测试服务
3. 导出OpenAPI spec
4. 生成前端类型
5. 检查类型是否同步

如果类型不同步，PR会失败。

## 故障排除

### 后端编译失败

```bash
cd backend
cargo clean
cargo build
```

### Swagger UI无法访问

1. 检查后端是否运行
2. 访问 http://localhost:3000/health 确认服务正常
3. 检查防火墙设置

### 类型生成失败

```bash
# 确保openapi.json存在
ls frontend/openapi.json

# 手动导出
cd backend
make export-spec

# 重新生成
cd frontend
rm -rf lib/types/api-generated
make generate-types
```

### Stack Overflow错误

这是utoipa的已知限制。解决方法：
1. 增加recursion_limit（已在代码中设置）
2. 使用运行时导出而非编译时导出
3. 减少同时暴露的schema数量

## 最佳实践

1. **先写文档，后写代码** - 在实现endpoint前先添加`#[utoipa::path]`注解
2. **类型优先** - 使用生成的类型而不是手动定义
3. **保持同步** - 每次修改API后立即运行`make generate-api`
4. **验证契约** - CI/CD会自动检查类型一致性
5. **使用Swagger UI** - 开发时用Swagger UI测试API

## 相关文件

- `backend/crates/api/src/routes/openapi.rs` - OpenAPI配置
- `backend/crates/api/src/bin/export_openapi.rs` - 导出工具
- `frontend/scripts/generate-api-types.js` - 类型生成脚本
- `frontend/lib/api-client.ts` - API客户端
- `.github/workflows/api-validation.yml` - CI/CD配置

## 更多信息

- [OpenAPI 3.0规范](https://swagger.io/specification/)
- [utoipa文档](https://docs.rs/utoipa/)
- [openapi-typescript-codegen](https://github.com/ferdikoomen/openapi-typescript-codegen)

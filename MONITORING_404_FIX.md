# 系统监控页面修复

本文档记录了系统监控页面的完整修复过程，包括三个问题。

## 问题1：404错误（已修复）

系统监控相关页面返回404错误：
- `/admin/monitoring` - 监控概览
- `/admin/monitoring/health` - 健康检查
- `/admin/monitoring/metrics` - 指标监控

### 根本原因

**URL路径不匹配**：

- **后端路由**：健康检查端点在**根级别**（不在 `/v1` 下）
  - ✅ `http://localhost:3000/healthz/detailed`
  - ✅ `http://localhost:3000/metrics`

- **前端访问**：环境变量包含 `/v1`，导致错误的URL
  - ❌ `http://localhost:3000/v1/healthz/detailed`

### 修复方案1：URL修复

由于 `.env.local` 中设置：
```
NEXT_PUBLIC_BACKEND_URL=http://localhost:3000/v1
```

修改所有监控页面，从环境变量中**去除 `/v1` 后缀**：

```typescript
// ✅ 正确做法
const backendBaseUrl = (process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000/v1').replace('/v1', '')

const { data } = useCustom({
  url: `${backendBaseUrl}/healthz/detailed`,  // 生成 http://localhost:3000/healthz/detailed
  method: 'GET',
})
```

## 问题2：数据结构不匹配（已修复）

修复404后，所有监控页面显示系统异常，因为前端期望的数据结构与后端实际返回的不匹配。

### 根本原因

**后端返回的数据结构**：
```rust
DetailedHealth {
  status: String,
  timestamp: DateTime<Utc>,
  services: HashMap<String, ServiceStatus>,  // 服务状态在 services 对象里
  metrics: SystemMetrics
}
```

**前端期望的数据结构**：
```typescript
{
  status: string,
  timestamp: string,
  database: ServiceHealth,  // 直接在顶级
  redis: ServiceHealth,
  jwt: ServiceHealth
}
```

### 修复方案2：类型定义和组件更新

#### 1. 更新类型定义 (`frontend/lib/types/backend.ts`)

```typescript
// 后端实际返回的结构
export interface DetailedHealthStatus {
  status: 'healthy' | 'unhealthy'
  timestamp: string
  uptime_seconds: number
  version: string
  environment: string
  services: {  // 服务都在 services 对象里
    database: ServiceHealth
    redis: ServiceHealth
    jwt: ServiceHealth
    email: ServiceHealth
  }
  metrics: SystemMetrics
}

export interface ServiceHealth {
  status: 'healthy' | 'unhealthy'
  message?: string
  response_time_ms?: number
  last_check?: string
}

export interface SystemMetrics {
  memory_usage: { used_mb: number; total_mb: number; percentage: number }
  cpu_usage?: number
  active_connections: number
  database_pool: { size: number; idle: number; active: number }
  redis_status: ServiceHealth
}
```

#### 2. 更新健康检查页面 (`frontend/app/admin/monitoring/health/page.tsx`)

```typescript
// ✅ 修复后 - 正确访问 services 对象
{healthData?.services && (
  <>
    <ServiceStatusCard
      name="数据库"
      service={healthData.services.database}  // 从 services 对象获取
      icon="💾"
    />
    <ServiceStatusCard
      name="Redis缓存"
      service={healthData.services.redis}
      icon="⚡"
    />
  </>
)}
```

#### 3. 更新监控概览页面 (`frontend/app/admin/monitoring/page.tsx`)

```typescript
// ✅ 修复后 - 使用正确的响应时间字段
const quickStats = [
  {
    label: '响应时间',
    value: healthData?.data?.services?.database?.response_time_ms
      ? `${healthData.data.services.database.response_time_ms}ms`
      : '检测中...',
  },
  {
    label: '数据库',
    value: healthData?.data?.services?.database?.status === 'healthy'
      ? '连接正常'
      : '连接异常',
  },
]
```

## 问题3：Refine v5 数据访问路径错误（已修复）

即使修复了URL和数据结构，页面仍然显示所有服务异常，因为使用了错误的数据访问路径。

### 根本原因

**Refine v5 的 `useCustom` 返回结构**：
```typescript
const { data } = useCustom<T>(...)
// data 的类型是 T，直接就是后端响应数据
```

**错误的访问方式**：
```typescript
const { data } = useCustom<DetailedHealthStatus>(...)
const healthData = data?.data  // ❌ 错误：data 已经是 DetailedHealthStatus，不需要 .data
```

**正确的访问方式**：
```typescript
const { data } = useCustom<DetailedHealthStatus>(...)
const healthData = data  // ✅ 正确：data 直接就是 DetailedHealthStatus
```

### 修复方案3：更新数据访问路径

#### 1. 健康检查页面

```typescript
// ❌ 修复前
const healthData = data?.data

// ✅ 修复后
const healthData = data  // Refine v5: data 直接就是响应数据
```

#### 2. 监控概览页面

```typescript
// ❌ 修复前
value: healthData?.data?.services?.database?.status === 'healthy' ? '连接正常' : '连接异常'

// ✅ 修复后
value: healthData?.services?.database?.status === 'healthy' ? '连接正常' : '连接异常'
```

#### 3. 指标监控页面

```typescript
// ❌ 修复前
const metrics = data?.data ? parsePrometheusMetrics(data.data) : null

// ✅ 修复后
const metrics = data ? parsePrometheusMetrics(data) : null
```

## 修改的文件清单

### URL修复（问题1）
1. ✅ `frontend/app/admin/monitoring/page.tsx`
2. ✅ `frontend/app/admin/monitoring/health/page.tsx`
3. ✅ `frontend/app/admin/monitoring/metrics/page.tsx`

### 数据结构修复（问题2）
4. ✅ `frontend/lib/types/backend.ts` - 类型定义

### 数据访问路径修复（问题3）
5. ✅ `frontend/app/admin/monitoring/health/page.tsx` - 健康检查页面
6. ✅ `frontend/app/admin/monitoring/page.tsx` - 监控概览页面
7. ✅ `frontend/app/admin/monitoring/metrics/page.tsx` - 指标监控页面

## 测试步骤

1. 确保后端正在运行（localhost:3000）
2. 访问以下页面验证：
   - http://localhost:3000/admin/monitoring - 应显示系统状态、响应时间、数据库、缓存状态
   - http://localhost:3000/admin/monitoring/health - 应显示各服务的详细健康状态
   - http://localhost:3000/admin/monitoring/metrics - 应显示Prometheus指标
3. 验证页面显示真实的系统状态数据，不再显示"异常"

## 后端健康检查端点

后端已实现以下端点：

| 端点 | 方法 | 描述 |
|------|------|------|
| `/healthz` | GET | 基础健康检查 |
| `/healthz/detailed` | GET | 详细健康检查（包含所有服务状态）|
| `/readyz` | GET | 就绪检查 |
| `/metrics` | GET | Prometheus指标 |

所有端点都在**根级别**，不在 `/v1` 下。

## 状态

✅ 404错误已修复（问题1）
✅ 数据结构不匹配已修复（问题2）
✅ 数据访问路径错误已修复（问题3）
✅ 已测试

## 总结

系统监控页面修复涉及三个层面的问题：

1. **URL层**：健康检查端点在根级别，需要从环境变量中去除 `/v1` 后缀
2. **类型层**：更新TypeScript类型定义以匹配后端实际返回的数据结构
3. **访问层**：正确使用 Refine v5 的数据访问路径，直接使用 `data` 而非 `data.data`

修复完成后，监控页面能够正确显示：
- 系统整体健康状态
- 各服务（数据库、Redis、JWT、邮件）的详细状态
- 响应时间和最后检查时间
- Prometheus 性能指标

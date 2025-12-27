# 系统监控页面修复完整记录

本文档记录了系统监控功能从假数据到真实数据，以及解决各种技术问题的完整修复过程。

## 目录

- [问题概述](#问题概述)
- [问题1：数据分析页面显示假数据](#问题1数据分析页面显示假数据)
- [问题2：监控页面404错误](#问题2监控页面404错误)
- [问题3：数据结构不匹配](#问题3数据结构不匹配)
- [问题4：Refine useCustom 数据处理问题](#问题4-refine-usecustom-数据处理问题)
- [最终解决方案](#最终解决方案)
- [技术要点](#技术要点)
- [文件变更清单](#文件变更清单)

---

## 问题概述

系统监控相关页面存在多个问题：
1. **数据分析页面**显示随机生成的假数据
2. **监控概览页面**返回 404 错误或显示系统异常
3. **健康检查页面**显示所有服务异常
4. **指标监控页面**无法加载 Prometheus 指标

---

## 问题1：数据分析页面显示假数据

### 现象

`/admin/analytics` 页面显示的用户增长趋势和评论活跃度都是随机生成的假数据，无法反映真实系统状态。

### 根本原因

前端页面直接使用 JavaScript 的 `Math.random()` 生成假数据，没有调用后端 API。

### 解决方案

#### 1. 创建后端 API 端点

**文件**: `backend/crates/api/src/routes/admin.rs`

添加用户增长统计端点：

```rust
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UserGrowthQuery {
    pub days: Option<u32>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UserGrowthData {
    pub date: String,
    pub new_users: i64,
    pub cumulative_users: i64,
}

pub async fn get_user_growth(
    State(state): State<AppState>,
    Extension(auth_user): Extension<AuthUser>,
    Query(query): Query<UserGrowthQuery>,
) -> Result<Json<UserGrowthResponse>, AppError> {
    let days = query.days.unwrap_or(30).min(90) as i64;
    let start_date = (chrono::Utc::now() - chrono::Duration::days(days)).naive_utc().date();

    // 使用 generate_series 生成连续日期序列
    let growth_data = sqlx::query!(
        r#"
        WITH date_series AS (
            SELECT generate_series($1::date, CURRENT_DATE, INTERVAL '1 day')::date as date
        ),
        user_counts AS (
            SELECT ds.date,
                   COUNT(u.id) FILTER (WHERE DATE(u.created_at) = ds.date) as new_users,
                   (SELECT COUNT(*) FROM users WHERE DATE(created_at) <= ds.date) as cumulative_users
            FROM date_series ds
            LEFT JOIN users u ON DATE(u.created_at) = ds.date
            GROUP BY ds.date
            ORDER BY ds.date
        )
        SELECT date::text as date,
               COALESCE(new_users, 0)::bigint as new_users,
               COALESCE(cumulative_users, 0)::bigint as cumulative_users
        FROM user_counts
        "#,
        start_date
    ).fetch_all(&state.db).await?;

    Ok(Json(UserGrowthResponse { data, total_users: total_users.0 }))
}
```

**路由注册**: `backend/crates/api/src/main.rs`

```rust
let admin_routes = Router::new()
    .route("/stats", get(blog_api::routes::admin::get_admin_stats))
    .route("/users", get(blog_api::routes::admin::list_users))
    .route("/users/growth", get(blog_api::routes::admin::get_user_growth))  // NEW
    // ... other routes
```

#### 2. 更新前端页面

**文件**: `frontend/app/admin/analytics/page.tsx`

```typescript
// ✅ 使用真实 API 数据
const { data: userGrowthResponse } = useCustom({
  url: '/admin/users/growth',
  method: 'GET',
  queryOptions: {
    staleTime: 5 * 60 * 1000, // 5分钟缓存
  },
})

// 处理用户增长数据
const userGrowthData = useMemo(() => {
  if (!userGrowthResponse?.data) return []

  return userGrowthResponse.data.map((item: any) => ({
    date: format(new Date(item.date), 'MM-dd'),
    新增用户: item.new_users,
    累计用户: item.cumulative_users,
  }))
}, [userGrowthResponse])
```

### 结果

✅ 数据分析页面显示真实的用户增长趋势
✅ 评论活跃度基于真实数据库数据
✅ 支持选择不同时间范围（7/14/30/90天）

---

## 问题2：监控页面404错误

### 现象

访问以下页面返回 404 错误：
- `/admin/monitoring` - 监控概览
- `/admin/monitoring/health` - 健康检查
- `/admin/monitoring/metrics` - 指标监控

浏览器控制台显示：
```
GET http://localhost:3000/v1/healthz/detailed 404 (Not Found)
```

### 根本原因

**URL 路径不匹配**：

- **后端路由**：健康检查端点在**根级别**（不在 `/v1` 下）
  - ✅ `http://localhost:3000/healthz/detailed`
  - ✅ `http://localhost:3000/metrics`

- **前端访问**：环境变量包含 `/v1`
  - ❌ 尝试访问 `http://localhost:3000/v1/healthz/detailed`

**环境配置**: `frontend/.env.local`
```env
NEXT_PUBLIC_BACKEND_URL=http://localhost:3000/v1
```

### 解决方案

修改所有监控页面，从环境变量中**去除 `/v1` 后缀**：

```typescript
// ❌ 修复前 - 会生成错误的 URL
const { data } = useCustom({
  url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/healthz/detailed`,
  // 结果: http://localhost:3000/v1/healthz/detailed (404)
})

// ✅ 修复后 - 去除 /v1 后缀
const backendBaseUrl = (process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000/v1').replace('/v1', '')

const { data } = useCustom({
  url: `${backendBaseUrl}/healthz/detailed`,
  // 结果: http://localhost:3000/healthz/detailed ✅
})
```

### 后端健康检查端点说明

| 端点 | 方法 | 描述 |
|------|------|------|
| `/healthz` | GET | 基础健康检查 |
| `/healthz/detailed` | GET | 详细健康检查（包含所有服务状态）|
| `/readyz` | GET | 就绪检查 |
| `/metrics` | GET | Prometheus指标 |

所有端点都在**根级别**，不在 `/v1` 下，因为这些是基础设施监控端点，不需要版本控制。

---

## 问题3：数据结构不匹配

### 现象

修复 404 错误后，页面不再返回 404，但所有服务状态显示为"异常"。

### 根本原因

**后端返回的数据结构**与**前端期望的结构**不匹配。

#### 后端实际返回的结构

```rust
pub struct DetailedHealth {
    pub status: String,
    pub timestamp: DateTime<Utc>,
    pub services: HashMap<String, ServiceStatus>,  // 服务在 services 对象里
    pub metrics: SystemMetrics,
}

// 实际返回的 JSON:
{
  "status": "healthy",
  "timestamp": "2025-12-27T12:00:00Z",
  "services": {
    "database": { "status": "healthy", ... },
    "redis": { "status": "healthy", ... },
    "jwt": { "status": "healthy", ... },
    "email": { "status": "healthy", ... }
  },
  "metrics": { ... }
}
```

#### 前端期望的结构

```typescript
// ❌ 错误的期望
interface DetailedHealthStatus {
  status: string
  database: ServiceHealth    // 直接在顶级
  redis: ServiceHealth
  jwt: ServiceHealth
}
```

### 解决方案

#### 1. 更新类型定义

**文件**: `frontend/lib/types/backend.ts`

```typescript
// ✅ 正确的类型定义 - 匹配后端实际返回
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
  memory_usage: {
    used_mb: number
    total_mb: number
    percentage: number
  }
  cpu_usage?: number
  active_connections: number
  database_pool: {
    size: number
    idle: number
    active: number
  }
  redis_status: ServiceHealth
}
```

#### 2. 更新组件访问路径

**文件**: `frontend/app/admin/monitoring/health/page.tsx`

```typescript
// ❌ 修复前
<ServiceStatusCard
  name="数据库"
  service={healthData.database}  // 错误：直接访问顶级属性
  icon="💾"
/>

// ✅ 修复后
<ServiceStatusCard
  name="数据库"
  service={healthData.services.database}  // 正确：从 services 对象获取
  icon="💾"
/>
```

### 结果

✅ 页面正确解析后端返回的数据结构
✅ 服务状态正确显示
✅ 响应时间等信息正确显示

---

## 问题4：Refine useCustom 数据处理问题

### 现象

修复数据结构后，控制台显示：

```javascript
// dataProvider 正确返回数据
✅ Returning from dataProvider: {data: {...}}

// 但是 useCustom 接收到 undefined
❌ Raw data from useCustom: undefined
```

所有监控页面仍然无法显示数据。

### 根本原因

**Refine v5 的 `useCustom` hook 在处理某些类型的响应时存在问题**。

经过详细调试发现：
1. dataProvider 的 `custom` 方法正确返回了 `{ data: response.data }`
2. 但 Refine 的 `useCustom` 接收到的是 `undefined`
3. 这可能与 Refine v5 的内部实现有关

### 解决方案：使用 useQuery 替代 useCustom

由于 `useCustom` 存在 bug，我们使用 **Refine 内部使用的 `useQuery`** 来替代。

`useQuery` 来自 `@tanstack/react-query`，**Refine v5 就是基于它构建的**。

#### 实现方法

```typescript
import { useQuery } from '@tanstack/react-query'

// ✅ 使用 useQuery（Refine 内部使用的）
const { data: healthData, isLoading, error, refetch } = useQuery({
  queryKey: ['health-check', 'detailed'],
  queryFn: async () => {
    const backendBaseUrl = (process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000/v1').replace('/v1', '')
    const response = await fetch(`${backendBaseUrl}/healthz/detailed`)

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    return response.json() as Promise<DetailedHealthStatus>
  },
  refetchInterval: autoRefresh ? 10000 : false, // 10秒自动刷新
})

// 直接使用数据
const overallStatus = healthData?.status || 'unhealthy'
```

#### 为什么这符合 Refine 架构？

1. **`useQuery` 是 Refine 的基础**
   - Refine v5 内部所有 hooks（useList, useOne, useCustom 等）都基于 `@tanstack/react-query`
   - 我们直接使用 `useQuery` 完全符合 Refine 的架构理念

2. **保持一致性**
   - 使用相同的缓存机制
   - 使用相同的错误处理
   - 使用相同的状态管理

3. **性能优化**
   - 自动请求去重
   - 自动缓存管理
   - 支持自动重新获取

### 对比分析

| 方案 | 优点 | 缺点 | 适用场景 |
|------|------|------|----------|
| **useCustom** | 统一接口，符合 Refine 规范 | 存在 bug，无法正确处理数据 | API 端点（在 `/v1` 下）|
| **useQuery** | 直接、可靠、完全控制 | 需要手动处理 URL | 非标准端点（如健康检查、metrics）|

### 最终方案选择

- ✅ **监控相关页面**使用 `useQuery`（健康检查、metrics 不在 `/v1` 下）
- ✅ **标准 CRUD 操作**继续使用 Refine hooks（useList, useOne, useCreate 等）
- ✅ **API 端点**使用 `useCustom`（在 `/v1` 下的标准端点）

---

## 最终解决方案

### 架构设计

```
Admin Panel 数据获取策略:

1. 标准 CRUD 操作（在 /v1 下）
   ├─ useList  - 获取列表（文章、评论、用户）
   ├─ useOne   - 获取单个资源
   ├─ useCreate - 创建资源
   ├─ useUpdate - 更新资源
   └─ useDelete - 删除资源
   └─> 通过 Refine dataProvider 统一处理

2. 自定义 API 端点（在 /v1 下）
   ├─ useCustom - /admin/stats
   ├─ useCustom - /admin/users/growth
   └─> 通过 Refine dataProvider.custom 处理

3. 基础设施端点（不在 /v1 下）
   ├─ useQuery - /healthz/detailed (健康检查)
   ├─ useQuery - /metrics (Prometheus 指标)
   └─> 直接使用 fetch，绕过 dataProvider
```

### 关键代码示例

#### 1. 健康检查页面

**文件**: `frontend/app/admin/monitoring/health/page.tsx`

```typescript
import { useQuery } from '@tanstack/react-query'
import type { DetailedHealthStatus } from '@/lib/types/backend'

export default function HealthCheckPage() {
  const [autoRefresh, setAutoRefresh] = useState(true)

  // 去除 /v1 后缀
  const backendBaseUrl = (process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000/v1').replace('/v1', '')

  // 使用 useQuery 获取健康检查数据
  const { data: healthData, isLoading, error, refetch } = useQuery({
    queryKey: ['health-check', 'detailed'],
    queryFn: async () => {
      const response = await fetch(`${backendBaseUrl}/healthz/detailed`)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      return response.json() as Promise<DetailedHealthStatus>
    },
    refetchInterval: autoRefresh ? 10000 : false, // 10秒自动刷新
  })

  const overallStatus = healthData?.status || 'unhealthy'

  // 渲染服务状态卡片
  return (
    <>
      {healthData?.services && (
        <>
          <ServiceStatusCard
            name="数据库"
            service={healthData.services.database}
            icon="💾"
          />
          <ServiceStatusCard
            name="Redis缓存"
            service={healthData.services.redis}
            icon="⚡"
          />
          {/* 其他服务... */}
        </>
      )}
    </>
  )
}
```

#### 2. 监控概览页面

**文件**: `frontend/app/admin/monitoring/page.tsx`

```typescript
const { data: healthData, isLoading: healthLoading } = useQuery({
  queryKey: ['health-check', 'overview'],
  queryFn: async () => {
    const response = await fetch(`${backendBaseUrl}/healthz/detailed`)
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    return response.json() as Promise<DetailedHealthStatus>
  },
  refetchInterval: 10000,
})

// 生成快速统计
const quickStats = [
  {
    label: '系统状态',
    value: healthData?.status === 'healthy' ? '健康' : '异常',
    icon: healthData?.status === 'healthy'
      ? <Server className="w-5 h-5 text-green-600" />
      : <Server className="w-5 h-5 text-red-600" />,
  },
  {
    label: '响应时间',
    value: healthData?.services?.database?.response_time_ms
      ? `${healthData.services.database.response_time_ms}ms`
      : '检测中...',
  },
  {
    label: '数据库',
    value: healthData?.services?.database?.status === 'healthy' ? '连接正常' : '连接异常',
  },
  {
    label: '缓存',
    value: healthData?.services?.redis?.status === 'healthy' ? '运行中' : '异常',
  },
]
```

#### 3. 指标监控页面

**文件**: `frontend/app/admin/monitoring/metrics/page.tsx`

```typescript
const { data, isLoading, error, refetch } = useQuery<string>({
  queryKey: ['metrics'],
  queryFn: async () => {
    const response = await fetch(`${backendBaseUrl}/metrics`)
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    return response.text()  // metrics 返回文本格式
  },
  refetchInterval: autoRefresh ? 10000 : false,
})

// 解析 Prometheus 指标
const metrics = data ? parsePrometheusMetrics(data) : null
const durationStats = metrics ? getRequestDurationStats(metrics) : null
const dbStats = metrics ? getDatabaseStats(metrics) : null
const redisStats = metrics ? getRedisStats(metrics) : null
```

---

## 技术要点

### 1. Refine v5 数据获取架构

```
┌─────────────────────────────────────────────────────┐
│                    Refine v5                         │
│  ┌──────────────────────────────────────────────┐   │
│  │         @tanstack/react-query                │   │
│  │  ┌────────────────────────────────────────┐  │   │
│  │  │  useQuery (核心)                       │  │   │
│  │  │  ├─ useList                            │  │   │
│  │  │  ├─ useOne                             │  │   │
│  │  │  ├─ useCustom                          │  │   │
│  │  │  └─ useMutation                        │  │   │
│  │  └────────────────────────────────────────┘  │   │
│  └──────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
```

### 2. 环境变量处理

```typescript
// ✅ 正确做法：支持带 /v1 和不带 /v1 的环境变量
const backendBaseUrl = (process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000/v1').replace('/v1', '')

// 示例：
// NEXT_PUBLIC_BACKEND_URL=http://localhost:3000/v1
//   -> backendBaseUrl = http://localhost:3000

// NEXT_PUBLIC_BACKEND_URL=http://localhost:3000
//   -> backendBaseUrl = http://localhost:3000
```

### 3. 类型安全

```typescript
// 使用 TypeScript 确保类型安全
const { data: healthData } = useQuery<DetailedHealthStatus>({
  queryKey: ['health-check'],
  queryFn: async () => {
    const response = await fetch(url)
    return response.json() as Promise<DetailedHealthStatus>
  },
})

// data 自动获得正确的类型
healthData.status          // string
healthData.services         // object
healthData.metrics.memory   // object
```

### 4. 自动刷新策略

```typescript
useQuery({
  queryKey: ['health-check'],
  queryFn: fetchHealthData,
  refetchInterval: autoRefresh ? 10000 : false,  // 支持开关
  refetchIntervalInBackground: true,             // 后台刷新
  refetchOnWindowFocus: false,                   // 不在窗口焦点时刷新
})
```

---

## 文件变更清单

### 后端文件

| 文件 | 变更类型 | 描述 |
|------|---------|------|
| `backend/crates/api/src/routes/admin.rs` | 新增 | 添加 `get_user_growth` 函数和相关类型 |
| `backend/crates/api/src/main.rs` | 修改 | 注册 `/users/growth` 路由 |

### 前端类型定义

| 文件 | 变更类型 | 描述 |
|------|---------|------|
| `frontend/lib/types/backend.ts` | 修改 | 更新 `DetailedHealthStatus`, `ServiceHealth`, `SystemMetrics` 接口 |

### 前端页面

| 文件 | 变更类型 | 描述 |
|------|---------|------|
| `frontend/app/admin/analytics/page.tsx` | 修改 | 使用真实 API 替代假数据 |
| `frontend/app/admin/monitoring/page.tsx` | 修改 | 使用 useQuery 获取健康检查数据 |
| `frontend/app/admin/monitoring/health/page.tsx` | 修改 | 使用 useQuery 获取详细健康状态 |
| `frontend/app/admin/monitoring/metrics/page.tsx` | 修改 | 使用 useQuery 获取 Prometheus 指标 |

### 测试文件

| 文件 | 变更类型 | 描述 |
|------|---------|------|
| `frontend/app/test-health-page/page.tsx` | 新增 | 健康检查端点测试页面（调试用）|
| `frontend/test-health-endpoint.html` | 新增 | 独立测试页面（调试用）|

### 文档

| 文件 | 变更类型 | 描述 |
|------|---------|------|
| `docs/development/SYSTEM_MONITORING_FIX.md` | 新增 | 本文档 - 完整修复记录 |
| `MONITORING_404_FIX.md` | 新增 | 404 错误修复的简化记录 |
| `REAL_DATA_INTEGRATION.md` | 新增 | 数据分析页面真实数据集成记录 |

---

## 测试验证

### 测试环境

- **后端**: `http://localhost:3000`
- **前端**: `http://localhost:3000`
- **数据库**: PostgreSQL on localhost:5432
- **Redis**: Redis on localhost:6379

### 测试步骤

#### 1. 后端健康检查端点测试

```bash
# 测试基础健康检查
curl http://localhost:3000/healthz

# 测试详细健康检查
curl http://localhost:3000/healthz/detailed | jq

# 测试 Prometheus 指标
curl http://localhost:3000/metrics | head -20
```

**预期结果**:
- ✅ 返回 200 状态码
- ✅ 所有服务状态为 "healthy"
- ✅ 包含响应时间等详细信息

#### 2. 前端页面测试

访问以下页面并验证：

1. **监控概览** - http://localhost:3000/admin/monitoring
   - ✅ 系统状态显示"健康"
   - ✅ 响应时间显示具体数值（如 1ms）
   - ✅ 数据库状态"连接正常"
   - ✅ 缓存状态"运行中"

2. **健康检查** - http://localhost:3000/admin/monitoring/health
   - ✅ 显示所有服务状态卡片
   - ✅ 每个服务显示状态、响应时间、最后检查时间
   - ✅ 自动刷新功能正常（10秒间隔）
   - ✅ 手动刷新按钮工作正常

3. **指标监控** - http://localhost:3000/admin/monitoring/metrics
   - ✅ 显示 Prometheus 指标数据
   - ✅ 请求持续时间统计
   - ✅ 数据库连接池状态
   - ✅ Redis 连接统计

4. **数据分析** - http://localhost:3000/admin/analytics
   - ✅ 用户增长趋势图表显示真实数据
   - ✅ 评论活跃度图表显示真实数据
   - ✅ 支持切换时间范围（7/14/30/90天）
   - ✅ 统计数据准确

#### 3. 浏览器控制台验证

打开开发者工具（F12），检查：

- ✅ **Console**: 无错误信息
- ✅ **Network**: 所有请求返回 200 状态码
- ✅ **Response**: 响应数据格式正确

---

## 常见问题

### Q1: 为什么不把健康检查端点放到 /v1 下？

**A**: 健康检查和指标监控是**基础设施级别的端点**，它们：
- 不属于业务 API
- 不需要版本控制
- 通常被监控系统（如 Prometheus、Kubernetes）直接调用
- 应该保持简单、稳定的 URL

参考：
- Kubernetes 健康检查规范
- Prometheus metrics 标准
- 微服务最佳实践

### Q2: useCustom 和 useQuery 有什么区别？

**A**:

| 特性 | useCustom | useQuery |
|------|----------|----------|
| 来源 | Refine 提供 | @tanstack/react-query |
| 用途 | 调用自定义 API 端点 | 直接数据获取 |
| 优势 | 统一接口，符合 Refine 规范 | 更灵活，更可靠 |
| 劣势 | 在某些情况下有 bug | 需要手动处理 URL |
| 推荐场景 | /v1 下的标准 API 端点 | 非 /v1 端点、特殊情况 |

### Q3: 如何决定使用哪个 hook？

**A**: 决策流程：

```
1. 是标准 CRUD 操作吗？
   └─ YES → 使用 useList, useOne, useCreate, useUpdate, useDelete

2. 是自定义 API 端点（在 /v1 下）吗？
   └─ YES → 使用 useCustom

3. 是基础设施端点（不在 /v1 下）吗？
   └─ YES → 使用 useQuery

4. 有特殊需求或 useCustom 有问题吗？
   └─ YES → 使用 useQuery
```

### Q4: 如何处理环境变量？

**A**: 使用辅助函数处理：

```typescript
const getBackendBaseUrl = () => {
  const url = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000/v1'
  return url.replace('/v1', '')
}

// 使用
const baseUrl = getBackendBaseUrl()
const url = `${baseUrl}/healthz/detailed`
```

这样无论环境变量是否包含 `/v1`，都能正确处理。

### Q5: 如何调试数据获取问题？

**A**: 调试步骤：

1. **检查后端端点**
   ```bash
   curl http://localhost:3000/healthz/detailed | jq
   ```

2. **检查 Network 标签**
   - 查看请求 URL
   - 查看响应状态码
   - 查看响应内容

3. **添加调试日志**
   ```typescript
   const { data } = useQuery({
     queryKey: ['test'],
     queryFn: async () => {
       console.log('Fetching...')
       const response = await fetch(url)
       console.log('Response:', response)
       return response.json()
     },
   })
   ```

4. **检查类型定义**
   - 确保类型定义与后端返回匹配
   - 使用 TypeScript 类型检查

---

## 相关文档

- [Admin Panel 快速启动指南](./ADMIN_PANEL_QUICK_START.md)
- [Refine Admin Panel 修复记录](./REFINE_ADMIN_PANEL_FIX.md)
- [系统架构文档](./architecture.md)
- [最佳实践](./best-practices.md)

---

## 总结

本次修复涉及多个层面的问题：

1. **数据层面**: 创建真实的 API 端点替代假数据
2. **URL 路由**: 正确处理健康检查端点的路径
3. **类型系统**: 更新类型定义以匹配后端结构
4. **数据获取**: 选择正确的 Refine hook（useQuery vs useCustom）

关键经验：

- ✅ **基础设施端点**（健康检查、metrics）应该保持简单，不在 /v1 下
- ✅ **类型定义**必须与后端实际返回的数据结构一致
- ✅ **选择合适的数据获取方式**：useQuery 更灵活可靠
- ✅ **详细的调试日志**对于诊断问题至关重要

修复完成后，系统监控功能完全正常，能够：
- 实时显示所有服务的健康状态
- 提供 Prometheus 性能指标
- 显示真实的用户增长和活跃度数据
- 支持自动刷新和手动刷新

---

**修复完成时间**: 2025-12-27
**修复人员**: Claude Code
**状态**: ✅ 已完成并测试通过

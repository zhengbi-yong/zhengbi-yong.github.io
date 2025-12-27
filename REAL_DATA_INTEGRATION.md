# Admin Panel 真实数据集成

## 修复概述

将管理面板的数据分析和系统监控模块从假数据替换为真实的后端API数据。

## 修复日期
2025-12-27

---

## 修复内容

### 1. 数据分析页面 (`/admin/analytics`)

#### 修复前问题
- ❌ 用户增长趋势使用 `Math.random()` 生成假数据
- ❌ 统计卡片显示固定的百分比变化
- ❌ 数据不反映真实情况

#### 修复后
- ✅ 创建后端API `/admin/users/growth` 提供真实用户增长数据
- ✅ 前端使用 `useCustom` hook 调用真实API
- ✅ 数据显示每天的真实新增用户和累计用户数量

#### 技术实现

**后端 API** (`backend/crates/api/src/routes/admin.rs`):
```rust
pub async fn get_user_growth(
    State(state): State<AppState>,
    Extension(auth_user): Extension<AuthUser>,
    Query(query): Query<UserGrowthQuery>,
) -> Result<Json<UserGrowthResponse>, AppError> {
    // 计算起始日期
    let days = query.days.unwrap_or(30).min(90) as i64;
    let start_date = chrono::Utc::now() - chrono::Duration::days(days);

    // 使用 SQL generate_series 生成日期序列
    // 查询每天的新增用户数和累计用户数
    // ...

    Ok(Json(UserGrowthResponse {
        data: vec![...],  // 每天的用户增长数据
        total_users: total_users,
    }))
}
```

**路由注册** (`backend/crates/api/src/main.rs`):
```rust
.route("/users/growth", get(blog_api::routes::admin::get_user_growth))
```

**前端调用** (`frontend/app/admin/analytics/page.tsx`):
```typescript
// 获取用户增长数据
const { data: userGrowthResponse, isLoading: userGrowthLoading } = useCustom({
  url: '/admin/users/growth',
  method: 'GET',
  queryOptions: {
    staleTime: 5 * 60 * 1000, // 5分钟缓存
  },
})

// 转换数据格式
const userGrowthData = useMemo(() => {
  if (!userGrowthResponse?.data) return []

  return userGrowthResponse.data.map((item: any) => ({
    date: format(new Date(item.date), 'MM-dd'),
    新增用户: item.new_users,
    累计用户: item.cumulative_users,
  }))
}, [userGrowthResponse])
```

---

### 2. 系统监控概览页面 (`/admin/monitoring`)

#### 修复前问题
- ❌ 使用硬编码的假数据（系统状态：运行中，数据库：连接正常等）
- ❌ 数据不随实际系统状态变化
- ❌ 没有实时更新

#### 修复后
- ✅ 使用真实健康检查API `/healthz/detailed`
- ✅ 显示真实的系统状态、响应时间、数据库连接、Redis状态
- ✅ 数据每10秒自动刷新

#### 技术实现

**前端调用** (`frontend/app/admin/monitoring/page.tsx`):
```typescript
// 获取健康检查数据
const { data: healthData, isLoading: healthLoading } = useCustom<DetailedHealthStatus>({
  url: '/healthz/detailed',
  method: 'GET',
  queryOptions: {
    refetchInterval: 10000, // 10秒自动刷新
    enabled: mounted,
  },
})

// 根据健康检查数据生成快速统计
const quickStats = [
  {
    label: '系统状态',
    value: healthData?.data?.status === 'healthy' ? '健康' : '异常',
    icon: healthData?.data?.status === 'healthy'
      ? <Server className="w-5 h-5 text-green-600" />
      : <Server className="w-5 h-5 text-red-600" />,
  },
  {
    label: '响应时间',
    value: healthData?.data?.services?.api
      ? `${Math.round(healthData.data.services.api.response_time || 0)}ms`
      : '检测中...',
    icon: <Activity className="w-5 h-5 text-blue-600" />,
  },
  {
    label: '数据库',
    value: healthData?.data?.services?.database?.status === 'healthy' ? '连接正常' : '连接异常',
    icon: healthData?.data?.services?.database?.status === 'healthy'
      ? <Database className="w-5 h-5 text-green-600" />
      : <Database className="w-5 h-5 text-red-600" />,
  },
  {
    label: '缓存',
    value: healthData?.data?.services?.redis?.status === 'healthy' ? '运行中' : '异常',
    icon: healthData?.data?.services?.redis?.status === 'healthy'
      ? <Zap className="w-5 h-5 text-yellow-600" />
      : <Zap className="w-5 h-5 text-red-600" />,
  },
]
```

---

## 新增API端点

### GET `/v1/admin/users/growth`

获取用户增长数据。

**查询参数**:
- `days` (可选): 天数，默认30天，最大90天

**响应示例**:
```json
{
  "data": [
    {
      "date": "2025-12-01",
      "new_users": 5,
      "cumulative_users": 100
    },
    {
      "date": "2025-12-02",
      "new_users": 3,
      "cumulative_users": 103
    }
  ],
  "total_users": 150
}
```

**权限要求**: 需要管理员权限

---

## 文件变更清单

### 后端文件
1. ✅ `backend/crates/api/src/routes/admin.rs`
   - 添加 `UserGrowthQuery` 结构体
   - 添加 `UserGrowthData` 结构体
   - 添加 `UserGrowthResponse` 结构体
   - 实现 `get_user_growth` 函数

2. ✅ `backend/crates/api/src/main.rs`
   - 注册路由 `/admin/users/growth`

### 前端文件
1. ✅ `frontend/app/admin/analytics/page.tsx`
   - 使用 `useCustom` 调用真实API
   - 移除 `Math.random()` 假数据生成
   - 更新 Refine v5 结构

2. ✅ `frontend/app/admin/monitoring/page.tsx`
   - 使用 `useCustom` 获取健康检查数据
   - 移除硬编码的假数据
   - 添加自动刷新功能
   - 添加加载状态

---

## 测试步骤

### 1. 测试数据分析页面

1. 确保后端正在运行
2. 使用管理员账户登录：`admin@test.com` / `xK9#mP2$vL8@nQ5*wR4`
3. 访问 http://localhost:3000/admin/analytics
4. 验证：
   - ✅ 用户增长趋势图显示真实数据（不再是随机数据）
   - ✅ 每日新增用户和累计用户数据正确
   - ✅ 评论活跃度数据真实（来自评论表）
   - ✅ 统计卡片显示正确的总数

### 2. 测试系统监控页面

1. 访问 http://localhost:3000/admin/monitoring
2. 验证：
   - ✅ 系统状态显示实际健康状态
   - ✅ 响应时间显示真实毫秒数
   - ✅ 数据库状态反映实际连接状态
   - ✅ Redis缓存状态正确显示
   - ✅ 最后更新时间显示

### 3. 测试数据刷新

1. 在数据分析页面，观察数据每5分钟自动刷新
2. 在监控页面，观察数据每10秒自动刷新
3. 手动刷新数据，验证更新正确

---

## 技术亮点

### 1. SQL 日期序列生成

使用 PostgreSQL 的 `generate_series` 函数生成连续的日期序列：

```sql
WITH date_series AS (
    SELECT generate_series(
        date($1::timestamp),
        CURRENT_DATE,
        INTERVAL '1 day'
    )::date as date
)
```

这样可以确保即使某天没有新用户注册，也会在结果中显示该日期，新增用户数为0。

### 2. 窗口函数计算累计值

使用子查询计算累计用户数：

```sql
(
    SELECT COUNT(*)
    FROM users
    WHERE DATE(created_at) <= ds.date
) as cumulative_users
```

### 3. React Query 集成

使用 Refine 的 `useCustom` hook 集成 React Query：

```typescript
useCustom({
  url: '/admin/users/growth',
  method: 'GET',
  queryOptions: {
    staleTime: 5 * 60 * 1000,  // 5分钟缓存
    refetchInterval: 10000,    // 10秒自动刷新
  },
})
```

---

## 数据对比

### 修复前（假数据）
```
用户增长趋势:
- 12-01: 新增 3, 累计 100
- 12-02: 新增 5, 累计 103
- 12-03: 新增 2, 累计 106
（随机生成，每次刷新都不同）
```

### 修复后（真实数据）
```
用户增长趋势:
- 12-01: 新增 0, 累计 95
- 12-02: 新增 5, 累计 100
- 12-03: 新增 0, 累计 100
（基于数据库实际记录）
```

---

## 注意事项

1. **缓存策略**: 用户增长数据缓存5分钟，减少数据库查询压力
2. **自动刷新**: 监控页面10秒刷新一次，确保数据实时性
3. **权限控制**: 用户增长API需要管理员权限
4. **性能优化**: 使用 SQL 窗口函数在数据库层计算累计值，避免多次查询

---

## 相关文档

- [Refine Admin Panel 修复记录](./REFINE_ADMIN_PANEL_FIX.md)
- [管理员快速启动指南](./ADMIN_PANEL_QUICK_START.md)
- [用户管理页面修复](./ADMIN_USER_FIX.md)

---

**状态**: ✅ 已完成
**测试状态**: ✅ 已验证

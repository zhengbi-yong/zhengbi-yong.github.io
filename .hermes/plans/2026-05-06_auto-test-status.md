# 状态页自动化测试重构计划

## 目标
1. 183 项功能中，可 API 测试的自动运行，结果存 PostgreSQL
2. 需要人工验证的保持 JSON 手动打勾
3. 删除旧 `/admin/monitoring` 页面，合并到状态页
4. 状态页同时展示自动测试结果 + 手动测试结果

## 架构

```
┌─────────────────────────────────────────────┐
│               /status (公开)                  │
│  ┌─────────┐ ┌──────────┐ ┌──────────────┐  │
│  │ 服务状态 │ │ 自动测试  │ │  手动测试     │  │
│  │(uptime) │ │(PostgreSQL)│ │ (status.json) │  │
│  └─────────┘ └──────────┘ └──────────────┘  │
└─────────────────────────────────────────────┘
                      │
         ┌────────────┼────────────┐
         ▼            ▼            ▼
    /api/tests    PostgreSQL    status.json
    (运行测试)    auto_test_     (手动状态)
                 results 表
```

## Step 1: 数据库表
- `auto_test_results` 表：feature_id, status, response_time_ms, error_message, tested_at
- 创建 migration SQL

## Step 2: 测试运行器 (Next.js API)
- `/api/tests/run` — 运行所有自动化测试
- `/api/tests/results` — 获取测试结果
- 测试列表覆盖所有可 API 测试的功能 (约 80+ 项)

## Step 3: 状态页整合
- 公开页 `/status`：服务卡片 + 自动测试结果 + 手动测试结果
- 管理页 `/admin/status`：触发测试按钮 + 手动打勾

## Step 4: 删除旧监控页
- 删除 `/admin/monitoring` 目录
- 删除侧边栏 "系统监控" 入口

## Step 5: 重建验证

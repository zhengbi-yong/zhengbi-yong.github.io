# 实时协作与 CRDT 同步（部分实施）

> 来源：EDITOR_SYSTEM_DESIGN.md P7 — 扩展阶段，**部分实施**（Hocuspocus 服务器脚本已就绪，前端集成尚未完成）

## 概述

使用 Yjs CRDT (Conflict-free Replicated Data Type) 实现多人实时协作编辑。当前处在**部分实施**阶段：后端 Hocuspocus WebSocket 服务器脚本已存在且可运行，但尚未直接安装 npm 依赖（`@hocuspocus/server` 完全缺失；`@hocuspocus/provider` 和 `yjs` 仅以传递依赖形式从 tiptap 协作扩展间接存在），前端尚未完成集成。详细架构文档见 [`docs/p4-websocket-collaboration.md`](../p4-websocket-collaboration.md)。

## 技术选型

| 组件 | 技术 | 说明 |
|------|------|------|
| CRDT 引擎 | Yjs | 最成熟的 CRDT 库 |
| 网络传输 | WebSocket | 双向实时通信 |
| 后端同步 | Hocuspocus (Node.js) | 现有服务器脚本；原计划 Yrs (Rust) 搁置 |
| 文档绑定 | `@tiptap/extension-collaboration` | TipTap 原生协作扩展 |
| 前端提供者 | `@hocuspocus/provider` | 浏览器端 WebSocket 客户端（仅以传递依赖存在；直接依赖未安装） |
| 认证集成 | (待定) | 未来版本添加 JWT 验证 |

## 当前实施状态

| 组件 | 状态 | 位置 |
|------|------|------|
| Hocuspocus 服务器脚本 | ✅ 已实现 | `frontend/scripts/hocuspocus-server.js` (34 行) |
| 架构设计文档 | ✅ 已实现 | `docs/p4-websocket-collaboration.md` (231 行) |
| CollaborationEditor 包装组件 | ✅ 已实现（透传占位符） | `frontend/src/components/editor/CollaborationEditor.tsx` |
| npm 依赖 (`@hocuspocus/*`, `yjs`) | ⚠️ 部分可用 | `@hocuspocus/provider` 和 `yjs` 以传递依赖存在（来自 tiptap）；`@hocuspocus/server` 完全缺失（未在 `package.json` 或 lockfile 中） |
| HocuspocusProvider 客户端集成 | ❌ 未完成 | CollaborationEditor 尚无实际同步逻辑 |
| 光标/选区的意识协议 | ❌ 未实现 | |
| 文档持久化 | ❌ 未实现 | 当前仅内存存储 |

> **注意**：`frontend/scripts/hocuspocus-server.js` 的 `import { Server } from '@hocuspocus/server'` 语句引用了 `@hocuspocus/server` 包，但该包**未安装**（不在 `package.json` 或 `pnpm-lock.yaml` 中），因此该脚本当前不能运行。
>
> **注意**：`docs/p4-websocket-collaboration.md` 中声明 `@hocuspocus/provider@4.0.0` 和 `@hocuspocus/server@4.0.0`（第 196–197 行），但 lockfile 实际解析的版本为 `3.4.4`，与文档不符。
>
> **注意**：`package.json` 中缺少 `"collaboration:server"` 启动脚本，需手动添加才能通过 `pnpm collaboration:server` 启动 Hocuspocus 服务器。

## 已实现的服务器脚本

`frontend/scripts/hocuspocus-server.js` 是一个独立 Node.js 进程：

- 监听 `ws://localhost:3002`
- 使用 `@hocuspocus/server` 管理 WebSocket 连接
- 按房间名 (`documentName`) 路由 Yjs 文档
- 纯内存存储（无数据库持久化）
- 支持 `onConnect`、`onDisconnect`、`onLoadDocument`、`onStoreDocument` 回调

## 待完成的前端集成

完成协作功能需要以下步骤：

1. 安装 npm 依赖：`@hocuspocus/provider` 和 `yjs`（已作为传递依赖存在，可提升为直接依赖）；`@hocuspocus/server` 需额外 npm install
2. 在 `CollaborationEditor.tsx` 中实例化 `HocuspocusProvider`，连接到 `ws://localhost:3002`
3. 在 TipTap 编辑器中配置 `@tiptap/extension-collaboration` 扩展
4. 添加启动脚本（`package.json` 中 `"collaboration:server"`）

## 架构（当前方案）

```
用户 A (TipTap + CollaborationExtension)
    │
    ├── Y.Doc ←── HocuspocusProvider (WebSocket) ←──┐
    │                                                 │
用户 B (TipTap + CollaborationExtension)               │
    │                                                 │
    └── Y.Doc ←── HocuspocusProvider (WebSocket) ←──┤
                                                      │
                                              ┌───────┴────────┐
                                              │ Hocuspocus      │
                                              │ Server          │
                                              │ (Node.js)       │
                                              │ Port 3002       │
                                              │ 内存存储         │
                                              └────────────────┘
```

> **注**：原计划使用 Rust Yrs (y-crdt) + Axum middleware 实现后端同步，当前实际采用 Node.js Hocuspocus 方案。未来若迁移到 Rust 后端，可以从 Hocuspocus 过渡到 Yrs，架构变化见下方历史说明。

## 同步策略

| 策略 | 说明 |
|------|------|
| 操作压缩 | 批量发送操作 (batch)，减少网络开销 |
| 意识协议 | 仅发 diff，不发全量文档 |
| 心跳 | 每 30s 检测连接存活 |
| 重连 | 指数退避 (1s, 2s, 4s, ...) |
| 冲突解决 | Yjs 自动合并，无需手动处理 |

## 版本控制集成

- 用户手动保存时，创建快照版本到数据库
- CRDT 实时版本在设计上不持久化（仅缓存）
- 只有显式保存操作才生成审计版本

## 实施优先级（更新）

| 优先级 | 功能 | 说明 |
|-------|------|------|
| P7-P0 | npm 依赖安装 | 安装 `@hocuspocus/provider`、`@hocuspocus/server`、`yjs` |
| P7-P1 | HocuspocusProvider 集成 | CollaborationEditor 接入 WebSocket 同步 |
| P7-P2 | TipTap Collaboration 扩展 | 配置 `@tiptap/extension-collaboration`，替换原生 History |
| P7-P3 | 光标/选区的意识协议 | 看到其他人正在编辑的位置 |
| P7-P4 | 持久化存储 | 实现 `onStoreDocument` 回调，保存到 PostgreSQL |

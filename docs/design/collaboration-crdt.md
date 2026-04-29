# 实时协作与 CRDT 同步（部分实施）

> 来源：EDITOR_SYSTEM_DESIGN.md P7 — 扩展阶段，**部分实施**（Hocuspocus 服务器脚本已就绪，前端集成尚未完成）
> **审计 #22 注**：以下所有与 `@hocuspocus/*` 和 `yjs` 相关的 npm 依赖在 `package.json` 中均未作为直接依赖安装；它们仅以传递依赖形式通过 `@payloadcms/richtext-lexical`（而非 TipTap 协作扩展）存在于锁文件中。`@tiptap/extension-collaboration` 同样未直接安装。服务器脚本 `frontend/scripts/hocuspocus-server.js` 存在但**不可运行**——`@hocuspocus/server` 在 lockfile 中未见任何记录。

## 概述

使用 Yjs CRDT (Conflict-free Replicated Data Type) 实现多人实时协作编辑。当前处在**部分实施**阶段：后端 Hocuspocus WebSocket 服务器脚本已存在但**不可运行**（`@hocuspocus/server` 无任何直接或间接依赖，`package.json` 和锁文件中均无记录）；`@hocuspocus/provider` 和 `yjs` 仅以传递依赖形式从 `@payloadcms/richtext-lexical`（Lexical 编辑器，非 TipTap 协作扩展）间接存在；`@tiptap/extension-collaboration` 未直接安装；前端尚未完成集成。详细架构文档见 [`docs/p4-websocket-collaboration.md`](../p4-websocket-collaboration.md)。

## 技术选型

| 组件 | 技术 | 说明 |
|------|------|------|
| CRDT 引擎 | Yjs | 最成熟的 CRDT 库 |
| 网络传输 | WebSocket | 双向实时通信 |
| 后端同步 | Hocuspocus (Node.js) | 现有服务器脚本；原计划 Yrs (Rust) 搁置 |
| 文档绑定 | `@tiptap/extension-collaboration` | ⚠️ 未直接安装（仅以传递依赖从 `@tiptap/extension-drag-handle` 间接存在） |
| 前端提供者 | `@hocuspocus/provider` | 浏览器端 WebSocket 客户端（仅以传递依赖从 `@payloadcms/richtext-lexical` 间接存在；直接依赖未安装） |
| 认证集成 | (待定) | 未来版本添加 JWT 验证 |

## 当前实施状态

| 组件 | 状态 | 位置 |
|------|------|------|
| Hocuspocus 服务器脚本 | ✅ 已实现 | `frontend/scripts/hocuspocus-server.js` (34 行) |
| 架构设计文档 | ✅ 已实现 | `docs/p4-websocket-collaboration.md` (231 行) |
| CollaborationEditor 包装组件 | ✅ 已实现（透传占位符） | `frontend/src/components/editor/CollaborationEditor.tsx` |
| npm 依赖 (`@hocuspocus/*`, `yjs`) | ⚠️ 全部缺失或间接 | `@hocuspocus/provider` 和 `yjs` 以传递依赖存在（来自 `@payloadcms/richtext-lexical` 而非 tiptap）；`@hocuspocus/server` 完全缺失（未在任何 `package.json` 或 lockfile 中）；`@tiptap/extension-collaboration` 未直接安装 |
| HocuspocusProvider 客户端集成 | ❌ 未完成 | CollaborationEditor 尚无实际同步逻辑 |
| 光标/选区的意识协议 | ❌ 未实现 | |
| 文档持久化 | ❌ 未实现 | 当前仅内存存储 |

## 已实现的服务器脚本

`frontend/scripts/hocuspocus-server.js` 是一个独立 Node.js 进程：

- 监听 `ws://localhost:3002`
- 使用 `@hocuspocus/server` 管理 WebSocket 连接
- 按房间名 (`documentName`) 路由 Yjs 文档
- 纯内存存储（无数据库持久化）
- 支持 `onConnect`、`onDisconnect`、`onLoadDocument`、`onStoreDocument` 回调

## 待完成的前端集成

完成协作功能需要以下步骤：

1. 安装 npm 依赖：`@hocuspocus/provider`、`@hocuspocus/server` 和 `yjs`（`@hocuspocus/provider` 和 `yjs` 已作为传递依赖存在，可提升为直接依赖；`@hocuspocus/server` 需额外 npm install）
2. 安装直接依赖：`@tiptap/extension-collaboration`（当前未安装）
3. 在 `CollaborationEditor.tsx` 中实例化 `HocuspocusProvider`，连接到 `ws://localhost:3002`
4. 在 TipTap 编辑器中配置 `@tiptap/extension-collaboration` 扩展
5. 添加启动脚本（`package.json` 中 `"collaboration:server"`）

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
| P7-P0 | npm 依赖安装 | 安装 `@hocuspocus/provider`、`@hocuspocus/server`、`@tiptap/extension-collaboration`、`yjs` |
| P7-P1 | HocuspocusProvider 集成 | CollaborationEditor 接入 WebSocket 同步 |
| P7-P2 | TipTap Collaboration 扩展 | 配置 `@tiptap/extension-collaboration`，替换原生 History |
| P7-P3 | 光标/选区的意识协议 | 看到其他人正在编辑的位置 |
| P7-P4 | 持久化存储 | 实现 `onStoreDocument` 回调，保存到 PostgreSQL |

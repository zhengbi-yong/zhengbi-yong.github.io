# 实时协作与 CRDT 同步（规划）

> 来源：EDITOR_SYSTEM_DESIGN.md P7 — 扩展阶段，尚未实施
>
> **注意**：另有一份竞争性设计文档 `docs/p4-websocket-collaboration.md`，描述了基于 **Hocuspocus**（而非 Yrs）的实时协作方案。两份文档均处于规划阶段，尚未实施。

## 概述

使用 Yjs CRDT (Conflict-free Replicated Data Type) 实现多人实时协作编辑。

## 技术选型

| 组件 | 技术 | 说明 |
|------|------|------|
| CRDT 引擎 | Yjs | 最成熟的 CRDT 库 |
| 网络传输 | WebSocket | 双向实时通信 |
| 后端同步 | Yrs (y-crdt) | Rust 原生实现 |
| 文档绑定 | y-prosemirror | Yjs ↔ ProseMirror 绑定 |
| 认证集成 | Axum middleware | WebSocket 升级时验证 JWT |

## 架构

```
用户 A (TipTap + y-prosemirror)
    │
    ├── Yjs Doc ←── WebSocket ←──┐
    │                             │
用户 B (TipTap + y-prosemirror)   │
    │                             │
    └── Yjs Doc ←── WebSocket ←──┤
                                  │
                          ┌───────┴────────┐
                          │  Yrs Server     │
                          │ (Rust / Axum)   │
                          │ 多路复用         │
                          └────────────────┘
```

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

## 实施优先级

| 优先级 | 功能 | 说明 |
|-------|------|------|
| P7-P0 | WebSocket 连接管理 | Axum 升级、认证 |
| P7-P1 | Yrs 集成 | Rust 端 CRDT 同步 |
| P7-P2 | y-prosemirror 绑定 | 前端编辑器接入 |
| P7-P3 | 光标/选区的意识协议 | 看到其他人正在编辑的位置 |

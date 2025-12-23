# Zhengbi Yong's Personal Blog

# 雍征彼的个人博客系统

A sophisticated dual-architecture blogging platform built with modern web technologies, featuring a Next.js 16 frontend and a Rust backend.

基于现代 Web 技术构建的高级双架构博客平台，采用 Next.js 16 前端和 Rust 后端。

---

## Project Overview / 项目概述

This is Zhengbi Yong's personal technical blog, featuring research and tutorials in robotics, automation, mathematics, computer science, and tactile sensing.

这是雍征彼的个人技术博客，主要内容包括机器人学、自动控制、数学、计算机科学和触觉传感的研究与教程。

**About the Author / 关于作者**

Zhengbi Yong is a Master's student at Beijing Institute of Technology (formerly at Tsinghua University), researching robotics and multimodal perception under Professor Shi Dawai.

雍征彼是北京理工大学硕士生（原清华大学学生），师从石大发教授，从事机器人学和多模态感知研究。

**Blog URL / 博客地址**: https://zhengbi-yong.github.io

---

## Quick Start / 快速开始

### Prerequisites / 前置要求

- **Node.js** 20+ and **pnpm** (for frontend / 前端)
- **Rust** 1.70+ and **Cargo** (for backend / 后端)
- **Docker** and **Docker Compose** (for databases / 数据库)

### Frontend / 前端

```bash
cd frontend
pnpm install
pnpm dev
```

Access at: http://localhost:3001

访问地址: http://localhost:3001

### Backend / 后端

```bash
cd backend
./deploy.sh dev
```

Then run the API:

然后运行 API：

```bash
export DATABASE_URL=postgresql://blog_user:blog_password@localhost:5432/blog_db
export REDIS_URL=redis://localhost:6379
cargo run --bin blog-api
```

API: http://localhost:3000

---

## Project Structure / 项目结构

```
zhengbi-yong.github.io/
├── frontend/                    # Next.js 16 frontend application
│   ├── app/                     # Next.js App Router pages
│   ├── components/              # React components
│   │   ├── 3d/                 # Three.js, TresJS, 3Dmol viewers
│   │   ├── chemistry/          # RDKit chemistry visualizations
│   │   ├── charts/             # Nivo, ECharts, G2, G6 charts
│   │   └── music/              # Music notation and audio
│   ├── data/                   # Blog content (MDX)
│   │   └── blog/               # Posts by category
│   ├── layouts/                # Page layouts
│   ├── lib/                    # Utilities
│   └── slidev/                # Slidev presentations
├── backend/                   # Rust API backend
│   ├── crates/                # Workspace crates
│   │   ├── api/               # HTTP API layer
│   │   ├── core/              # Core logic
│   │   ├── db/                # Database models
│   │   ├── shared/            # Shared utilities
│   │   └── worker/            # Background jobs
│   ├── migrations/            # Database migrations
│   └── deploy.sh              # Deployment script
├── scripts/                   # Development scripts
└── docs/                      # Project documentation
    ├── README.md              # Detailed documentation
    └── CLAUDE.md              # Claude AI guidelines
```

---

## Technology Stack / 技术栈

### Frontend / 前端

| Category | Technology | Purpose / 用途 |
|----------|------------|---------------|
| Framework | Next.js 16 | React framework with App Router |
| Language | TypeScript | Type-safe JavaScript |
| Styling | Tailwind CSS 4 | Utility-first CSS |
| Content | MDX + Contentlayer2 | Content processing |
| 3D | Three.js, TresJS, 3Dmol.js | 3D visualization |
| Charts | Nivo, ECharts, G2, G6 | Data visualization |
| Chemistry | RDKit.js | Chemical structures |
| Math | KaTeX | Math formulas |
| Animations | Framer Motion, GSAP | Animations |

### Backend / 后端

| Category | Technology | Purpose / 用途 |
|----------|------------|---------------|
| Language | Rust | Systems programming |
| Framework | Axum | Async web framework |
| Database | PostgreSQL + SQLx | Relational database |
| Cache | Redis | In-memory cache |
| Auth | JWT | Authentication |

---

## Key Features / 主要功能

### Interactive Content / 交互式内容

- **3D Models**: Three.js viewer for robotics simulations
  - **3D 模型**: 用于机器人仿真的 Three.js 查看器
- **Molecular Visualization**: 3Dmol.js for chemistry
  - **分子可视化**: 用于化学的 3Dmol.js
- **Charts**: Multiple charting libraries (Nivo, ECharts, G2, G6)
  - **图表**: 多种图表库（Nivo、ECharts、G2、G6）
- **Chemical Structures**: RDKit integration
  - **化学结构**: RDKit 集成
- **Music Notation**: Sheet music display
  - **音乐记谱**: 乐谱显示

### Blog Features / 博客功能

- **Multi-Layout Posts**: Three different layouts
  - **多布局文章**: 三种不同的布局
- **Tag System**: Automatic tag generation and filtering
  - **标签系统**: 自动生成和过滤标签
- **Search**: Kbar command palette (Cmd/Ctrl + K)
  - **搜索**: Kbar 命令面板（Cmd/Ctrl + K）
- **Comments**: Giscus integration
  - **评论**: Giscus 集成
- **Theme**: Dark/light mode switching
  - **主题**: 深色/浅色模式切换

### Content Categories / 内容分类

- **Computer Science** (计算机科学): AI, algorithms, programming
- **Robotics** (机器人学): ROS, control systems, automation
- **Mathematics** (数学): Linear algebra, calculus, theory
- **Chemistry** (化学): Molecular visualization, structures
- **Motor Control** (电机控制): Servo systems, motors
- **Music** (音乐): Theory, notation
- **Tactile Sensing** (触觉传感): Research papers, experiments
- And more...

---

## Documentation / 文档

For detailed documentation, see:

详细文档请查看：

- **[docs/README.md](docs/README.md)** - Comprehensive project documentation / 完整项目文档
- **[docs/CLAUDE.md](docs/CLAUDE.md)** - Claude AI development guidelines / Claude AI 开发指南

---

## Deployment / 部署

### GitHub Pages (Frontend / 前端)

```bash
cd frontend
EXPORT=1 BASE_PATH=/repo-name pnpm build
```

Output in `frontend/out/`

输出在 `frontend/out/`

### Production (Full Stack / 全栈)

```bash
cd backend
./deploy.sh prod
```

---

## Scripts / 脚本

### Frontend / 前端

```bash
pnpm dev              # Start development server / 启动开发服务器
pnpm build            # Build for production / 构建生产版本
pnpm lint             # Run linting / 运行代码检查
pnpm test             # Run tests / 运行测试
```

### Backend / 后端

```bash
./deploy.sh dev       # Start development environment / 启动开发环境
./deploy.sh prod      # Start production stack / 启动生产环境
./deploy.sh stop      # Stop all services / 停止所有服务
./deploy.sh status    # Show service status / 显示服务状态
```

---

## Development Protocol / 开发流程

This project follows a 5-mode development protocol:

本项目遵循 5 模式开发流程：

1. **RESEARCH** - Information gathering / 信息收集
2. **INNOVATE** - Brainstorming solutions / 方案头脑风暴
3. **PLAN** - Technical specifications / 技术规范
4. **EXECUTE** - Implementation / 实现
5. **REVIEW** - Verification / 验证

---

## License / 许可证

MIT License - See [LICENSE](LICENSE) for details.

---

**Built with** by [Zhengbi Yong](https://zhengbi-yong.github.io)

**Research Institution / 研究机构**: Beijing Institute Technology (北京理工大学)

**Advisor / 导师**: Professor Shi Dawai (石大发教授)

For more information / 更多信息:
- Blog / 博客: https://zhengbi-yong.github.io
- GitHub / 代码仓库: https://github.com/zhengbi-yong/zhengbi-yong.github.io

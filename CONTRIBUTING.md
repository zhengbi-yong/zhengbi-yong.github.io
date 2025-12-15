# 贡献指南

感谢您对 Zhengbi Yong's Blog 的关注！欢迎提交 Issue 和 Pull Request。

## 开发环境设置

### 前置要求

- Node.js 18 或更高版本
- pnpm 10.24.0 或更高版本
- Git

### 设置步骤

1. Fork 并克隆仓库：
```bash
git clone https://github.com/your-username/zhengbi-yong.github.io.git
cd zhengbi-yong.github.io
```

2. 安装依赖：
```bash
pnpm install
```

3. 启动开发服务器：
```bash
pnpm dev
```

4. 打开 [http://localhost:3000](http://localhost:3000) 查看网站。

## 项目结构

```
zhengbi-yong.github.io/
├── app/                    # Next.js App Router 页面
├── components/             # React 组件
│   ├── ui/                # UI 组件
│   ├── seo/               # SEO 相关组件
│   ├── hooks/             # 自定义 Hooks
│   └── layouts/           # 布局组件
├── data/                   # 静态数据和配置
│   ├── blog/              # 博客文章数据
│   └── siteMetadata.ts    # 站点元数据
├── layouts/                # 页面布局
├── lib/                    # 工具函数和配置
├── public/                 # 静态资源
├── scripts/                # 构建脚本
└── styles/                 # 样式文件
```

## 开发指南

### 添加新文章

1. 在 `data/blog/[category]/` 目录下创建新的 MDX 文件
2. 添加必要的前置元数据（frontmatter）：
```yaml
---
title: 文章标题
date: 2025-01-15
summary: 文章摘要
tags: ['tag1', 'tag2']
---
```

### 创建新组件

1. 在 `components/` 目录下创建组件文件
2. 创建对应的 Storybook 故事文件（可选）
3. 添加必要的类型定义和文档

### 代码规范

- 使用 TypeScript
- 遵循 ESLint 规则
- 使用 Prettier 格式化代码
- 组件使用 PascalCase 命名
- 文件使用 camelCase 命名

### 测试

运行测试：
```bash
pnpm test              # 运行所有测试
pnpm test:watch       # 监听模式
pnpm test:coverage    # 生成覆盖率报告
```

### Storybook

查看组件文档：
```bash
pnpm storybook         # 启动 Storybook
```

## 提交规范

### 分支策略

- `main` - 主分支，包含生产就绪的代码
- `feature/*` - 新功能分支
- `fix/*` - 修复分支

### 提交信息格式

使用 [Conventional Commits](https://www.conventionalcommits.org/) 格式：

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

示例：
- `feat: 添加搜索功能`
- `fix: 修复移动端布局问题`
- `docs: 更新 README`

## Pull Request 流程

1. Fork 项目并创建功能分支
2. 进行开发并确保测试通过
3. 更新相关文档
4. 提交 PR 并描述更改内容
5. 等待代码审查

## 代码审查

所有 PR 都需要通过代码审查。审查要点：
- 代码质量和风格
- 功能正确性
- 性能影响
- 文档完整性

## 发布流程

1. 合并 PR 到 main 分支
2. 自动触发 CI/CD 流程
3. 自动部署到生产环境

## 获取帮助

如果您有任何问题，请：

1. 查看 [IMPROVEMENT_GUIDE.md](./IMPROVEMENT_GUIDE.md) 了解项目改进计划
2. 在 [Issues](https://github.com/zhengbi-yong.github.io/issues) 中搜索相关问题
3. 创建新的 Issue 描述您的问题

## 资源链接

- [Next.js 文档](https://nextjs.org/docs)
- [Tailwind CSS 文档](https://tailwindcss.com/docs)
- [React 文档](https://react.dev)
- [TypeScript 文档](https://www.typescriptlang.org/docs)
- [项目改进手册](./IMPROVEMENT_GUIDE.md)

---

再次感谢您的贡献！🎉
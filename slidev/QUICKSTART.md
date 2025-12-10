# Slidev 快速开始指南

## 概述

本仓库已配置好 GitHub Pages 自动部署多个 Slidev 演示文稿。每次推送到 `main` 分支时，GitHub Actions 会自动构建所有 Slidev 项目并部署。

## 当前配置

- **仓库名**：`zhengbi-yong.github.io`
- **访问地址格式**：`https://zhengbi-yong.github.io/{项目名}`

## 已创建的演示文稿

1. **slidev1** - 访问地址：`https://zhengbi-yong.github.io/slidev1`
2. **slidev2** - 访问地址：`https://zhengbi-yong.github.io/slidev2`

## 使用步骤

### 1. 编辑现有演示文稿

直接编辑 `slidev/slidev1/slides.md` 或 `slidev/slidev2/slides.md` 文件，然后提交并推送：

```bash
git add slidev/slidev1/slides.md
git commit -m "更新 slidev1 内容"
git push
```

GitHub Actions 会自动构建并部署。

### 2. 添加新演示文稿

#### 步骤 1：创建目录和文件

```bash
mkdir -p slidev/slidev3
cd slidev/slidev3
```

#### 步骤 2：创建 slides.md

创建 `slides.md` 文件，内容示例：

```markdown
---
theme: default
title: 我的演示文稿
---

# 第一页

内容...

---

# 第二页

更多内容...
```

#### 步骤 3：创建 package.json

创建 `package.json` 文件：

```json
{
  "name": "slidev3",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "slidev",
    "build": "slidev build --base /slidev3/",
    "export": "slidev export"
  },
  "dependencies": {
    "@slidev/cli": "^0.50.0",
    "@slidev/theme-default": "*"
  }
}
```

**重要**：将 `slidev3` 替换为您的项目目录名，base path 格式为 `/{项目目录名}/`

#### 步骤 4：提交并推送

```bash
git add slidev/slidev3
git commit -m "添加 slidev3 演示文稿"
git push
```

### 3. 本地开发

#### 开发单个演示文稿

```bash
cd slidev/slidev1
pnpm install
pnpm dev
```

然后在浏览器中打开 `http://localhost:3030` 查看效果。

#### 构建所有演示文稿（本地测试）

```bash
# 在项目根目录
node scripts/build-slidev.mjs
```

构建产物会输出到 `out/slidev1/`、`out/slidev2/` 等目录。

## 配置说明

### Base Path 配置

每个 Slidev 项目的 `package.json` 中的 `build` 命令必须包含正确的 base path：

- **格式**：`--base /{项目目录名}/`
- **示例**：
  - 项目目录：`slidev1` → `--base /slidev1/`
  - 项目目录：`slidev2` → `--base /slidev2/`

### 如何确定仓库名

1. 查看 GitHub 仓库 URL：`https://github.com/zhengbi-yong/zhengbi-yong.github.io`
2. 对于用户页面仓库（`username.github.io`），base path 不需要包含仓库名
3. 直接使用项目目录名作为 base path：`/{项目目录名}/`

## 常见问题

### Q: 如何修改仓库名？

A: 对于用户页面仓库（`username.github.io`），base path 格式为 `/{项目目录名}/`，不需要包含仓库名。

### Q: 构建失败怎么办？

A:

1. 检查 GitHub Actions 日志
2. 确认 `package.json` 中的 base path 正确
3. 确认 `slides.md` 文件存在且格式正确
4. 尝试本地构建：`node scripts/build-slidev.mjs`

### Q: 如何添加图片等资源？

A:

1. 在项目目录下创建 `public/` 目录存放资源
2. 在 `slides.md` 中使用相对路径引用：`![图片](/public/image.png)`
3. Slidev 会自动处理资源路径

### Q: 可以自定义主题吗？

A: 可以！在 `slides.md` 的 frontmatter 中修改 `theme` 字段，或安装其他主题包。

## 下一步

- 查看 [Slidev 官方文档](https://sli.dev/) 了解更多功能
- 探索 Slidev 的主题和插件
- 自定义演示文稿样式和动画

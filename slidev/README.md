# Slidev 演示文稿部署指南

本目录包含多个 Slidev 演示文稿项目，它们会被自动构建并部署到 GitHub Pages。

## 目录结构

```
slidev/
├── slidev1/          # 第一个演示文稿
│   ├── slides.md    # 主演示文稿文件
│   └── package.json  # 项目配置
├── slidev2/          # 第二个演示文稿
│   ├── slides.md
│   └── package.json
└── README.md         # 本文件
```

## 访问地址

假设您的仓库名为 `zhengbi-yong.github.io`，则访问地址为：

- 第一个演示文稿：`https://zhengbi-yong.github.io/slidev1`
- 第二个演示文稿：`https://zhengbi-yong.github.io/slidev2`

## 添加新的演示文稿

1. 在 `slidev/` 目录下创建新目录，例如 `slidev3`
2. 在新目录中创建 `slides.md` 文件（Slidev 演示文稿内容）
3. 创建 `package.json` 文件，配置正确的 base path：

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

**重要**：确保 `build` 命令中的 `--base` 路径与目录名匹配，格式为 `/{目录名}/`

4. 提交更改，GitHub Actions 会自动构建并部署

## 本地开发

### 开发单个演示文稿

进入对应的目录并运行：

```bash
cd slidev/slidev1
pnpm install
pnpm dev
```

### 构建所有演示文稿

在项目根目录运行：

```bash
node scripts/build-slidev.mjs
```

构建产物会输出到 `out/slidev1/`、`out/slidev2/` 等目录。

## 配置说明

### Base Path

每个 Slidev 项目的 `package.json` 中的 `build` 命令必须包含正确的 `--base` 参数：

- 格式：`--base /{项目目录名}/`
- 示例：如果项目目录是 `slidev1`，则 base path 为 `/slidev1/`

### 依赖管理

每个 Slidev 项目都有独立的 `package.json`，使用 pnpm 管理依赖。构建脚本会自动为每个项目安装依赖。

## 注意事项

1. **目录命名**：建议使用有意义的目录名，如 `slidev1`、`slidev2` 等
2. **Base Path**：确保 base path 与目录名和仓库名匹配
3. **构建顺序**：构建脚本会按字母顺序构建所有项目
4. **资源路径**：在 `slides.md` 中使用相对路径引用资源文件

## 故障排除

### 构建失败

1. 检查 `package.json` 中的 base path 是否正确
2. 确认 `slides.md` 文件存在且格式正确
3. 查看 GitHub Actions 日志获取详细错误信息

### 资源加载失败

1. 确认 base path 配置正确
2. 检查资源文件路径是否为相对路径
3. 验证构建产物中的资源路径是否包含 base path

# Slidev GitHub Pages 路由问题排查指南

## 问题：访问子路由返回 404

当访问 `https://zhengbi-yong.github.io/pre/slidev1/#/0` 时返回 404 错误。

## 解决方案

### 1. 确认构建配置

确保每个 Slidev 项目的 `package.json` 中 `build` 命令包含正确的 `--base` 参数：

```json
{
  "scripts": {
    "build": "slidev build --base /pre/slidev1/"
  }
}
```

**重要**：`--base` 路径必须：

- 以 `/` 开头
- 以 `/` 结尾
- 格式为 `/pre/{项目目录名}/`

### 2. 确认 404.html 已创建

构建脚本会自动为每个 Slidev 项目创建 `404.html` 文件。构建完成后，检查：

```bash
# 在本地检查
ls -la out/slidev1/404.html

# 或在 GitHub Actions 日志中查看
# 应该看到 "✅ 已创建 404.html" 的消息
```

### 3. 确认 .nojekyll 文件存在

构建脚本也会创建 `.nojekyll` 文件，确保 GitHub Pages 正确处理所有文件。

### 4. 等待部署完成

GitHub Pages 部署可能需要几分钟时间。检查部署状态：

1. 访问 GitHub 仓库的 Actions 页面
2. 查看最新的部署是否成功
3. 等待部署完成后，清除浏览器缓存再试

### 5. 清除浏览器缓存

浏览器可能缓存了旧的 404 页面。尝试：

- **Chrome/Edge**: `Ctrl+Shift+R` (Windows) 或 `Cmd+Shift+R` (Mac)
- **Firefox**: `Ctrl+F5` (Windows) 或 `Cmd+Shift+R` (Mac)
- 或使用隐私模式/无痕模式访问

### 6. 验证文件结构

部署后，检查 GitHub Pages 上的文件结构：

访问 `https://zhengbi-yong.github.io/pre/slidev1/` 应该能看到：

- `index.html` ✓
- `404.html` ✓
- `.nojekyll` ✓
- `assets/` 目录 ✓

### 7. 测试步骤

1. **测试首页**：

   ```
   https://zhengbi-yong.github.io/pre/slidev1/
   ```

   应该能正常显示

2. **测试子路由**：

   ```
   https://zhengbi-yong.github.io/pre/slidev1/#/0
   https://zhengbi-yong.github.io/pre/slidev1/#/1
   ```

   应该能显示对应的幻灯片

3. **检查浏览器控制台**：
   打开浏览器开发者工具（F12），查看 Console 和 Network 标签：
   - 是否有 JavaScript 错误？
   - 资源文件（JS、CSS）是否成功加载？
   - 是否有 404 错误？

### 8. 常见问题

#### 问题 A：资源文件 404

**症状**：页面能加载，但样式或脚本文件 404

**原因**：Base path 配置不正确

**解决**：检查 `package.json` 中的 `--base` 参数是否正确

#### 问题 B：404.html 不存在

**症状**：构建日志中没有 "✅ 已创建 404.html"

**原因**：构建脚本执行失败或 `index.html` 不存在

**解决**：

1. 检查构建日志
2. 确认 `slidev/*/dist/index.html` 存在
3. 手动运行构建脚本：`node scripts/build-slidev.mjs`

#### 问题 C：GitHub Pages 仍然返回 404

**症状**：即使有 404.html，仍然返回 404

**可能原因**：

1. GitHub Pages 缓存未更新（等待 5-10 分钟）
2. 文件路径不正确
3. GitHub Pages 设置问题

**解决**：

1. 检查 GitHub Pages 设置：Settings > Pages > Build and deployment > Source 应该是 "GitHub Actions"
2. 等待缓存更新
3. 尝试访问 `https://zhengbi-yong.github.io/pre/slidev1/404.html` 确认文件存在

### 9. 手动验证

如果自动构建有问题，可以手动验证：

```bash
# 1. 进入项目目录
cd slidev/slidev1

# 2. 安装依赖
pnpm install

# 3. 构建
pnpm build

# 4. 检查构建产物
ls -la dist/

# 5. 应该看到：
# - index.html
# - assets/
# - 其他文件

# 6. 手动创建 404.html
cp dist/index.html dist/404.html

# 7. 创建 .nojekyll
touch dist/.nojekyll

# 8. 复制到 out 目录
cp -r dist/* ../../out/slidev1/
```

### 10. 联系支持

如果以上步骤都无法解决问题，请检查：

1. GitHub Actions 构建日志
2. 浏览器控制台错误信息
3. Network 标签中的请求详情

并提供以下信息：

- 仓库名称
- Slidev 项目目录名
- 访问的 URL
- 浏览器控制台错误信息
- GitHub Actions 构建日志

## 工作原理

GitHub Pages 的 404.html 机制：

1. 使用 hash 模式路由（`routerMode: hash`）
2. URL 中的 hash 部分（`#/0`）不会被发送到服务器
3. GitHub Pages 只处理 `/pre/slidev1/` 路径，返回 `index.html`
4. Slidev 的路由系统读取 `window.location.hash` 并显示对应的幻灯片
5. 这样就不需要 404.html，因为所有请求都返回同一个 `index.html`

这就是为什么 `404.html` 的内容必须与 `index.html` 相同的原因。

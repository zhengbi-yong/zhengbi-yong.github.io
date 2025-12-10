# 部署检查清单

## 问题诊断

如果访问 `https://zhengbi-yong.github.io/pre/slidev1/#/0` 显示 404，请按以下步骤检查：

### 1. 检查 GitHub Actions 构建状态

1. 访问 GitHub 仓库的 Actions 页面
2. 查看最新的 "GitHub Pages" 工作流运行状态
3. 检查 "Build Slidev presentations" 步骤是否成功
4. 查看构建日志，确认：
   - ✅ 找到了 Slidev 项目
   - ✅ 依赖安装成功
   - ✅ 构建成功
   - ✅ 文件复制到 out 目录成功

### 2. 检查构建产物

在 GitHub Actions 日志中，应该看到：

```
📦 开始构建 Slidev 演示文稿...
找到 2 个 Slidev 项目: slidev1, slidev2

🔨 构建 slidev1...
   📥 安装依赖...
   🏗️  构建项目...
   📋 复制构建产物到 /home/runner/work/pre/pre/out/slidev1...
   ✅ 已创建 .nojekyll
   ✅ slidev1 构建完成

✨ 所有 Slidev 演示文稿构建完成！
```

### 3. 检查部署的文件

部署完成后，访问以下 URL 检查文件是否存在：

- `https://zhengbi-yong.github.io/pre/slidev1/` - 应该显示幻灯片首页
- `https://zhengbi-yong.github.io/pre/slidev1/index.html` - 应该能直接访问 index.html
- `https://zhengbi-yong.github.io/pre/slidev1/assets/` - 检查资源文件是否存在

### 4. 常见问题

#### 问题 A：构建失败

**症状**：GitHub Actions 日志显示构建失败

**可能原因**：

- Slidev 依赖安装失败
- 构建命令执行失败
- 文件路径错误

**解决**：

1. 检查 GitHub Actions 日志中的错误信息
2. 确认 `slidev/*/package.json` 中的依赖配置正确
3. 确认 `slidev/*/slides.md` 文件存在且格式正确

#### 问题 B：文件未复制到 out 目录

**症状**：构建成功，但 out 目录中没有 slidev1

**可能原因**：

- 构建产物路径不正确
- 复制操作失败

**解决**：

1. 检查构建日志中是否有 "📋 复制构建产物" 的消息
2. 确认 `slidev/slidev1/dist` 目录存在
3. 检查文件权限

#### 问题 C：GitHub Pages 仍然 404

**症状**：构建成功，文件存在，但访问仍然 404

**可能原因**：

- GitHub Pages 缓存未更新
- 部署未完成
- 文件路径不正确

**解决**：

1. 等待 5-10 分钟让 GitHub Pages 更新
2. 清除浏览器缓存
3. 检查 GitHub Pages 部署状态

### 5. 手动验证构建

如果想在本地验证构建是否正常：

```bash
# 1. 进入项目根目录
cd /path/to/zhengbi-yong.github.io

# 2. 运行构建脚本
node scripts/build-slidev.mjs

# 3. 检查构建产物
ls -la out/slidev1/

# 应该看到：
# - index.html
# - assets/
# - .nojekyll
```

### 6. 检查配置

确认以下配置正确：

1. **package.json** 中的 base path：

   ```json
   "build": "slidev build --base /pre/slidev1/"
   ```

2. **slides.md** 中的 routerMode：

   ```yaml
   routerMode: hash
   ```

3. **GitHub Actions 工作流**中的构建步骤：
   ```yaml
   - name: Build Slidev presentations
     run: node scripts/build-slidev.mjs
   ```

## 如果仍然无法解决

请提供以下信息：

1. GitHub Actions 构建日志（特别是 "Build Slidev presentations" 步骤）
2. 访问的具体 URL
3. 浏览器控制台错误信息（F12 > Console）
4. Network 标签中的请求详情

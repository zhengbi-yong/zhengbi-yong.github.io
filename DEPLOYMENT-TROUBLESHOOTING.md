# 部署问题排查指南

## 问题：博客文章点击后跳转到首页

### 可能的原因

1. **Nginx 配置不正确** - 最常见的原因
2. **静态文件未正确生成**
3. **路径编码问题**

### 排查步骤

#### 1. 检查 Nginx 配置

SSH 到服务器，检查 Nginx 配置文件：

```bash
# 查看当前 Nginx 配置
sudo cat /etc/nginx/sites-available/default
# 或
sudo cat /etc/nginx/conf.d/your-site.conf
```

确保配置包含以下关键部分：

```nginx
location / {
    try_files $uri $uri.html $uri/ /index.html;
}

location ~ ^/blog/ {
    try_files $uri $uri.html $uri/ /index.html;
}
```

**重要**：`try_files` 必须包含 `$uri.html`，这是处理 Next.js 静态导出的关键。

#### 2. 检查静态文件是否生成

在服务器上检查：

```bash
# 检查博客文章文件是否存在
ls -la /home/ubuntu/PersonalBlog/out/blog/robotics/

# 应该看到类似这样的文件：
# dexmani.html
# lerobot.html
```

如果文件不存在，说明构建时没有正确生成。

#### 3. 检查文件路径格式

在服务器上检查实际的文件路径：

```bash
# 查看博客目录结构
find /home/ubuntu/PersonalBlog/out/blog -name "*.html" | head -10
```

#### 4. 检查 Nginx 错误日志

```bash
# 实时查看错误日志
sudo tail -f /var/log/nginx/error.log

# 然后尝试访问博客文章，查看是否有错误信息
```

#### 5. 测试 Nginx 配置

```bash
# 检查配置语法
sudo nginx -t

# 如果语法正确，重新加载配置
sudo systemctl reload nginx
```

### 解决方案

#### 方案 1：更新 Nginx 配置（推荐）

使用 `nginx-config-example.conf` 文件中的完整配置，或参考 README.md 中的更新配置。

关键配置：

```nginx
location / {
    try_files $uri $uri.html $uri/ /index.html;
}

location ~ ^/blog/ {
    try_files $uri $uri.html $uri/ /index.html;
}
```

#### 方案 2：检查构建输出

在本地检查构建后的文件：

```powershell
# Windows
Get-ChildItem -Path "out/blog" -Recurse -Filter "*.html" | Select-Object FullName

# 应该看到类似：
# D:\YZB\blog\out\blog\robotics\dexmani.html
# D:\YZB\blog\out\blog\robotics\lerobot.html
```

如果文件不存在，可能是构建问题。

#### 方案 3：验证路径编码

检查 `app/blog/[...slug]/page.tsx` 中的 `generateStaticParams`：

```typescript
export const generateStaticParams = async () => {
  return allBlogs.map((p) => ({ slug: p.slug.split('/').map((name) => decodeURI(name)) }))
}
```

确保路径编码正确。

### 快速修复步骤

1. **更新 Nginx 配置**：
   ```bash
   # SSH 到服务器
   sudo nano /etc/nginx/sites-available/default
   # 或
   sudo nano /etc/nginx/conf.d/your-site.conf
   ```

2. **添加正确的 location 块**：
   ```nginx
   location / {
       try_files $uri $uri.html $uri/ /index.html;
   }
   
   location ~ ^/blog/ {
       try_files $uri $uri.html $uri/ /index.html;
   }
   ```

3. **测试并重新加载**：
   ```bash
   sudo nginx -t
   sudo systemctl reload nginx
   ```

4. **清除浏览器缓存**：
   - 使用 Ctrl+F5 强制刷新
   - 或使用无痕模式测试

### 验证修复

访问博客文章 URL，例如：
- `http://152.136.43.194/blog/robotics/dexmani`
- `http://152.136.43.194/blog/robotics/lerobot`

应该能正常显示文章内容，而不是跳转到首页。

### 其他常见问题

#### CSS 预加载警告

控制台中的 CSS 预加载警告通常不影响功能，可以忽略。如果想去掉，可以在 `next.config.js` 中禁用预加载。

#### 实验页面 URDF 加载

实验页面的 URDF 模型加载日志是正常的，表示模型正在加载。

---

如果问题仍然存在，请检查：
1. Nginx 错误日志
2. 浏览器控制台错误
3. 网络请求（F12 -> Network 标签）


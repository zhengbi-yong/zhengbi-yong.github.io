# Hash 模式路由说明

## 为什么使用 Hash 模式？

Hash 模式是 GitHub Pages 上部署 SPA 的**最标准、最可靠**的方法，不需要任何服务器配置或 404.html hack。

## URL 格式

使用 hash 模式后，访问 URL 格式为：

- 首页：`https://zhengbi-yong.github.io/pre/slidev1/` 或 `https://zhengbi-yong.github.io/pre/slidev1/#/`
- 第 0 页：`https://zhengbi-yong.github.io/pre/slidev1/#/0`
- 第 1 页：`https://zhengbi-yong.github.io/pre/slidev1/#/1`
- 第 2 页：`https://zhengbi-yong.github.io/pre/slidev1/#/2`

## 配置方法

在每个 `slides.md` 文件的 frontmatter 中添加：

```yaml
---
routerMode: hash
---
```

## 优势

1. ✅ **完全兼容 GitHub Pages**：不需要服务器配置
2. ✅ **不需要 404.html**：hash 部分不会被发送到服务器
3. ✅ **刷新页面不会 404**：hash 路由完全由客户端处理
4. ✅ **直接访问子页面正常**：可以直接访问 `#/0`、`#/1` 等

## 注意事项

- URL 中会包含 `#` 符号，这是正常的
- 这是 GitHub Pages 上最标准、最可靠的方法
- 所有现代浏览器都完全支持 hash 路由

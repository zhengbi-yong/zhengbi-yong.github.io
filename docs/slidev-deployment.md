# Slidev 部署路径配置说明（GitHub Pages）

本仓库的 Slidev 演示文稿通过脚本构建后发布到 GitHub Pages。当前希望所有幻灯片访问路径为：

```
https://zhengbi-yong.github.io/pre/<project>/
```

以 `hardware` 为例，应使用：

```
https://zhengbi-yong.github.io/pre/hardware/#/0
```

## 关键结论

1. **Slidev 必须设置 `base` 与 `download` 为 `/pre/<project>/`**（末尾必须带 `/`）。
2. **构建产物必须复制到 `out/pre/<project>/`**，并保持静态资源相对 `base` 路径可访问。
3. **GitHub Pages 是静态站点，推荐 `routerMode: hash`**，避免 404。

当前出现空白页、静态资源 404 的原因，是 `base` 仍为 `/hardware/`，页面加载后会请求：

```
https://zhengbi-yong.github.io/assets/...
```

而实际部署在 `/pre/hardware/` 下，导致资源路径不匹配。

## 仓库中的实际构建与部署流程

### 1) Slidev 项目位置

所有 Slidev 项目位于：

```
frontend/slidev/<project>/
```

以 `hardware` 为例：

```
frontend/slidev/hardware/
```

### 2) 构建脚本

构建脚本是 `scripts/build-slidev.mjs`，它会：

1. 逐个进入 `frontend/slidev/<project>`。
2. 运行 `pnpm install`、`pnpm build`。
3. 复制 `dist` 到 `out/pre/<project>/`。
4. 写入 `.nojekyll`。

关键路径：

```
dist           -> out/pre/<project>/
```

因此最终 GitHub Pages 上的实际路径应为：

```
https://zhengbi-yong.github.io/pre/<project>/
```

### 3) Slidev 路径配置位置

Slidev 的 `base` 与 `routerMode` 位于 `slides.md` 顶部 frontmatter。例如：

```
frontend/slidev/hardware/slides.md
```

正确配置应为：

```yaml
base: /pre/hardware/
download: /pre/hardware/
routerMode: hash
```

> `download` 用于导出资源下载链接，通常与 `base` 一致。

## 推荐的标准配置模板

在每个 Slidev 项目 `slides.md` 顶部使用以下模板（替换 `<project>`）：

```yaml
base: /pre/<project>/
download: /pre/<project>/
routerMode: hash
```

## 部署检查清单

1. ✅ `slides.md` 中 `base` 和 `download` 已改为 `/pre/<project>/`。
2. ✅ `routerMode` 设为 `hash`（GitHub Pages 无服务器路由）。
3. ✅ `pnpm build` 生成 `dist`。
4. ✅ `scripts/build-slidev.mjs` 复制到 `out/pre/<project>/`。
5. ✅ GitHub Pages 指向 `out/` 目录（或默认输出目录）。

## 常见问题排查

### 1) 页面白屏，控制台资源 404

通常是 `base` 不一致导致。资源请求路径会变成：

```
https://zhengbi-yong.github.io/assets/...
```

而你真正部署在 `/pre/<project>/` 下，应确保 `base` 为 `/pre/<project>/`。

### 2) 访问 `/pre/<project>/` 404

检查：

- `out/pre/<project>/index.html` 是否存在。
- GitHub Pages 是否发布 `out/` 根目录。
- GitHub Pages 是否启用了正确分支/目录。

### 3) 不想用 hash 路由

GitHub Pages 无服务器重写，非 hash 模式需要：

- 生成并部署 `404.html` 路由回退。
- 或在 CDN/反向代理设置 fallback。

对本仓库而言，**继续使用 `routerMode: hash` 最简单**。

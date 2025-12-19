#!/usr/bin/env node

/**
 * 构建所有 Slidev 演示文稿
 * 将构建产物复制到 out 目录的相应子目录中
 */

import { execSync } from 'child_process'
import { existsSync, mkdirSync, cpSync } from 'fs'
import { join } from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

// eslint-disable-next-line no-redeclare
const __filename = fileURLToPath(import.meta.url)
// eslint-disable-next-line no-redeclare
const __dirname = dirname(__filename)
const rootDir = join(__dirname, '..')
const slidevDir = join(rootDir, 'slidev')
const outDir = join(rootDir, 'out')

// 获取仓库名称（从环境变量或 GitHub Actions 上下文）
const repoFullName = process.env.GITHUB_REPOSITORY || 'zhengbi-yong/zhengbi-yong.github.io'
const [owner, repo] = repoFullName.split('/')
// 检测是否是 username.github.io 格式的仓库
const isUserSite = repo.endsWith('.github.io') && repo === `${owner}.github.io`
// 根据仓库类型确定部署路径
const deployPath = isUserSite ? '' : `/${repo}`
console.log(`🏠 部署模式: ${isUserSite ? '根路径部署' : '子路径部署'}`)
console.log(`📂 部署路径: ${deployPath || '/'}`)

console.log(`📦 开始构建 Slidev 演示文稿...`)
console.log(`📁 仓库名称: ${repo}`)
console.log(`📂 Slidev 目录: ${slidevDir}`)
console.log(`📂 输出目录: ${outDir}\n`)

// 检查目录是否存在
if (!existsSync(slidevDir)) {
  console.log(`⚠️ 警告: Slidev 目录不存在: ${slidevDir}`)
  console.log(`📦 跳过 Slidev 构建（这是可选功能）`)
  process.exit(0)
}

// 确保输出目录存在
if (!existsSync(outDir)) {
  console.log(`📁 创建输出目录: ${outDir}`)
  mkdirSync(outDir, { recursive: true })
}

// 查找所有 Slidev 项目目录
const fs = await import('fs/promises')
const entries = await fs.readdir(slidevDir, { withFileTypes: true })
const slidevProjects = entries
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .filter((name) => !name.startsWith('.'))

if (slidevProjects.length === 0) {
  console.error(`❌ 错误: 在 ${slidevDir} 中未找到 Slidev 项目`)
  process.exit(1)
}

console.log(`找到 ${slidevProjects.length} 个 Slidev 项目: ${slidevProjects.join(', ')}\n`)

// 构建每个 Slidev 项目
for (const projectName of slidevProjects) {
  const projectDir = join(slidevDir, projectName)
  const packageJsonPath = join(projectDir, 'package.json')

  if (!existsSync(packageJsonPath)) {
    console.log(`⚠️  跳过 ${projectName}: 未找到 package.json`)
    continue
  }

  console.log(`🔨 构建 ${projectName}...`)

  try {
    // 安装依赖
    console.log(`   📥 安装依赖...`)
    execSync('pnpm install --frozen-lockfile', {
      cwd: projectDir,
      stdio: 'inherit',
    })

    // 构建项目
    console.log(`   🏗️  构建项目...`)
    execSync('pnpm build', {
      cwd: projectDir,
      stdio: 'inherit',
    })

    // 复制构建产物到输出目录
    const distDir = join(projectDir, 'dist')
    // 根据部署模式确定目标目录
    const targetDir = join(outDir, deployPath.replace(/^\//, ''), projectName)

    // 确保父目录存在
    const parentDir = dirname(targetDir)
    if (!existsSync(parentDir)) {
      mkdirSync(parentDir, { recursive: true })
    }

    if (existsSync(distDir)) {
      console.log(`   📋 复制构建产物到 ${targetDir}...`)
      if (existsSync(targetDir)) {
        // 删除旧文件
        const { rmSync } = await import('fs')
        rmSync(targetDir, { recursive: true, force: true })
      }
      cpSync(distDir, targetDir, { recursive: true })

      // 复制 images 目录（如果存在）
      const imagesDir = join(projectDir, 'images')
      const targetImagesDir = join(targetDir, 'images')
      if (existsSync(imagesDir)) {
        cpSync(imagesDir, targetImagesDir, { recursive: true })
        console.log(`   ✅ 已复制图片目录`)
      }

      // 创建 .nojekyll 确保 GitHub Pages 正确处理所有文件
      const { writeFileSync, readFileSync } = await import('fs')
      const noJekyllPath = join(targetDir, '.nojekyll')
      writeFileSync(noJekyllPath, '', 'utf-8')
      console.log(`   ✅ 已创建 .nojekyll`)

      // 修复 HTML 文件中的资源路径
      const indexPath = join(targetDir, 'index.html')
      if (existsSync(indexPath)) {
        let indexContent = readFileSync(indexPath, 'utf-8')
        // 将绝对路径改为相对路径，适配 GitHub Pages 子路径
        indexContent = indexContent
          .replace(/src="\/assets\//g, 'src="./assets/')
          .replace(/href="\/assets\//g, 'href="./assets/')
          .replace(/from "\/assets\//g, 'from "./assets/')
          .replace(/import "\/assets\//g, 'import "./assets/')
          .replace(/>\s*<script/g, '>\n  <script')
          .replace(/<\/script>\s*<link/g, '</script>\n  <link')

      // 修复 JS 和 CSS 文件中的资源路径（更全面）
      const assetsDir = join(targetDir, 'assets')
      if (existsSync(assetsDir)) {
        const { readdirSync, statSync } = await import('fs')
        const { join, dirname } = await import('path')

        // 递归处理所有子目录中的 JS 和 CSS 文件
        const processDir = (dir, basePath = '') => {
          const files = readdirSync(dir)
          for (const file of files) {
            const filePath = join(dir, file)
            const relativePath = join(basePath, file)
            const stat = statSync(filePath)

            if (stat.isDirectory()) {
              processDir(filePath, relativePath)
            } else if (file.endsWith('.js') || file.endsWith('.css')) {
              let content = readFileSync(filePath, 'utf-8')

              // 计算当前文件到 assets 根目录的相对路径深度
              const depth = (relativePath.split('/').length - 1)
              const prefix = depth > 0 ? '../'.repeat(depth) : ''

              // 修复所有可能的资源路径引用
              content = content
                // 修复绝对路径
                .replace(/"\/assets\//g, `"${prefix}assets/`)
                .replace(/'\/assets\//g, `'${prefix}assets/`)
                .replace(/from "\/assets\//g, `from "${prefix}assets/`)
                .replace(/import "\/assets\//g, `import "${prefix}assets/`)
                .replace(/url\("\/assets\//g, `url("${prefix}assets/`)
                .replace(/url\('\/assets\//g, `url('${prefix}assets/`)
                // 修复已存在的相对路径
                .replace(/from "\.\/assets\//g, `from "${prefix}assets/`)
                .replace(/import "\.\/assets\//g, `import "${prefix}assets/`)
                // 修复模块预加载路径
                .replace(/(modulepreload|preload)\s*:\s*["']\/assets\//g, `$1: "${prefix}assets/`)
                // 修复Vite的依赖映射表中的路径
                .replace(/"assets\//g, `"${prefix}assets/`)
                .replace(/'assets\//g, `'${prefix}assets/`)

              writeFileSync(filePath, content, 'utf-8')
            }
          }
        }

        processDir(assetsDir)
        console.log(`   ✅ 已修复所有 JS/CSS 资源路径`)
      }

        // 在 body 结束前添加初始化脚本
        if (!indexContent.includes('window.SLIDEV')) {
          indexContent = indexContent.replace(
            '</body>',
            `  <script>
    console.log("Slidev page loaded");
    console.log("Current URL:", window.location.href);
    console.log("Current path:", window.location.pathname);

    // 根据部署模式检查路径
    const expectedPath = "${deployPath}/hardware/";
    if (!window.location.pathname.includes(expectedPath)) {
      console.log("Redirecting to correct path...");
      window.location.href = "${deployPath}/hardware/#/0";
    } else {
      // 等待 Slidev 应用初始化
      setTimeout(() => {
        if (!window.location.hash || window.location.hash === "#/") {
          console.log("Redirecting to first slide");
          window.location.hash = "#/0";
        }
      }, 100);
    }
  </script>
</body>`
          )
        }
        writeFileSync(indexPath, indexContent, 'utf-8')
        console.log(`   ✅ 已修复 HTML 资源路径`)
      }

      // 修复 JS 和 CSS 文件中的资源路径
      const assetsDir = join(targetDir, 'assets')
      if (existsSync(assetsDir)) {
        const { readdirSync } = await import('fs')
        const assetFiles = readdirSync(assetsDir)

        for (const file of assetFiles) {
          const filePath = join(assetsDir, file)
          if (file.endsWith('.js') || file.endsWith('.css')) {
            let content = readFileSync(filePath, 'utf-8')
            // 修复图片路径引用
            content = content
              .replace(/"\/images\//g, '"./images/')
              .replace(/'\/images\//g, "'./images/")
              .replace(/from "\/images\//g, 'from "./images/')
              .replace(/import "\/images\//g, 'import "./images/')
              .replace(/url\("\/images\//g, 'url("./images/')
              .replace(/url\('\/images\//g, "url('./images/")
              .replace(/"images\//g, '"./images/')
              .replace(/'images\//g, "'./images/")
            writeFileSync(filePath, content, 'utf-8')
          }
        }
        console.log(`   ✅ 已修复 JS/CSS 资源路径`)
      }

      // 修复 _redirects 文件以适配部署路径
      const redirectsPath = join(targetDir, '_redirects')
      if (existsSync(redirectsPath)) {
        let redirectsContent = readFileSync(redirectsPath, 'utf-8')
        // 更新重定向路径为正确的路径
        const redirectTarget = `${deployPath}/${projectName}/index.html`
        redirectsContent = redirectsContent.replace(
          /\/\*.*\/index\.html/g,
          `/*    ${redirectTarget}   200`
        )
        writeFileSync(redirectsPath, redirectsContent, 'utf-8')
        console.log(`   ✅ 已修复重定向路径`)
      }

      // 注意：使用 hash 模式路由（routerMode: hash），不需要 404.html
      // URL 格式：https://zhengbi-yong.github.io/pre/slidev1/#/0

      console.log(`   ✅ ${projectName} 构建完成\n`)
    } else {
      console.log(`   ⚠️  警告: ${distDir} 不存在，跳过复制\n`)
    }
  } catch (error) {
    console.error(`   ❌ ${projectName} 构建失败:`, error.message)
    process.exit(1)
  }
}

console.log(`✨ 所有 Slidev 演示文稿构建完成！`)
console.log(`📂 构建产物位于: ${outDir}`)

#!/usr/bin/env node

/**
 * 构建所有 Slidev 演示文稿
 * 将构建产物复制到 out 目录的相应子目录中
 */

import { execSync } from 'child_process';
import { existsSync, mkdirSync, cpSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');
const slidevDir = join(rootDir, 'slidev');
const outDir = join(rootDir, 'out');

// 获取仓库名称（从环境变量或 GitHub Actions 上下文）
// 注意：这个变量主要用于日志，实际的 base path 在各自的 package.json 中配置
const repoName = process.env.GITHUB_REPOSITORY 
  ? process.env.GITHUB_REPOSITORY.split('/')[1] 
  : 'pre'; // 默认值，可以根据实际情况修改

console.log(`📦 开始构建 Slidev 演示文稿...`);
console.log(`📁 仓库名称: ${repoName}`);
console.log(`📂 Slidev 目录: ${slidevDir}`);
console.log(`📂 输出目录: ${outDir}\n`);

// 检查目录是否存在
if (!existsSync(slidevDir)) {
  console.error(`❌ 错误: Slidev 目录不存在: ${slidevDir}`);
  process.exit(1);
}

// 确保输出目录存在
if (!existsSync(outDir)) {
  console.log(`📁 创建输出目录: ${outDir}`);
  mkdirSync(outDir, { recursive: true });
}

// 查找所有 Slidev 项目目录
const fs = await import('fs/promises');
const entries = await fs.readdir(slidevDir, { withFileTypes: true });
const slidevProjects = entries
  .filter(entry => entry.isDirectory())
  .map(entry => entry.name)
  .filter(name => !name.startsWith('.'));

if (slidevProjects.length === 0) {
  console.error(`❌ 错误: 在 ${slidevDir} 中未找到 Slidev 项目`);
  process.exit(1);
}

console.log(`找到 ${slidevProjects.length} 个 Slidev 项目: ${slidevProjects.join(', ')}\n`);

// 构建每个 Slidev 项目
for (const projectName of slidevProjects) {
  const projectDir = join(slidevDir, projectName);
  const packageJsonPath = join(projectDir, 'package.json');
  
  if (!existsSync(packageJsonPath)) {
    console.log(`⚠️  跳过 ${projectName}: 未找到 package.json`);
    continue;
  }

  console.log(`🔨 构建 ${projectName}...`);
  
  try {
    // 安装依赖
    console.log(`   📥 安装依赖...`);
    execSync('pnpm install --frozen-lockfile', {
      cwd: projectDir,
      stdio: 'inherit',
    });

    // 构建项目
    console.log(`   🏗️  构建项目...`);
    execSync('pnpm build', {
      cwd: projectDir,
      stdio: 'inherit',
    });

    // 复制构建产物到 out/pre 目录
    const distDir = join(projectDir, 'dist');
    const preDir = join(outDir, 'pre');
    const targetDir = join(preDir, projectName);
    
    // 确保 pre 目录存在
    if (!existsSync(preDir)) {
      mkdirSync(preDir, { recursive: true });
    }
    
    if (existsSync(distDir)) {
      console.log(`   📋 复制构建产物到 ${targetDir}...`);
      if (existsSync(targetDir)) {
        // 删除旧文件
        const { rmSync } = await import('fs');
        rmSync(targetDir, { recursive: true, force: true });
      }
      cpSync(distDir, targetDir, { recursive: true });
      
      // 创建 .nojekyll 确保 GitHub Pages 正确处理所有文件
      const { writeFileSync } = await import('fs');
      const noJekyllPath = join(targetDir, '.nojekyll');
      writeFileSync(noJekyllPath, '', 'utf-8');
      console.log(`   ✅ 已创建 .nojekyll`);
      
      // 注意：使用 hash 模式路由（routerMode: hash），不需要 404.html
      // URL 格式：https://zhengbi-yong.github.io/pre/slidev1/#/0
      
      console.log(`   ✅ ${projectName} 构建完成\n`);
    } else {
      console.log(`   ⚠️  警告: ${distDir} 不存在，跳过复制\n`);
    }
  } catch (error) {
    console.error(`   ❌ ${projectName} 构建失败:`, error.message);
    process.exit(1);
  }
}

console.log(`✨ 所有 Slidev 演示文稿构建完成！`);
console.log(`📂 构建产物位于: ${outDir}`);

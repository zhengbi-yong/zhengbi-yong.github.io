import rss from './rss.mjs'
import { copyFileSync, mkdirSync, readdirSync, statSync, existsSync } from 'fs'
import { execSync } from 'child_process'
import { join } from 'path'

// 递归复制目录
function copyDir(src, dest) {
  if (!existsSync(src)) {
    console.log(`源目录不存在: ${src}`)
    return
  }

  if (!existsSync(dest)) {
    mkdirSync(dest, { recursive: true })
  }

  const entries = readdirSync(src, { withFileTypes: true })

  for (const entry of entries) {
    const srcPath = join(src, entry.name)
    const destPath = join(dest, entry.name)

    if (entry.isDirectory()) {
      copyDir(srcPath, destPath)
    } else {
      copyFileSync(srcPath, destPath)
    }
  }
}

async function postbuild() {
  await rss()

  // 确保 musicxml 目录被复制到 out 目录
  const publicMusicXml = join(process.cwd(), 'public', 'musicxml')
  const outMusicXml = join(process.cwd(), 'out', 'musicxml')

  if (existsSync(publicMusicXml)) {
    console.log('复制 musicxml 目录到 out 目录...')
    copyDir(publicMusicXml, outMusicXml)
    console.log('✓ musicxml 目录复制完成')
  } else {
    console.log('⚠ public/musicxml 目录不存在，跳过复制')
  }

  // 构建 Slidev 演示文稿
  const buildSlidevScript = join(process.cwd(), 'scripts', 'build-slidev.mjs')
  if (existsSync(buildSlidevScript)) {
    console.log('\n📦 构建 Slidev 演示文稿...')
    try {
      execSync(`node ${buildSlidevScript}`, { stdio: 'inherit', cwd: process.cwd() })
      console.log('✓ Slidev 演示文稿构建完成')
    } catch (error) {
      console.error('⚠ Slidev 构建失败，但继续执行:', error.message)
      // 不退出，因为主站构建已经成功
    }
  }
}

postbuild()

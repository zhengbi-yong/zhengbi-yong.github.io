#!/usr/bin/env node

/**
 * 下载化学可视化库到本地
 * 包括：KaTeX, mhchem, 3Dmol.js, RDKit
 */

const https = require('https')
const http = require('http')
const fs = require('fs')
const path = require('path')

const BASE_DIR = path.join(__dirname, '..', 'frontend', 'public', 'chemistry')

// 下载文件函数
function downloadFile(url, destPath) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http

    console.log(`Downloading: ${url}`)
    console.log(`To: ${destPath}`)

    const file = fs.createWriteStream(destPath)

    protocol.get(url, (response) => {
      if (response.statusCode === 301 || response.statusCode === 302) {
        // 处理重定向
        file.close()
        fs.unlinkSync(destPath)
        return downloadFile(response.headers.location, destPath)
          .then(resolve)
          .catch(reject)
      }

      if (response.statusCode !== 200) {
        file.close()
        fs.unlinkSync(destPath)
        return reject(new Error(`Failed to download: ${response.statusCode}`))
      }

      response.pipe(file)

      file.on('finish', () => {
        file.close()
        console.log(`✓ Downloaded: ${path.basename(destPath)}`)
        resolve()
      })
    }).on('error', (err) => {
      file.close()
      fs.unlinkSync(destPath)
      reject(err)
    })
  })
}

// 主下载函数
async function downloadAll() {
  console.log('开始下载化学可视化库...\n')

  const downloads = []

  // KaTeX 核心文件
  const katexVersion = '0.16.25'
  const katexBaseUrl = `https://cdn.jsdelivr.net/npm/katex@${katexVersion}/dist`

  const katexFiles = [
    'katex.min.js',
    'katex.min.css',
    'fonts/KaTeX_Math-Italic.woff2',
    'fonts/KaTeX_Math-BoldItalic.woff2',
    'fonts/KaTeX_Main-Regular.woff2',
    'fonts/KaTeX_Main-Bold.woff2',
    'fonts/KaTeX_Main-Italic.woff2',
    'fonts/KaTeX_Main-BoldItalic.woff2',
    'fonts/KaTeX_Font-Regular.woff2',
    'fonts/KaTeX_Font-Bold.woff2',
    'fonts/KaTeX_AMS-Regular.woff2',
    'fonts/KaTeX_Caligraphic-Regular.woff2',
    'fonts/KaTeX_Caligraphic-Bold.woff2',
    'fonts/KaTeX_Fraktur-Regular.woff2',
    'fonts/KaTeX_Fraktur-Bold.woff2',
    'fonts/KaTeX_SansSerif-Regular.woff2',
    'fonts/KaTeX_SansSerif-Bold.woff2',
    'fonts/KaTeX_SansSerif-Italic.woff2',
    'fonts/KaTeX_Script-Regular.woff2',
    'fonts/KaTeX_Typewriter-Regular.woff2',
    'fonts/KaTeX_Size1-Regular.woff2',
    'fonts/KaTeX_Size2-Regular.woff2',
    'fonts/KaTeX_Size3-Regular.woff2',
    'fonts/KaTeX_Size4-Regular.woff2',
  ]

  // KaTeX mhchem 扩展
  const mhchemFiles = [
    `contrib/mhchem.min.js`,
  ]

  // 创建KaTeX目录
  const katexDir = path.join(BASE_DIR, 'katex')
  fs.mkdirSync(katexDir, { recursive: true })
  fs.mkdirSync(path.join(katexDir, 'fonts'), { recursive: true })
  fs.mkdirSync(path.join(katexDir, 'contrib'), { recursive: true })

  // 添加KaTeX下载任务
  katexFiles.forEach(file => {
    const url = `${katexBaseUrl}/${file}`
    const destPath = path.join(katexDir, file)
    downloads.push(downloadFile(url, destPath))
  })

  mhchemFiles.forEach(file => {
    const url = `${katexBaseUrl}/${file}`
    const destPath = path.join(katexDir, file)
    downloads.push(downloadFile(url, destPath))
  })

  // 3Dmol.js
  const threeDmolVersion = '2.5.3'
  const threeDmolUrl = `https://unpkg.com/3dmol@${threeDmolVersion}/build/3Dmol-min.js`
  const threeDmolDir = path.join(BASE_DIR, '3dmol')
  fs.mkdirSync(threeDmolDir, { recursive: true })
  downloads.push(downloadFile(threeDmolUrl, path.join(threeDmolDir, '3Dmol-min.js')))

  // RDKit (从官方CDN下载)
  const rdkitDir = path.join(BASE_DIR, 'rdkit')
  fs.mkdirSync(rdkitDir, { recursive: true })

  // RDKit最小版本
  const rdkitUrl = 'https://rdkit.org/RDKit_minimal.js'
  downloads.push(downloadFile(rdkitUrl, path.join(rdkitDir, 'RDKit_minimal.js')))

  // 尝试下载RDKit WASM文件（通常会在同一目录）
  const rdkitWasmUrl = 'https://rdkit.org/RDKit_minimal.wasm'
  downloads.push(downloadFile(rdkitWasmUrl, path.join(rdkitDir, 'RDKit_minimal.wasm')).catch(err => {
    console.log(`Warning: Could not download RDKit WASM file (may be included in JS): ${err.message}`)
  }))

  // RDKit data文件
  const rdkitDataUrl = 'https://rdkit.org/RDKit_minimal.data'
  downloads.push(downloadFile(rdkitDataUrl, path.join(rdkitDir, 'RDKit_minimal.data')).catch(err => {
    console.log(`Warning: Could not download RDKit data file: ${err.message}`)
  }))

  // 执行所有下载
  try {
    await Promise.all(downloads)
    console.log('\n✓ 所有文件下载完成！')
  } catch (error) {
    console.error('\n✗ 下载过程中出现错误:', error.message)
    process.exit(1)
  }
}

// 运行下载
downloadAll()

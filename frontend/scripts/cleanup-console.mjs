import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs'
import { join, relative, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const ROOT_DIR = join(__dirname, '..')
const CONSOLE_PATTERNS = [
  /console\.log\(/g,
  /console\.warn\(/g,
  /console\.error\(/g,
  /console\.debug\(/g,
  /console\.info\(/g,
]

const EXCLUDED_DIRS = [
  'node_modules',
  '.next',
  'out',
  'dist',
  '.storybook',
  'coverage',
]

const EXCLUDED_FILES = [
  'lib/logger.ts',
  'lib/utils/logger.ts',
  'scripts/cleanup-console.mjs',
]

function shouldExclude(filePath) {
  const relativePath = relative(ROOT_DIR, filePath)

  // 检查排除目录
  const parts = relativePath.split(/[/\\]/)
  if (parts.some(part => EXCLUDED_DIRS.includes(part))) {
    return true
  }

  // 检查排除文件
  if (EXCLUDED_FILES.some(excluded => relativePath.includes(excluded))) {
    return true
  }

  return false
}

function findConsoleStatements(dir) {
  let results = []

  try {
    const files = readdirSync(dir, { withFileTypes: true })

    for (const file of files) {
      const fullPath = join(dir, file.name)

      if (file.isDirectory()) {
        if (!shouldExclude(fullPath)) {
          results = results.concat(findConsoleStatements(fullPath))
        }
      } else if (file.isFile() && /\.(ts|tsx|js|jsx)$/.test(file.name)) {
        const content = readFileSync(fullPath, 'utf-8')
        const relativePath = relative(ROOT_DIR, fullPath)

        let fileMatches = []
        CONSOLE_PATTERNS.forEach(pattern => {
          let match
          // 重置正则表达式的 lastIndex
          pattern.lastIndex = 0

          while ((match = pattern.exec(content)) !== null) {
            const lines = content.substring(0, match.index).split('\n')
            fileMatches.push({
              line: lines.length,
              column: lines[lines.length - 1].length + 1,
              pattern: pattern.source,
              charIndex: match.index,
            })
          }
        })

        if (fileMatches.length > 0) {
          results.push({
            file: relativePath,
            fullPath,
            matches: fileMatches,
          })
        }
      }
    }
  } catch (error) {
    console.error(`Error processing directory ${dir}:`, error.message)
  }

  return results
}

function removeConsoleStatements(content) {
  let cleaned = content
  let removedCount = 0
  const removals = []

  CONSOLE_PATTERNS.forEach(pattern => {
    let match
    pattern.lastIndex = 0

    // 匹配单行注释的 console
    const commentedPattern = new RegExp(`//.*${pattern.source.replace(/\\/g, '\\\\')}[^)]*\\);?\\n?`, 'g')
    let commentedMatch
    while ((commentedMatch = commentedPattern.exec(content)) !== null) {
      removals.push({
        start: commentedMatch.index,
        end: commentedMatch.index + commentedMatch[0].length,
        text: commentedMatch[0],
      })
    }

    // 匹配实际的 console 调用（包括多行）
    const consolePattern = new RegExp(`${pattern.source}[^)]*\\);?\\n?`, 'g')
    while ((match = consolePattern.exec(content)) !== null) {
      // 检查是否已经在 removals 中（避免重复删除）
      const alreadyRemoved = removals.some(
        r => match.index >= r.start && match.index < r.end
      )
      if (!alreadyRemoved) {
        removals.push({
          start: match.index,
          end: match.index + match[0].length,
          text: match[0],
        })
      }
    }
  })

  // 从后往前删除，避免索引偏移
  removals.sort((a, b) => b.start - a.start)

  for (const removal of removals) {
    cleaned = cleaned.substring(0, removal.start) + cleaned.substring(removal.end)
    removedCount++
  }

  return { cleaned, removedCount }
}

// 主函数
const results = findConsoleStatements(join(__dirname, '..', 'app'))

console.log('\n🔍 Console 语句分析结果:\n')
console.log(`找到 ${results.length} 个文件包含 console 语句:\n`)

// 按文件统计排序
results.sort((a, b) => b.matches.length - a.matches.length)

results.forEach(({ file, matches }) => {
  console.log(`📄 ${file}`)
  console.log(`   ${matches.length} 个调用:`)

  // 显示前5个
  matches.slice(0, 5).forEach(({ line, column, pattern }) => {
    console.log(`   - 第 ${line} 行, ${column} 列: ${pattern}`)
  })

  if (matches.length > 5) {
    console.log(`   ... 还有 ${matches.length - 5} 个`)
  }
  console.log()
})

// 统计信息
const totalMatches = results.reduce((sum, { matches }) => sum + matches.length, 0)
console.log(`\n📊 统计:`)
console.log(`   总计 ${results.length} 个文件`)
console.log(`   总计 ${totalMatches} 个 console 调用`)

// 自动清理模式
if (process.env.AUTO_FIX === 'true') {
  console.log('\n🔧 自动清理模式...')
  let totalRemoved = 0
  let processedFiles = 0

  results.forEach(({ file, fullPath, matches }) => {
    if (matches.length === 0) return

    try {
      const content = readFileSync(fullPath, 'utf-8')
      const { cleaned, removedCount } = removeConsoleStatements(content)

      if (removedCount > 0) {
        writeFileSync(fullPath, cleaned, 'utf-8')
        console.log(`✓ ${file}: 移除 ${removedCount} 个 console 调用`)
        totalRemoved += removedCount
        processedFiles++
      }
    } catch (error) {
      console.error(`✗ ${file}: 清理失败 - ${error.message}`)
    }
  })

  console.log(`\n✅ 清理完成！`)
  console.log(`   处理文件: ${processedFiles}`)
  console.log(`   总计移除: ${totalRemoved} 个 console 调用`)
} else {
  console.log('\n💡 提示: 设置 AUTO_FIX=true 环境变量可自动清理')
  console.log('   例如: AUTO_FIX=true node scripts/cleanup-console.mjs')
}

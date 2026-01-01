import { readFileSync, writeFileSync } from 'fs'
import { glob } from 'glob'

const files = [
  'components/Excalidraw/ExcalidrawViewer.tsx',
  'components/experiments/MusicSheetLab.tsx',
  'lib/utils/post-cache-client.ts',
  'lib/error-handler.ts',
  'lib/sw-register.ts',
  'components/hooks/useChemistryLocal.ts',
  'components/ShaderBackground.tsx',
  'components/MusicSheet.tsx',
  'components/FullscreenMusicSheet.tsx',
]

let totalReplaced = 0

files.forEach(file => {
  try {
    let content = readFileSync(file, 'utf-8')
    const original = content
    
    // Replace console calls with logger calls
    content = content.replace(/console\.log\(/g, 'logger.log(')
    content = content.replace(/console\.error\(/g, 'logger.error(')
    content = content.replace(/console\.warn\(/g, 'logger.warn(')
    content = content.replace(/console\.debug\(/g, 'logger.debug(')
    content = content.replace(/console\.info\(/g, 'logger.info(')
    content = content.replace(/console\.group\(/g, 'logger.group(')
    content = content.replace(/console\.groupEnd\(/g, 'logger.groupEnd(')
    
    // Only add import if console calls were replaced
    if (content !== original) {
      // Check if logger import already exists
      if (!content.includes("from '@/lib/utils/logger'")) {
        // Find the last import line
        const importMatch = content.match(/^import .+$/m)
        if (importMatch) {
          const lastImport = [...content.matchAll(/^import .+$/gm)].pop()
          if (lastImport) {
            const insertPosition = lastImport.index + lastImport[0].length
            content = content.slice(0, insertPosition) + 
              "\nimport { logger } from '@/lib/utils/logger'" +
              content.slice(insertPosition)
          }
        }
      }
      
      writeFileSync(file, content)
      const replaced = (original.match(/console\./g) || []).length
      totalReplaced += replaced
      console.log(`✓ ${file}: ${replaced} replacements`)
    }
  } catch (error) {
    console.error(`✗ ${file}: ${error.message}`)
  }
})

console.log(`\nTotal: ${totalReplaced} console calls replaced`)

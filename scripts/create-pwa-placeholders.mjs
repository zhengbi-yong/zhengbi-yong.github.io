import { writeFileSync } from 'fs'
import { join } from 'path'

// 创建 PWA 截图占位符的 SVG
const createPlaceholderSVG = (width, height, label) => `
<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="#f3f4f6"/>
  <rect width="100%" height="100%" fill="url(#gradient)"/>
  <text x="50%" y="50%" text-anchor="middle" dominant-baseline="middle"
        font-family="system-ui, sans-serif" font-size="24" fill="#6b7280">
    ${label}
  </text>
  <defs>
    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#e5e7eb;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#f9fafb;stop-opacity:1" />
    </linearGradient>
  </defs>
</svg>
`

// 创建截图文件
const createScreenshot = (filename, width, height, label) => {
  const svg = createPlaceholderSVG(width, height, label)
  const base64 = Buffer.from(svg).toString('base64')
  const dataUri = `data:image/svg+xml;base64,${base64}`

  // 创建一个简单的 HTML 文件来转换 SVG 为 PNG
  const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { margin: 0; padding: 0; }
  </style>
</head>
<body>
  <img src="${dataUri}" />
  <script>
    // 在浏览器中运行以下代码来生成 PNG
    // const img = document.querySelector('img');
    // const canvas = document.createElement('canvas');
    // canvas.width = ${width};
    // canvas.height = ${height};
    // const ctx = canvas.getContext('2d');
    // img.onload = () => {
    //   ctx.drawImage(img, 0, 0);
    //   const link = document.createElement('a');
    //   link.download = '${filename}';
    //   link.href = canvas.toDataURL('image/png');
    //   link.click();
    // };
  </script>
</body>
</html>
  `

  // 暂时保存为 SVG 文件
  const svgPath = join(process.cwd(), 'public', 'static', 'images', filename.replace('.png', '.svg'))
  writeFileSync(svgPath, svg)
  console.log(`Created placeholder: ${svgPath}`)
}

async function createPlaceholders() {
  console.log('Creating PWA placeholder images...')

  createScreenshot('pwa-screenshot-desktop.png', 1280, 720, 'Blog - Desktop View')
  createScreenshot('pwa-screenshot-mobile.png', 390, 844, 'Blog - Mobile View')

  console.log('✓ PWA placeholders created')
  console.log('\nNote: These are SVG placeholders. To convert to PNG:')
  console.log('1. Open the SVG files in a browser')
  console.log('2. Use the developer console or a screenshot tool to save as PNG')
}

createPlaceholders()
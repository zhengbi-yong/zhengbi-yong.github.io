// 在浏览器控制台中运行的 RDKit 调试脚本
// 在开发者工具控制台中运行此代码

async function debugRDKitMOL() {
  console.log('=== RDKit MOL Parsing Debug ===')

  // 检查 RDKit 是否加载
  if (!window.RDKit && !window.initRDKitModule) {
    console.error('❌ RDKit not loaded. Please wait for it to load first.')
    return
  }

  // 测试数据
  const testCases = [
    {
      name: 'Simplest SMILES',
      data: 'C',
    },
    {
      name: 'Simple MOL - Ethanol',
      data: `
CCO
`,
    },
    {
      name: 'Standard MOL Format',
      data: `
  3  2  0  0  0  0            999 V2000
    0.0000    0.0000    0.0000 C   0  0  0  0  0  0  0  0  0  0  0
    1.5400    0.0000    0.0000 C   0  0  0   0  0  0  0  0  0 0
    0.7700    0.0000    0.0000 O   0  0  0  0  0 0  0  0 0 0
  1 2  1  0  0  0 0
  2 3 1 0  0  0  0
M  END
      `.trim(),
    },
    {
      name: 'Blog Caffeine MOL',
      data: `ChemDraw07252312422D

  5  4  0  0  0  0            999 V2000
    1.1472   -0.1171    0.0000 C   0  0  0  0  0  0  0  0  0  0  0
    1.1472    0.8829    0.0000 N   0  0  0   0  0   0  0  0  0  0
    2.3144    1.7081    0.0000 C   0  0   0  0  0  0  0  0  0  0  0
    3.4616    0.9961    0.0000 N   0  0  0  0  0  0  0  0  0  0  0
    4.6088    1.5881    0.0000 O   0  0  0  0  0  0  0  0 0  0  0
  1  2  1  0  0  0  0
  2  3  1  0  0  0  0
  3  4  1  0  0  0  0
M  END`,
    },
    {
      name: 'Cleaned Blog Caffeine',
      data: `

  5  4  0  0  0  0            999 V2000
    1.1472   -0.1171    0.0000 C   0  0  0  0  0  0  0  0  0  0  0
    1.1472    0.8829    0.0000 N   0  0  0  0  0  0  0  0  0  0  0
    2.3144    1.7081    0.0000 C   0  0  0  0  0  0  0  0 0  0  0
    3.4616    0.9961    0.0000 N   0  0  0  0  0  0  0 0  0 0 0
    4.6088    1.5881    0.0000 O   0  0  0 0  0  0 0 0 0 0 0 0
  1  2  1  0  0  0 0
  2 3  1  0  0  0 0
    3  4  1  0  0  0 0
M  END`,
    },
  ]

  for (const test of testCases) {
    console.log(`\n🧪 Testing: ${test.name}`)
    console.log(`Data type: ${typeof test.data}`)
    console.log(`Data length: ${test.data.length}`)
    console.log(`First 50 chars: "${test.data.substring(0, 50)}"`)

    // 检查特殊字符
    const hasNonASCII = [...test.data].some((char) => char.charCodeAt(0) > 127)
    if (hasNonASCII) {
      console.log('⚠️ Contains non-ASCII characters')
    }

    try {
      let RDKit = window.RDKit
      if (!RDKit && window.initRDKitModule) {
        console.log('⏳ Waiting for RDKit to initialize...')
        RDKit = await window.initRDKitModule()
        console.log('✅ RDKit initialized')
      }

      console.log('Calling RDKit.get_mol...')
      const mol = RDKit.get_mol(test.data)
      console.log(`Result: ${mol ? '✅ Success' : '❌ Failed'}`)

      if (mol) {
        console.log('Molecule details:')
        console.log(
          '- get_smiles():',
          mol.get_smiles ? mol.get_smiles().substring(0, 50) + '...' : 'null'
        )
        console.log(
          '- get_molblock():',
          mol.get_molblock ? mol.get_molblock().substring(0, 50) + '...' : 'null'
        )

        console.log('Calling get_svg()...')
        const svg = mol.get_svg()
        console.log(`SVG result: ${svg ? '✅ Success (length=' + svg.length + ')' : '❌ Failed'}`)

        mol.delete()
      }
    } catch (error) {
      console.error('❌ Error:', error)
      console.error('Stack:', error.stack)
    }
  }

  console.log('\n=== Debug Complete ===')
}

// 自动运行
if (typeof window !== 'undefined') {
  setTimeout(debugRDKitMOL, 1000)
}

// 导出函数供手动调用
if (typeof module !== 'undefined') {
  module.exports = { debugRDKitMOL }
}

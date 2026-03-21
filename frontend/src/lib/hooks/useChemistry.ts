'use client'

import { useEffect, useState } from 'react'

interface UseChemistryOptions {
  /** RDKit WASM 文件URL */
  rdkitWasmUrl?: string
}

interface UseChemistryReturn {
  /** RDKit 是否已加载 */
  isLoaded: boolean
  /** 加载错误 */
  error: string | null
  /** RDKit 实例 */
  RDKit: any
  /** 将 SMILES 转换为 2D SVG */
  smilesToSVG: (smiles: string) => Promise<string>
  /** 将 MOL 块转换为 2D SVG */
  molToSVG: (mol: string) => Promise<string>
  /** 获取分子指纹 */
  getMorganFingerprint: (smiles: string, _radius?: number, bits?: number) => Promise<string>
}

/**
 * Chemistry Hook - 化学结构处理工具
 * 由于RDKit.js CDN不可访问，暂时使用模拟功能
 * 后续可以替换为实际的RDKit集成
 */
export function useChemistry(options: UseChemistryOptions = {}): UseChemistryReturn {
  // Consume options to silence TS6133 when not all options are used
  void options
  const [isLoaded, setIsLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [RDKit, setRDKit] = useState<any>(null)

  useEffect(() => {
    // 模拟RDKit加载过程
    const initMockRDKit = async () => {
      try {
        if (typeof window === 'undefined') {
          return
        }

        // 模拟加载延迟
        await new Promise((resolve) => setTimeout(resolve, 1000))

        // 创建模拟的RDKit对象
        const mockRDKit = {
          get_mol: (input: string) => ({
            get_svg: () => {
              // 创建一个更好的模拟化学结构SVG
              const format = detectChemicalFormat(input)
              const displayText = input.length > 30 ? input.substring(0, 30) + '...' : input

              return `<svg width="400" height="250" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <style>
                    .title { font-family: Arial, sans-serif; font-size: 16px; font-weight: bold; fill: #333; }
                    .info { font-family: Arial, sans-serif; font-size: 12px; fill: #666; }
                    .format { font-family: Arial, sans-serif; font-size: 11px; fill: #0066cc; font-weight: bold; }
                    .warning { font-family: Arial, sans-serif; font-size: 10px; fill: #ff6600; }
                    .input-box { fill: #f8f9fa; stroke: #dee2e6; stroke-width: 1; }
                  </style>
                </defs>
                <rect width="400" height="250" fill="white" stroke="#ccc" stroke-width="2"/>
                <text x="200" y="30" text-anchor="middle" class="title">Chemical Structure Viewer</text>

                <rect x="20" y="50" width="360" height="80" class="input-box" rx="5"/>
                <text x="200" y="75" text-anchor="middle" class="format">Format: ${format.toUpperCase()}</text>
                <text x="200" y="95" text-anchor="middle" class="info">${displayText}</text>
                <text x="200" y="115" text-anchor="middle" class="info">Length: ${input.length} characters</text>

                <text x="200" y="160" text-anchor="middle" class="warning">
                  ⚠️ RDKit.js CDN not available - Using Mock Mode
                </text>
                <text x="200" y="180" text-anchor="middle" class="info">
                  Real chemical structure visualization requires RDKit.js
                </text>
                <text x="200" y="200" text-anchor="middle" class="info">
                  3Dmol.js components will still work for 3D visualization
                </text>
              </svg>`
            },
            get_morgan_fingerprint: (_radius: number, bits: number) => ({
              to_bitstring: () => {
                // 生成模拟的分子指纹
                // 使用输入数据的哈希来生成一致的指纹
                const hash = input.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
                const seed = hash % 1000
                const fingerprint = Array(bits)
                  .fill(0)
                  .map((_, i) => {
                    // 使用种子生成伪随机但一致的指纹
                    const pseudoRandom = Math.sin(seed + i) * 10000
                    return pseudoRandom - Math.floor(pseudoRandom) > 0.1 ? '1' : '0'
                  })
                return fingerprint.join('')
              },
              delete: () => {},
            }),
            delete: () => {},
          }),
          loadRDKit: async () => {
            console.log('Mock RDKit loaded')
          },
        }

        setRDKit(mockRDKit)
        setIsLoaded(true)
        setError(null)
      } catch (err) {
        console.error('Failed to initialize mock RDKit:', err)
        setError(err instanceof Error ? err.message : 'Failed to initialize mock RDKit')
        setIsLoaded(false)
      }
    }

    initMockRDKit()

    return () => {
      // 清理资源
      setRDKit(null)
      setIsLoaded(false)
    }
  }, [])

  const smilesToSVG = async (smiles: string): Promise<string> => {
    if (!RDKit) {
      throw new Error('RDKit not loaded')
    }

    try {
      const mol = RDKit.get_mol(smiles)
      const svg = mol.get_svg()
      mol.delete()
      return svg
    } catch (err) {
      throw new Error(`Failed to convert SMILES to SVG: ${err}`)
    }
  }

  const molToSVG = async (mol: string): Promise<string> => {
    if (!RDKit) {
      throw new Error('RDKit not loaded')
    }

    try {
      const molecule = RDKit.get_mol(mol)
      const svg = molecule.get_svg()
      molecule.delete()
      return svg
    } catch (err) {
      throw new Error(`Failed to convert MOL to SVG: ${err}`)
    }
  }

  const getMorganFingerprint = async (smiles: string, radius = 2, bits = 2048): Promise<string> => {
    if (!RDKit) {
      throw new Error('RDKit not loaded')
    }

    try {
      const mol = RDKit.get_mol(smiles)
      const fp = mol.get_morgan_fingerprint(radius, bits)
      const fingerprint = fp.to_bitstring()
      mol.delete()
      fp.delete()
      return fingerprint
    } catch (err) {
      throw new Error(`Failed to generate fingerprint: ${err}`)
    }
  }

  return {
    isLoaded,
    error,
    RDKit,
    smilesToSVG,
    molToSVG,
    getMorganFingerprint,
  }
}

/**
 * 检测化学数据格式
 */
export function detectChemicalFormat(data: string): 'smiles' | 'mol' | 'sdf' | 'pdb' | 'unknown' {
  if (!data || typeof data !== 'string') {
    return 'unknown'
  }
  const trimmedData = data.trim()

  // 如果数据为空，返回 unknown
  if (!trimmedData) {
    return 'unknown'
  }

  // 检测 SMILES (通常是单行，不含换行符)
  // SMILES 特征：只包含特定化学符号，不包含空格或数字坐标
  if (
    !trimmedData.includes('\n') &&
    trimmedData.length > 1 &&
    trimmedData.length < 200 &&
    /^[BCNOSPFIPClBr[\]()@=+\-#\\/%0-9.]+$/.test(trimmedData)
  ) {
    return 'smiles'
  }

  // 检测 MOL/SDF (包含特定标识符)
  // MOL 文件特征：包含 V2000 或 V3000 版本号，或者包含 M END 标记
  if (
    trimmedData.includes('V2000') ||
    trimmedData.includes('V3000') ||
    trimmedData.includes('M  END') ||
    trimmedData.includes('M END')
  ) {
    return trimmedData.includes('$$$$') ? 'sdf' : 'mol'
  }

  // 检测 PDB (蛋白质数据库格式)
  if (trimmedData.includes('ATOM') || trimmedData.includes('HETATM')) {
    return 'pdb'
  }

  // 检测 XYZ 格式（简单的原子坐标格式）
  // 第一行是原子数，第二行是注释，后面是原子坐标
  const lines = trimmedData.split('\n').filter((line) => line.trim())
  if (lines.length >= 3) {
    const firstLine = lines[0].trim()
    // 检查第一行是否为纯数字（原子数）
    if (/^\d+$/.test(firstLine) && parseInt(firstLine) > 0) {
      // 检查后续行是否包含原子坐标格式（元素符号 + 数字）
      const hasCoordinates = lines.slice(2).some((line) => {
        const parts = line.trim().split(/\s+/)
        return parts.length >= 4 && /^[A-Z][a-z]?$/.test(parts[0])
      })
      if (hasCoordinates) {
        return 'mol' // XYZ 格式可以按 MOL 处理
      }
    }
  }

  // 如果包含化学元素符号，但格式不明确，尝试进一步分析
  const hasChemicalElements = /[BCNOSPFIPClbr]/.test(trimmedData)
  const hasCoordinates = /\d+\.\d+\s+\d+\.\d+\s+\d+\.\d+/.test(trimmedData)

  if (hasChemicalElements && (hasCoordinates || trimmedData.includes('ChemDraw'))) {
    return 'mol'
  }

  return 'unknown'
}

/**
 * 解析化学数据
 */
export function parseChemicalData(data: string): { format: string; data: string } {
  const format = detectChemicalFormat(data)

  if (format === 'unknown') {
    throw new Error('Unable to detect chemical data format')
  }

  return {
    format,
    data: data.trim(),
  }
}

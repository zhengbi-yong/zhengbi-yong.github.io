'use client'

import { useEffect, useRef, useState } from 'react'

interface UseChemistryLocalOptions {
  /** RDKit WASM 文件URL */
  rdkitWasmUrl?: string
}

interface UseChemistryLocalReturn {
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
  getMorganFingerprint: (smiles: string, radius?: number, bits?: number) => Promise<string>
}

/**
 * Chemistry Hook - 化学结构处理工具
 * 使用本地RDKit.js文件
 */
export function useChemistryLocal(options: UseChemistryLocalOptions = {}): UseChemistryLocalReturn {
  const [isLoaded, setIsLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [RDKit, setRDKit] = useState<any>(null)
  const rdkitRef = useRef<any>(null)

  useEffect(() => {
    const loadRDKit = async () => {
      try {
        if (typeof window === 'undefined') {
          return
        }

        // 如果已经加载，直接返回
        if (rdkitRef.current) {
          setRDKit(rdkitRef.current)
          setIsLoaded(true)
          setError(null)
          return
        }

        // 加载本地RDKit脚本
        const script = document.createElement('script')
        script.src = '/chemistry/rdkit/RDKit_minimal.js'
        script.async = true

        const loadPromise = new Promise<void>((resolve, reject) => {
          script.onload = () => {
            // 等待initRDKitModule函数可用
            const checkInitRDKit = () => {
              if ((window as any).initRDKitModule) {
                // 初始化RDKit
                ;(window as any)
                  .initRDKitModule()
                  .then((RDKitModule: any) => {
                    rdkitRef.current = RDKitModule
                    setRDKit(RDKitModule)
                    setIsLoaded(true)
                    setError(null)
                    resolve()
                  })
                  .catch((err: any) => {
                    reject(new Error(`Failed to initialize RDKit: ${err}`))
                  })
              } else {
                setTimeout(checkInitRDKit, 100)
              }
            }
            checkInitRDKit()
          }

          script.onerror = () => {
            reject(new Error('Failed to load RDKit.js'))
          }
        })

        document.head.appendChild(script)
        await loadPromise
      } catch (err) {
        console.error('Failed to load RDKit:', err)
        setError(err instanceof Error ? err.message : 'Failed to load RDKit')
        setIsLoaded(false)
      }
    }

    loadRDKit()

    return () => {
      // 不清理脚本，因为其他组件可能仍在使用
    }
  }, [])

  const smilesToSVG = async (smiles: string): Promise<string> => {
    if (!RDKit) {
      throw new Error('RDKit not loaded')
    }

    try {
      const mol = RDKit.get_mol(smiles)
      if (!mol) {
        throw new Error('Invalid SMILES string')
      }
      const svg = mol.get_svg()
      if (!svg) {
        throw new Error('Failed to generate SVG from SMILES')
      }
      mol.delete()
      return svg
    } catch (err) {
      console.error('SMILES to SVG error:', { smiles, error: err })
      throw new Error(`Failed to convert SMILES to SVG: ${err}`)
    }
  }

  const molToSVG = async (molData: string): Promise<string> => {
    if (!RDKit) {
      throw new Error('RDKit not loaded')
    }

    try {
      // 对于 MOL 格式，RDKit 需要特定的格式
      let processedMolData = molData.trim()

      // 检查是否是 MOL 块格式
      if (processedMolData.includes('V2000') || processedMolData.includes('V3000')) {
        // 解析 MOL 块
        const lines = processedMolData
          .split('\n')
          .map((line) => line.trim())
          .filter((line) => line)
        const isV3000 = processedMolData.includes('V3000')

        if (lines.length >= 4) {
          // 第三行应该是计数行（原子数和键数）
          let countLine = lines[3]

          if (!isV3000) {
            // V2000 格式处理
            const countMatch = countLine.match(/^(\d+)\s+(\d+)/)

            if (!countMatch) {
              // 如果没有有效的计数行，尝试计算原子和键的数量
              const atomLines = lines.slice(4).filter((line) => {
                const parts = line.split(/\s+/)
                return parts.length >= 9 && /^\d+$/.test(parts[0])
              })

              const bondLines = lines.slice(4).filter((line) => {
                const parts = line.split(/\s+/)
                return parts.length >= 4 && parts.length < 9 && /^\d+$/.test(parts[0])
              })

              // 创建正确的计数行
              countLine = `${atomLines.length.toString().padStart(3)}  ${bondLines.length.toString().padStart(3)}  0  0  0  0            999 V2000`
              lines[3] = countLine
              console.log('Generated new count line:', countLine)
            }

            // 确保 M END 行存在
            if (!lines[lines.length - 1].startsWith('M  END')) {
              lines.push('M  END')
            }

            // 重新构建 MOL 数据
            processedMolData = lines.join('\n')
          }
        }

        // 额外的格式检查
        const atomLines = processedMolData.split('\n').filter((line) => {
          const parts = line.trim().split(/\s+/)
          return parts.length >= 9 && /^[A-Z][a-z]?$/.test(parts[3]) // 第4个位置应该是元素符号
        })

        if (atomLines.length === 0) {
          throw new Error('No valid atom lines found in MOL data')
        }
      }

      // 尝试解析处理后的数据
      const molecule = RDKit.get_mol(processedMolData)
      if (!molecule) {
        // 如果仍然失败，尝试移除 ChemDraw 标题行
        let cleanedData = processedMolData
        if (cleanedData.startsWith('ChemDraw')) {
          const lines = cleanedData.split('\n')
          // 跳过第一行（ChemDraw 标题）
          if (lines.length > 1 && lines[1].trim() === '') {
            cleanedData = lines.slice(2).join('\n')
          } else {
            cleanedData = lines.slice(1).join('\n')
          }

          // 再次尝试
          const mol = RDKit.get_mol(cleanedData)
          if (mol) {
            const svg = mol.get_svg()
            mol.delete()
            if (svg) return svg
          }
        }

        // 尝试作为 SMILES 处理
        console.warn(
          'Failed to parse as MOL, trying as SMILES:',
          processedMolData.substring(0, 100)
        )
        const mol = RDKit.get_mol(processedMolData)
        if (!mol) {
          throw new Error(
            `Unable to parse chemical data. Format detected: ${detectChemicalFormat(molData)}`
          )
        }
        const svg = mol.get_svg()
        mol.delete()
        return svg
      }

      const svg = molecule.get_svg()
      if (!svg) {
        throw new Error('Failed to generate SVG from MOL data')
      }
      molecule.delete()
      return svg
    } catch (err) {
      console.error('MOL to SVG error:', {
        data: molData.substring(0, 200) + '...',
        format: detectChemicalFormat(molData),
        error: err,
      })
      throw new Error(`Failed to convert MOL to SVG: ${err}`)
    }
  }

  const getMorganFingerprint = async (input: string, radius = 2, bits = 2048): Promise<string> => {
    if (!RDKit) {
      throw new Error('RDKit not loaded')
    }

    // 检测输入格式
    const format = detectChemicalFormat(input)

    if (!input || input.trim() === '') {
      throw new Error('No chemical data provided')
    }

    try {
      let mol = null
      let processedInput = input.trim()

      // 根据格式处理输入
      if (format === 'mol') {
        // 对于 MOL 格式，先尝试直接解析
        mol = RDKit.get_mol(processedInput)

        if (!mol) {
          // 如果失败，尝试清理 MOL 数据
          if (processedInput.startsWith('ChemDraw')) {
            const lines = processedInput.split('\n')
            processedInput = lines.slice(2).join('\n') // 跳过 ChemDraw 标题和空行
            mol = RDKit.get_mol(processedInput)
          }
        }
      } else if (format === 'smiles') {
        // 对于 SMILES 格式，直接解析
        mol = RDKit.get_mol(processedInput)
      } else {
        throw new Error(
          `Unsupported format for fingerprint generation: ${format}. Only SMILES and MOL formats are supported.`
        )
      }

      if (!mol) {
        throw new Error(`Failed to parse chemical data. Format: ${format}`)
      }

      // 生成 Morgan 指纹 - 使用正确的 RDKit API
      // RDKit 的 get_morgan_fp 方法接受参数作为 JSON 字符串
      const options = JSON.stringify({ radius, nBits: bits })
      const fingerprint = mol.get_morgan_fp(options)

      if (!fingerprint) {
        mol.delete()
        throw new Error('Failed to generate Morgan fingerprint')
      }

      mol.delete()
      return fingerprint
    } catch (err) {
      console.error('Fingerprint generation error:', {
        input: input.substring(0, 100),
        format,
        radius,
        bits,
        error: err,
      })
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

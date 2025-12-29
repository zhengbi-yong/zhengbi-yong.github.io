// @ts-nocheck
'use client'

import { useEffect, useRef, useState } from 'react'
import { logger } from '@/lib/utils/logger'

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

        // 等待 initRDKitModule 函数变得可用（最多等待10秒）
        const maxWaitTime = 10000 // 10 seconds
        const checkInterval = 100 // 100ms
        let waitedTime = 0

        const waitForRDKit = (): Promise<any> => {
          return new Promise((resolve, reject) => {
            const checkRDKit = () => {
              if ((window as any).initRDKitModule) {
                logger.log('initRDKitModule found, initializing...')
                resolve((window as any).initRDKitModule())
              } else if (waitedTime >= maxWaitTime) {
                reject(new Error('RDKit script did not load within 10 seconds'))
              } else {
                waitedTime += checkInterval
                setTimeout(checkRDKit, checkInterval)
              }
            }
            checkRDKit()
          })
        }

        const RDKitModule = await waitForRDKit()
        rdkitRef.current = RDKitModule
        setRDKit(RDKitModule)
        setIsLoaded(true)
        setError(null)
        logger.log('RDKit loaded successfully')
      } catch (err) {
        logger.error('Failed to load RDKit:', err)
        setError(err instanceof Error ? err.message : 'Failed to load RDKit')
        setIsLoaded(false)
      }
    }

    loadRDKit()

    return () => {
      // 不清理，因为其他组件可能仍在使用
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
      logger.error('SMILES to SVG error:', { smiles, error: err })
      throw new Error(`Failed to convert SMILES to SVG: ${err}`)
    }
  }

  const molToSVG = async (molData: string): Promise<string> => {
    if (!RDKit) {
      throw new Error('RDKit not loaded')
    }

    try {
      // First try to identify the molecule and get its SMILES
      const { getSMILESFromMOL } = await import('@/lib/molecule-database')
      const smiles = getSMILESFromMOL(molData)

      if (smiles) {
        logger.log(`Identified molecule, using SMILES: ${smiles}`)
        return await smilesToSVG(smiles)
      }

      // Try direct MOL parsing (minimal RDKit might not support it)
      let processedMolData = molData.trim()

      // 检查是否是 MOL 块格式
      if (processedMolData.includes('V2000') || processedMolData.includes('V3000')) {
        // 最小化处理 - 只移除 ChemDraw 标题，保持其他不变
        if (processedMolData.startsWith('ChemDraw')) {
          const lines = processedMolData.split('\n')
          const vIndex = lines.findIndex((line) => line.includes('V2000') || line.includes('V3000'))
          if (vIndex > 0) {
            // 只保留 V2000 行及其之后的内容
            processedMolData = lines.slice(vIndex).join('\n')
          }
        }

        // 确保 M END 存在
        if (!processedMolData.includes('M  END')) {
          processedMolData += '\nM  END'
        }

        // 直接尝试解析
        const molecule = RDKit.get_mol(processedMolData)

        if (molecule) {
          const svg = molecule.get_svg()
          molecule.delete()
          if (svg) return svg
        }
      }

      // 如果是 SMILES，直接解析
      const molecule = RDKit.get_mol(molData)
      if (molecule) {
        const svg = molecule.get_svg()
        molecule.delete()
        return svg
      }

      throw new Error(
        `Unable to identify molecule from MOL data. The RDKit minimal build doesn't support MOL format parsing. Please use SMILES format instead.`
      )
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err)
      throw new Error(`Failed to convert MOL to SVG: ${errorMessage}`)
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
        // First try to identify the molecule and get its SMILES
        const { getSMILESFromMOL } = await import('@/lib/molecule-database')
        const smiles = getSMILESFromMOL(input)

        if (smiles) {
          logger.log(`Identified molecule for fingerprint, using SMILES: ${smiles}`)
          mol = RDKit.get_mol(smiles)
        } else {
          // For MOL format, try direct parsing (won't work with minimal build)
          mol = RDKit.get_mol(processedInput)

          if (!mol) {
            // If failed, try cleaning MOL data
            if (processedInput.startsWith('ChemDraw')) {
              const lines = processedInput.split('\n')
              processedInput = lines.slice(2).join('\n') // Skip ChemDraw header
              mol = RDKit.get_mol(processedInput)
            }
          }
        }
      } else if (format === 'smiles') {
        // For SMILES format, parse directly
        mol = RDKit.get_mol(processedInput)
      } else {
        throw new Error(
          `Unsupported format for fingerprint generation: ${format}. Only SMILES and MOL formats are supported.`
        )
      }

      if (!mol) {
        throw new Error(`Failed to parse chemical data. Format: ${format}`)
      }

      // Generate Morgan fingerprint - use correct RDKit API
      // RDKit's get_morgan_fp method accepts parameters as JSON string
      const options = JSON.stringify({ radius, nBits: bits })
      const fingerprint = mol.get_morgan_fp(options)

      if (!fingerprint) {
        mol.delete()
        throw new Error('Failed to generate Morgan fingerprint')
      }

      mol.delete()
      return fingerprint
    } catch (err) {
      logger.error('Fingerprint generation error:', {
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

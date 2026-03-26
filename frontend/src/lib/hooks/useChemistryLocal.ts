// @ts-nocheck
'use client'

import { useEffect, useRef, useState } from 'react'
import { logger } from '@/lib/utils/logger'
import { useRDKitInit } from '@/lib/hooks/useRDKitInit'

interface UseChemistryLocalOptions {}

interface UseChemistryLocalReturn {
  isLoaded: boolean
  error: string | null
  RDKit: any
  smilesToSVG: (smiles: string) => Promise<string>
  molToSVG: (mol: string) => Promise<string>
  getMorganFingerprint: (smiles: string, radius?: number, bits?: number) => Promise<string>
}

function normalizeLineEndings(value: string) {
  return value.replace(/\r\n?/g, '\n')
}

function normalizeMolLikeData(molData: string) {
  let normalized = normalizeLineEndings(molData).trim()

  if (!normalized) {
    return normalized
  }

  const lines = normalized.split('\n').map((line) => line.trimEnd())
  const countsIndex = lines.findIndex((line) => line.includes('V2000') || line.includes('V3000'))

  if (countsIndex > 0) {
    normalized = ['', '', ...lines.slice(countsIndex)].join('\n')
  } else {
    normalized = lines.join('\n')
  }

  if (!/\bM\s+END\b/.test(normalized)) {
    normalized = `${normalized}\nM  END`
  }

  return normalized
}

function buildMolFromCandidates(activeRDKit: any, candidates: string[]) {
  const uniqueCandidates = Array.from(
    new Set(candidates.map((candidate) => candidate.trim()).filter(Boolean))
  )

  for (const candidate of uniqueCandidates) {
    const molecule = activeRDKit.get_mol(candidate)
    if (molecule) {
      return molecule
    }
  }

  return null
}

export function useChemistryLocal(options: UseChemistryLocalOptions = {}): UseChemistryLocalReturn {
  void options

  const [isLoaded, setIsLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [RDKit, setRDKit] = useState<any>(null)
  const rdkitRef = useRef<any>(null)

  const { isLoaded: rdKitLoaded, error: rdKitError, RDKit: rdKitInstance } = useRDKitInit()

  useEffect(() => {
    const activeRDKit =
      rdKitInstance || (typeof window !== 'undefined' ? (window as any).RDKit : null) || null

    setRDKit(activeRDKit)
    setIsLoaded(rdKitLoaded || !!activeRDKit)
    setError(rdKitError)
    rdkitRef.current = activeRDKit
  }, [rdKitLoaded, rdKitError, rdKitInstance])

  const getActiveRDKit = () => {
    const activeRDKit =
      rdkitRef.current ||
      RDKit ||
      (typeof window !== 'undefined' ? (window as any).RDKit : null)

    if (!activeRDKit) {
      throw new Error('RDKit not loaded')
    }

    return activeRDKit
  }

  const smilesToSVG = async (smiles: string): Promise<string> => {
    try {
      const activeRDKit = getActiveRDKit()
      const mol = activeRDKit.get_mol(smiles)

      if (!mol) {
        throw new Error('Invalid SMILES string')
      }

      const svg = mol.get_svg()
      mol.delete()

      if (!svg) {
        throw new Error('Failed to generate SVG from SMILES')
      }

      return svg
    } catch (err) {
      logger.error('SMILES to SVG error:', { smiles, error: err })
      throw new Error(`Failed to convert SMILES to SVG: ${err}`)
    }
  }

  const molToSVG = async (molData: string): Promise<string> => {
    try {
      const activeRDKit = getActiveRDKit()
      const { getSMILESFromMOL } = await import('@/lib/molecule-database')
      const smiles = getSMILESFromMOL(molData)

      if (smiles) {
        logger.log(`Identified molecule, using SMILES: ${smiles}`)
        return await smilesToSVG(smiles)
      }

      const molecule = buildMolFromCandidates(activeRDKit, [
        normalizeMolLikeData(molData),
        normalizeLineEndings(molData),
      ])

      if (!molecule) {
        throw new Error('Invalid MOL data')
      }

      const svg = molecule.get_svg()
      molecule.delete()

      if (!svg) {
        throw new Error('Failed to generate SVG from MOL')
      }

      return svg
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err)
      throw new Error(`Failed to convert MOL to SVG: ${errorMessage}`)
    }
  }

  const getMorganFingerprint = async (input: string, radius = 2, bits = 2048): Promise<string> => {
    if (!input || input.trim() === '') {
      throw new Error('No chemical data provided')
    }

    const activeRDKit = getActiveRDKit()
    const format = detectChemicalFormat(input)

    try {
      let mol = null
      const normalizedInput = normalizeLineEndings(input).trim()

      if (format === 'mol' || format === 'sdf') {
        const { getSMILESFromMOL } = await import('@/lib/molecule-database')
        const smiles = getSMILESFromMOL(normalizedInput)

        if (smiles) {
          logger.log(`Identified molecule for fingerprint, using SMILES: ${smiles}`)
          mol = activeRDKit.get_mol(smiles)
        } else {
          mol = buildMolFromCandidates(activeRDKit, [
            normalizeMolLikeData(normalizedInput),
            normalizedInput,
          ])
        }
      } else if (format === 'smiles') {
        mol = activeRDKit.get_mol(normalizedInput)
      } else {
        throw new Error(
          `Unsupported format for fingerprint generation: ${format}. Only SMILES and MOL formats are supported.`
        )
      }

      if (!mol) {
        throw new Error(`Failed to parse chemical data. Format: ${format}`)
      }

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

export function detectChemicalFormat(data: string): 'smiles' | 'mol' | 'sdf' | 'pdb' | 'unknown' {
  if (!data || typeof data !== 'string') {
    return 'unknown'
  }

  const trimmedData = data.trim()
  if (!trimmedData) {
    return 'unknown'
  }

  if (
    !trimmedData.includes('\n') &&
    trimmedData.length > 1 &&
    trimmedData.length < 200 &&
    /^[BCNOSPFIPClBr[\]()@=+\-#\\/%0-9.]+$/.test(trimmedData)
  ) {
    return 'smiles'
  }

  if (
    trimmedData.includes('V2000') ||
    trimmedData.includes('V3000') ||
    trimmedData.includes('M  END') ||
    trimmedData.includes('M END')
  ) {
    return trimmedData.includes('$$$$') ? 'sdf' : 'mol'
  }

  if (trimmedData.includes('ATOM') || trimmedData.includes('HETATM')) {
    return 'pdb'
  }

  const lines = trimmedData.split('\n').filter((line) => line.trim())
  if (lines.length >= 3) {
    const firstLine = lines[0].trim()
    if (/^\d+$/.test(firstLine) && parseInt(firstLine, 10) > 0) {
      const hasCoordinates = lines.slice(2).some((line) => {
        const parts = line.trim().split(/\s+/)
        return parts.length >= 4 && /^[A-Z][a-z]?$/.test(parts[0])
      })

      if (hasCoordinates) {
        return 'mol'
      }
    }
  }

  const hasChemicalElements = /[BCNOSPFIPClbr]/.test(trimmedData)
  const hasCoordinates = /\d+\.\d+\s+\d+\.\d+\s+\d+\.\d+/.test(trimmedData)

  if (hasChemicalElements && (hasCoordinates || trimmedData.includes('ChemDraw'))) {
    return 'mol'
  }

  return 'unknown'
}

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

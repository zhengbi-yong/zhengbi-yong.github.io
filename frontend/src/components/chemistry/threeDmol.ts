'use client'

export type ChemicalViewerStyle = 'stick' | 'cartoon' | 'sphere' | 'surface' | 'line'

interface StructureSourceOptions {
  file?: string
  data?: string
  format?: string
}

interface ResolvedStructureSource {
  data: string
  format: string
}

function normalizeFormat(format?: string | null) {
  return format?.trim().toLowerCase() || null
}

function inferFormatFromFile(file?: string) {
  if (!file) {
    return null
  }

  const cleanFile = file.split('?')[0]?.split('#')[0] || file
  const match = cleanFile.match(/\.([a-z0-9]+)$/i)
  return normalizeFormat(match?.[1] || null)
}

function inferFormatFromData(data?: string) {
  if (!data) {
    return null
  }

  const trimmed = data.trim()

  if (!trimmed) {
    return null
  }

  if (trimmed.includes('ATOM') || trimmed.includes('HETATM')) {
    return 'pdb'
  }

  if (trimmed.includes('V2000') || trimmed.includes('V3000') || trimmed.includes('M  END')) {
    return trimmed.includes('$$$$') ? 'sdf' : 'mol'
  }

  const lines = trimmed
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)

  if (lines.length >= 3 && /^\d+$/.test(lines[0])) {
    return 'xyz'
  }

  return null
}

function resolveFormat({ file, data, format }: StructureSourceOptions) {
  return (
    normalizeFormat(format) ||
    inferFormatFromFile(file) ||
    inferFormatFromData(data) ||
    'xyz'
  )
}

export async function load3Dmol() {
  if (typeof window === 'undefined') {
    throw new Error('3Dmol can only be loaded in the browser')
  }

  if ((window as any).$3Dmol?.createViewer) {
    return (window as any).$3Dmol
  }

  const module = await import('3dmol')
  const imported3Dmol =
    (module as any).default?.createViewer ? (module as any).default : (module as any)
  const resolved3Dmol =
    (window as any).$3Dmol?.createViewer ? (window as any).$3Dmol : imported3Dmol

  if (!resolved3Dmol?.createViewer) {
    throw new Error('3Dmol failed to initialize')
  }

  ;(window as any).$3Dmol = resolved3Dmol
  return resolved3Dmol
}

export async function resolveStructureSource({
  file,
  data,
  format,
}: StructureSourceOptions): Promise<ResolvedStructureSource> {
  if (file) {
    const response = await fetch(file, { cache: 'force-cache' })

    if (!response.ok) {
      throw new Error(`Failed to load structure file: ${response.status}`)
    }

    const fileData = await response.text()

    return {
      data: fileData,
      format: resolveFormat({ file, data: fileData, format }),
    }
  }

  if (!data || !data.trim()) {
    throw new Error('No chemical data provided')
  }

  return {
    data,
    format: resolveFormat({ data, format }),
  }
}

export function applyViewerStyle(viewer: any, threeDmol: any, style: ChemicalViewerStyle) {
  switch (style) {
    case 'cartoon':
      viewer.setStyle({}, { cartoon: {} })
      break
    case 'sphere':
      viewer.setStyle({}, { sphere: { scale: 0.35 } })
      break
    case 'line':
      viewer.setStyle({}, { line: {} })
      break
    case 'surface':
      viewer.setStyle({}, { stick: { radius: 0.16 } })
      if (threeDmol?.SurfaceType?.VDW) {
        viewer.addSurface(threeDmol.SurfaceType.VDW, { opacity: 0.6 })
      }
      break
    case 'stick':
    default:
      viewer.setStyle({}, { stick: {} })
      break
  }
}

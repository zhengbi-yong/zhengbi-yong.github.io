const NUMERIC_PROPS = ['height', 'width', 'radius', 'bits', 'atomLabelSize', 'bondWidth']
const BOOLEAN_PROPS = ['showDetails', 'autoRotate', 'showAtomNumbers']

function encodeBase64Utf8(value: string) {
  const bytes = new TextEncoder().encode(value)
  let binary = ''

  for (const byte of bytes) {
    binary += String.fromCharCode(byte)
  }

  if (typeof globalThis.btoa === 'function') {
    return globalThis.btoa(binary)
  }

  throw new Error('Base64 encoding is unavailable in the current runtime')
}

function normalizeSegment(segment: string) {
  let normalized = segment

  normalized = normalized.replace(/\bdata=\{`([\s\S]*?)`\}/g, (_, value: string) => {
    return `dataBase64="${encodeBase64Utf8(value)}"`
  })

  for (const prop of NUMERIC_PROPS) {
    const expressionPattern = new RegExp(`\\b${prop}=\\{(-?\\d+(?:\\.\\d+)?)\\}`, 'g')
    normalized = normalized.replace(expressionPattern, `${prop}="$1"`)
  }

  for (const prop of BOOLEAN_PROPS) {
    const expressionPattern = new RegExp(`\\b${prop}=\\{(true|false)\\}`, 'g')
    normalized = normalized.replace(expressionPattern, `${prop}="$1"`)
  }

  return normalized
}

export function normalizeRuntimeMdxContent(content: string) {
  const segments = content.split(/(```[\s\S]*?```)/g)

  return segments
    .map((segment) => (segment.startsWith('```') ? segment : normalizeSegment(segment)))
    .join('')
}

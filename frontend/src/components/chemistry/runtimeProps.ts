export function decodeBase64Utf8(value: string): string {
  if (typeof value !== 'string' || value.length === 0) {
    return value
  }

  if (typeof window !== 'undefined' && typeof window.atob === 'function') {
    try {
      const binary = window.atob(value)
      const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0))
      return new TextDecoder().decode(bytes)
    } catch {
      return value
    }
  }

  return value
}

export function resolveChemicalTextProp(value?: string, valueBase64?: string) {
  let resolved = ''

  if (typeof value === 'string' && value.trim()) {
    resolved = value
  } else if (typeof valueBase64 === 'string' && valueBase64.length > 0) {
    resolved = decodeBase64Utf8(valueBase64)
  }

  // ── Strip backtick delimiters ──
  // XYZ/SDF/PDB data is sometimes stored with leading/trailing
  // backticks (from template-literal wrapping in older editor versions).
  // 3Dmol.js requires clean format headers; `12 → 12 breaks parsing.
  // Handles both bare (`) and escaped (\`) backtick forms.
  if (resolved.length >= 2 && resolved.startsWith('`') && resolved.endsWith('`')) {
    resolved = resolved.slice(1, -1)
  } else if (resolved.length >= 3 &&
    resolved.startsWith('\\`') && resolved.endsWith('`')) {
    // Escaped backtick from template literal unescaping
    resolved = resolved.slice(2, -1)
  }

  return resolved
}

export function resolveNumberProp(value: number | string | undefined, fallback: number) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }

  if (typeof value === 'string') {
    const parsed = Number(value)
    if (Number.isFinite(parsed)) {
      return parsed
    }
  }

  return fallback
}

export function resolveBooleanProp(value: boolean | string | undefined, fallback: boolean) {
  if (typeof value === 'boolean') {
    return value
  }

  if (typeof value === 'string') {
    if (value === 'true') {
      return true
    }

    if (value === 'false') {
      return false
    }
  }

  return fallback
}

/**
 * Resolve data from either a raw JS value or a base64-encoded string.
 *
 * In static MDX (build-time), complex JSX props like data={[...]} are parsed
 * by the bundler and arrive as real JS objects. In runtime MDX (next-mdx-remote),
 * these are converted to base64 string attributes by the normalizer so the MDX
 * parser doesn't choke on nested braces.
 *
 * Priority: raw value > base64 decode > undefined
 */
export function resolveDataProp(data?: unknown, dataBase64?: string): unknown {
  if (data !== undefined && data !== null) {
    return data
  }

  if (typeof dataBase64 === 'string' && dataBase64.length > 0) {
    let decoded: string | undefined
    try {
      decoded = decodeBase64Utf8(dataBase64)
      return JSON.parse(decoded)
    } catch {
      // JSON.parse failed — the decoded string might be a JS object literal
      // (unquoted keys, single-quoted strings, trailing commas from MDX expressions)
      // Try evaluating as a JavaScript expression
      if (typeof decoded === 'string' && decoded.trim()) {
        try {
          // eslint-disable-next-line no-new-func
          const result = new Function('return (' + decoded + ')')()
          return result
        } catch {
          console.warn(
            '[resolveDataProp] Both JSON.parse and eval failed. Raw decoded:',
            decoded.slice(0, 200)
          )
          return decoded
        }
      }
      console.warn('[resolveDataProp] decodeBase64Utf8 failed for:', dataBase64?.slice(0, 50))
      return undefined
    }
  }

  return undefined
}

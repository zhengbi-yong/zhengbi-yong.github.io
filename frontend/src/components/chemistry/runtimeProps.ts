function decodeBase64Utf8(value: string) {
  if (typeof window !== 'undefined' && typeof window.atob === 'function') {
    const binary = window.atob(value)
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0))
    return new TextDecoder().decode(bytes)
  }

  return value
}

export function resolveChemicalTextProp(value?: string, valueBase64?: string) {
  if (typeof value === 'string' && value.trim()) {
    return value
  }

  if (typeof valueBase64 === 'string' && valueBase64.length > 0) {
    return decodeBase64Utf8(valueBase64)
  }

  return ''
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

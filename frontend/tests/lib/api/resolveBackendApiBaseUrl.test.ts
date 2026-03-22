import { describe, expect, it } from 'vitest'
import { resolveBackendApiBaseUrl } from '../../../src/lib/api/resolveBackendApiBaseUrl'

describe('resolveBackendApiBaseUrl', () => {
  it('appends /api/v1 to a bare backend origin', () => {
    expect(resolveBackendApiBaseUrl('http://localhost:3000')).toBe('http://localhost:3000/api/v1')
  })

  it('normalizes a legacy /v1 suffix to /api/v1', () => {
    expect(resolveBackendApiBaseUrl('http://localhost:3000/v1')).toBe(
      'http://localhost:3000/api/v1'
    )
  })

  it('preserves an already-correct /api/v1 base', () => {
    expect(resolveBackendApiBaseUrl('http://localhost:3000/api/v1')).toBe(
      'http://localhost:3000/api/v1'
    )
  })

  it('drops a trailing slash before normalization', () => {
    expect(resolveBackendApiBaseUrl('http://localhost:3000/')).toBe('http://localhost:3000/api/v1')
  })
})

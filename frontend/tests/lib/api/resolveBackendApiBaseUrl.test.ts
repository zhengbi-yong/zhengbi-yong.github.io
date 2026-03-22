import { describe, expect, it } from 'vitest'
import {
  resolveBackendApiBaseUrl,
  resolveBackendBaseUrl,
} from '../../../src/lib/api/resolveBackendApiBaseUrl'

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

  it('supports a relative /api base for same-origin deployments', () => {
    expect(resolveBackendApiBaseUrl('/api')).toBe('/api/v1')
  })
})

describe('resolveBackendBaseUrl', () => {
  it('strips the API suffix from normalized backend URLs', () => {
    expect(resolveBackendBaseUrl('http://localhost:3000/v1')).toBe('http://localhost:3000')
  })
})

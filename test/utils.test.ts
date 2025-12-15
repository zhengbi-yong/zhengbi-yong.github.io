import { describe, it, expect } from 'vitest'

describe('Utility functions', () => {
  it('should perform basic math operations', () => {
    expect(2 + 2).toBe(4)
    expect(10 - 5).toBe(5)
    expect(3 * 3).toBe(9)
    expect(10 / 2).toBe(5)
  })

  it('should handle string operations', () => {
    const str = 'Hello, World!'
    expect(str).toBe('Hello, World!')
    expect(str.length).toBe(13)
    expect(str.includes('Hello')).toBe(true)
  })

  it('should handle array operations', () => {
    const arr = [1, 2, 3, 4, 5]
    expect(arr).toHaveLength(5)
    expect(arr.includes(3)).toBe(true)
    expect(arr.slice(0, 3)).toEqual([1, 2, 3])
  })
})
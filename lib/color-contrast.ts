// Convert hex to RGB
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null
}

// Convert RGB to relative luminance
function rgbToLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    c = c / 255
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
  })
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs
}

// Calculate contrast ratio
export function calculateContrastRatio(color1: string, color2: string): number {
  const rgb1 = hexToRgb(color1)
  const rgb2 = hexToRgb(color2)

  if (!rgb1 || !rgb2) {
    console.error('Invalid color format')
    return 1
  }

  const lum1 = rgbToLuminance(rgb1.r, rgb1.g, rgb1.b)
  const lum2 = rgbToLuminance(rgb2.r, rgb2.g, rgb2.b)

  const brightest = Math.max(lum1, lum2)
  const darkest = Math.min(lum1, lum2)

  return (brightest + 0.05) / (darkest + 0.05)
}

// WCAG compliance levels
export type WCAGLevel = 'AA' | 'AAA' | 'AA-large' | 'AAA-large'

interface ComplianceResult {
  level: WCAGLevel
  passes: boolean
  minimumRatio: number
}

export function checkWCAGCompliance(ratio: number): ComplianceResult[] {
  const results: ComplianceResult[] = [
    { level: 'AA', passes: ratio >= 4.5, minimumRatio: 4.5 },
    { level: 'AA-large', passes: ratio >= 3, minimumRatio: 3 },
    { level: 'AAA', passes: ratio >= 7, minimumRatio: 7 },
    { level: 'AAA-large', passes: ratio >= 4.5, minimumRatio: 4.5 },
  ]
  return results
}

// Suggest lighter or darker color
export function suggestColor(
  baseColor: string,
  targetRatio: number,
  backgroundColor: string
): string | null {
  const base = hexToRgb(baseColor)
  const bg = hexToRgb(backgroundColor)

  if (!base || !bg) return null

  const bgLum = rgbToLuminance(bg.r, bg.g, bg.b)

  // Calculate target luminance
  let targetLum: number
  if (bgLum > 0.5) {
    // Background is light, need darker text
    targetLum = (bgLum + 0.05) / targetRatio - 0.05
  } else {
    // Background is dark, need lighter text
    targetLum = targetRatio * (bgLum + 0.05) - 0.05
  }

  // Adjust RGB values to match target luminance
  // This is a simplified approach - you might want to use a more sophisticated algorithm
  const adjustValue = (value: number, target: number): number => {
    const max = 255
    const min = 0
    const ratio = target / 100
    const adjusted = value * ratio
    return Math.max(min, Math.min(max, adjusted))
  }

  const avgLum = (base.r + base.g + base.b) / (3 * 255)
  const adjustment = targetLum - avgLum

  let newR = base.r
  let newG = base.g
  let newB = base.b

  if (adjustment > 0) {
    // Need to make lighter
    newR = Math.min(255, base.r + adjustment * 255)
    newG = Math.min(255, base.g + adjustment * 255)
    newB = Math.min(255, base.b + adjustment * 255)
  } else {
    // Need to make darker
    newR = Math.max(0, base.r + adjustment * 255)
    newG = Math.max(0, base.g + adjustment * 255)
    newB = Math.max(0, base.b + adjustment * 255)
  }

  const toHex = (n: number): string => {
    const hex = Math.round(n).toString(16)
    return hex.length === 1 ? '0' + hex : hex
  }

  return `#${toHex(newR)}${toHex(newG)}${toHex(newB)}`
}

// Color palette validator
export interface ColorPalette {
  primary: string
  secondary: string
  text: {
    primary: string
    secondary: string
    disabled: string
  }
  background: {
    primary: string
    secondary: string
    tertiary: string
  }
}

export function validateColorPalette(palette: ColorPalette): {
  valid: boolean
  issues: string[]
  suggestions: string[]
} {
  const issues: string[] = []
  const suggestions: string[] = []

  // Check text on background
  const textPrimaryRatio = calculateContrastRatio(palette.text.primary, palette.background.primary)
  if (textPrimaryRatio < 4.5) {
    issues.push('Primary text on primary background does not meet WCAG AA standards')
    suggestions.push(
      `Consider increasing contrast ratio to at least 4.5. Current ratio: ${textPrimaryRatio.toFixed(2)}`
    )
  }

  const textSecondaryRatio = calculateContrastRatio(
    palette.text.secondary,
    palette.background.primary
  )
  if (textSecondaryRatio < 4.5) {
    issues.push('Secondary text on primary background does not meet WCAG AA standards')
  }

  // Check text on secondary background
  const textOnSecondaryRatio = calculateContrastRatio(
    palette.text.primary,
    palette.background.secondary
  )
  if (textOnSecondaryRatio < 3) {
    issues.push('Text on secondary background does not meet WCAG AA large text standards')
  }

  // Check disabled text
  const disabledTextRatio = calculateContrastRatio(
    palette.text.disabled,
    palette.background.primary
  )
  if (disabledTextRatio < 3) {
    issues.push('Disabled text contrast may be too low for readability')
  }

  return {
    valid: issues.length === 0,
    issues,
    suggestions,
  }
}

// Dark mode color generator
export function generateDarkModePalette(lightPalette: ColorPalette): ColorPalette {
  // Invert colors and adjust for readability
  const invertColor = (hex: string): string => {
    const rgb = hexToRgb(hex)
    if (!rgb) return hex

    const inverted = {
      r: 255 - rgb.r,
      g: 255 - rgb.g,
      b: 255 - rgb.b,
    }

    const toHex = (n: number): string => {
      const hex = Math.round(n).toString(16)
      return hex.length === 1 ? '0' + hex : hex
    }

    return `#${toHex(inverted.r)}${toHex(inverted.g)}${toHex(inverted.b)}`
  }

  return {
    primary: lightPalette.primary,
    secondary: lightPalette.secondary,
    text: {
      primary: invertColor(lightPalette.background.primary),
      secondary: invertColor(lightPalette.background.secondary),
      disabled: invertColor(lightPalette.background.tertiary),
    },
    background: {
      primary: invertColor(lightPalette.text.primary),
      secondary: invertColor(lightPalette.text.secondary),
      tertiary: invertColor(lightPalette.text.disabled),
    },
  }
}

// Test color combinations on the page
export function scanPageColors(): {
  elements: Array<{
    element: Element
    foreground?: string
    background?: string
    ratio?: number
    passes: boolean
  }>
  summary: {
    total: number
    passing: number
    failing: number
  }
} {
  const elements: any[] = []
  let passing = 0
  let total = 0

  // Scan all elements with text
  const textElements = document.querySelectorAll(
    'h1, h2, h3, h4, h5, h6, p, span, a, button, label'
  )

  textElements.forEach((element) => {
    const styles = window.getComputedStyle(element)
    const foreground = styles.color
    const backgroundColor = styles.backgroundColor

    if (backgroundColor === 'transparent' || backgroundColor === 'rgba(0, 0, 0, 0)') {
      // Get parent background
      const parent = element.parentElement
      if (parent) {
        const parentStyles = window.getComputedStyle(parent)
        const parentBg = parentStyles.backgroundColor
        if (parentBg && parentBg !== 'transparent') {
          const ratio = calculateContrastRatio(rgbToHex(foreground), rgbToHex(parentBg))
          total++
          if (ratio >= 4.5) passing++

          elements.push({
            element,
            foreground: rgbToHex(foreground),
            background: rgbToHex(parentBg),
            ratio,
            passes: ratio >= 4.5,
          })
        }
      }
    } else {
      const ratio = calculateContrastRatio(rgbToHex(foreground), rgbToHex(backgroundColor))
      total++
      if (ratio >= 4.5) passing++

      elements.push({
        element,
        foreground: rgbToHex(foreground),
        background: rgbToHex(backgroundColor),
        ratio,
        passes: ratio >= 4.5,
      })
    }
  })

  return {
    elements,
    summary: {
      total,
      passing,
      failing: total - passing,
    },
  }
}

// Helper function to convert RGB to hex
function rgbToHex(rgb: string): string {
  const match = rgb.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)/)
  if (!match) return '#000000'

  const toHex = (n: string): string => {
    const hex = parseInt(n).toString(16)
    return hex.length === 1 ? '0' + hex : hex
  }

  return `#${toHex(match[1])}${toHex(match[2])}${toHex(match[3])}`
}

// Export a default palette checker for common Tailwind colors
export const checkTailwindColors = () => {
  const commonPairs = [
    { text: 'text-gray-900', bg: 'bg-white' },
    { text: 'text-gray-600', bg: 'bg-white' },
    { text: 'text-white', bg: 'bg-gray-900' },
    { text: 'text-white', bg: 'bg-blue-600' },
    { text: 'text-gray-700', bg: 'bg-gray-100' },
  ]

  console.group('🎨 Tailwind Color Contrast Report')
  commonPairs.forEach((pair) => {
    // This would need to be implemented to get actual hex values
    console.log(`${pair.text} on ${pair.bg}: Need to check contrast`)
  })
  console.groupEnd()
}

export interface PasswordStrength {
  score: number // 0-5
  label: string
  color: string
  requirements: {
    minLength: boolean
    hasUppercase: boolean
    hasLowercase: boolean
    hasDigit: boolean
    hasSpecialChar: boolean
  }
}

export function checkPasswordStrength(password: string): PasswordStrength {
  const requirements = {
    minLength: password.length >= 12,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasDigit: /[0-9]/.test(password),
    hasSpecialChar: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
  }

  const metRequirements = Object.values(requirements).filter(Boolean).length
  const score = metRequirements

  let label = ''
  let color = ''

  switch (score) {
    case 0:
    case 1:
      label = '非常弱'
      color = 'bg-red-500'
      break
    case 2:
      label = '弱'
      color = 'bg-orange-500'
      break
    case 3:
      label = '中等'
      color = 'bg-yellow-500'
      break
    case 4:
      label = '强'
      color = 'bg-lime-500'
      break
    case 5:
      label = '非常强'
      color = 'bg-green-500'
      break
  }

  return {
    score,
    label,
    color,
    requirements,
  }
}

export function isPasswordValid(strength: PasswordStrength): boolean {
  return Object.values(strength.requirements).every(Boolean)
}

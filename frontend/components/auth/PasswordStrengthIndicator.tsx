'use client'

import { checkPasswordStrength } from '@/lib/utils/password'

interface PasswordStrengthIndicatorProps {
  password: string
}

export function PasswordStrengthIndicator({ password }: PasswordStrengthIndicatorProps) {
  if (!password) {
    return null
  }

  const strength = checkPasswordStrength(password)

  return (
    <div className="space-y-2">
      {/* Strength bar */}
      <div className="flex items-center gap-2">
        <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${strength.color}`}
            style={{ width: `${(strength.score / 5) * 100}%` }}
          />
        </div>
        <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
          {strength.label}
        </span>
      </div>

      {/* Requirements list */}
      <div className="space-y-1">
        <RequirementItem
          met={strength.requirements.minLength}
          text="至少12个字符"
        />
        <RequirementItem
          met={strength.requirements.hasUppercase}
          text="包含大写字母 (A-Z)"
        />
        <RequirementItem
          met={strength.requirements.hasLowercase}
          text="包含小写字母 (a-z)"
        />
        <RequirementItem
          met={strength.requirements.hasDigit}
          text="包含数字 (0-9)"
        />
        <RequirementItem
          met={strength.requirements.hasSpecialChar}
          text="包含特殊字符 (!@#$%...)"
        />
      </div>
    </div>
  )
}

interface RequirementItemProps {
  met: boolean
  text: string
}

function RequirementItem({ met, text }: RequirementItemProps) {
  return (
    <div className="flex items-center gap-2 text-xs">
      {met ? (
        <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      ) : (
        <svg className="w-4 h-4 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      )}
      <span className={met ? 'text-green-700 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}>
        {text}
      </span>
    </div>
  )
}

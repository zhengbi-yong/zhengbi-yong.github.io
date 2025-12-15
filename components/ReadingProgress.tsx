'use client'

import { useTranslation } from 'react-i18next'
import { useReadingProgress } from './hooks/useReadingProgress'

interface ReadingProgressProps {
  className?: string
  showPercentage?: boolean
  showTime?: boolean
}

export default function ReadingProgress({
  className = '',
  showPercentage = true,
  showTime = false,
}: ReadingProgressProps) {
  const { t } = useTranslation()
  const { progress, isReading, readingTime, totalTime } = useReadingProgress()

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60

    if (minutes > 0) {
      return remainingSeconds > 0
        ? `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
        : `${minutes}:00`
    }
    return remainingSeconds.toString().padStart(2, '0')
  }

  return (
    <div
      className={`fixed bottom-0 left-0 z-50 h-1 w-full transition-opacity duration-300 ${
        progress > 0 ? 'opacity-100' : 'opacity-0'
      } ${className}`}
      style={{
        backgroundColor: progress > 0 ? '#3b82f6' : 'transparent',
      width: `${progress * 100}%`,
      }}
    >
      {/* 进度信息 */}
      {isReading && (
        <div className="fixed bottom-4 right-4 flex items-center gap-4 rounded-lg bg-white/90 px-4 py-2 shadow-lg dark:bg-gray-900/90">
          {showPercentage && (
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {Math.round(progress * 100)}%
            </span>
          )}
          {showTime && (
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {formatTime(readingTime)} / {formatTime(totalTime)}
            </span>
          )}
        </div>
      )}
    </div>
  )
}
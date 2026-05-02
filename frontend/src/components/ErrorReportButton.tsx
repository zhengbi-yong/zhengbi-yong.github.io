'use client'

import { useState } from 'react'
import { Bug, Send, X } from 'lucide-react'
import * as Sentry from '@sentry/nextjs'
import { logger } from '@/lib/utils/logger'

export default function ErrorReportButton({ eventId }: { eventId?: string }) {
  const [isOpen, setIsOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [comment, setComment] = useState('')
  const [isSubmitted, setIsSubmitted] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!eventId) return

    try {
      // 发送用户反馈到 Sentry
      await Sentry.captureFeedback({
        name: 'Anonymous User',
        email: email || undefined,
        message: comment,
        associatedEventId: eventId,
      })

      setIsSubmitted(true)
      setTimeout(() => {
        setIsOpen(false)
        setIsSubmitted(false)
        setEmail('')
        setComment('')
      }, 2000)
    } catch (error) {
      logger.error('Failed to send feedback:', error)
    }
  }

  if (!eventId || process.env.NODE_ENV === 'development') {
    return null
  }

  return (
    <>
      {/* 报告按钮 */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed right-4 bottom-4 z-50 flex items-center gap-2 rounded-full bg-destructive px-4 py-2 text-white shadow-lg hover:bg-red-700 focus:ring-2 focus:ring-destructive focus:ring-offset-2 dark:bg-destructive/50 dark:hover:bg-destructive"
      >
        <Bug className="h-4 w-4" />
        <span className="hidden sm:inline">报告问题</span>
      </button>

      {/* 模态框 */}
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-lg bg-background p-6 shadow-xl dark:bg-card">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-foreground dark:text-foreground">报告问题</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-muted-foreground hover:text-muted-foreground dark:hover:text-gray-300"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {isSubmitted ? (
              <div className="py-8 text-center">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--theme-success)]/10 dark:bg-[var(--theme-success)]/15/30">
                  <svg
                    className="h-6 w-6 text-[var(--theme-success)] dark:text-[var(--theme-success)]"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <p className="text-foreground dark:text-foreground">感谢您的反馈！</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label
                    htmlFor="email"
                    className="mb-1 block text-sm font-medium text-foreground dark:text-foreground"
                  >
                    邮箱地址（可选）
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-md border border-border px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-primary dark:border-border dark:bg-secondary dark:text-foreground"
                    placeholder="your@email.com"
                  />
                </div>

                <div>
                  <label
                    htmlFor="comment"
                    className="mb-1 block text-sm font-medium text-foreground dark:text-foreground"
                  >
                    问题描述
                  </label>
                  <textarea
                    id="comment"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    rows={4}
                    className="w-full rounded-md border border-border px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-primary dark:border-border dark:bg-secondary dark:text-foreground"
                    placeholder="请描述您遇到的问题..."
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-white transition-colors hover:bg-primary focus:ring-2 focus:ring-primary focus:ring-offset-2 dark:bg-primary dark:hover:bg-primary"
                >
                  <Send className="h-4 w-4" />
                  发送反馈
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  )
}

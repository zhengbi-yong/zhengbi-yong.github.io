'use client'

import { useState } from 'react'
import { Bug, Send, X } from 'lucide-react'
import * as Sentry from '@sentry/nextjs'

export default function ErrorReportButton({
  eventId,
}: {
  eventId?: string
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [comment, setComment] = useState('')
  const [isSubmitted, setIsSubmitted] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!eventId) return

    try {
      // 发送用户反馈到 Sentry
      await Sentry.captureUserFeedback({
        event_id: eventId,
        email: email || undefined,
        name: 'Anonymous User',
        comments: comment,
      })

      setIsSubmitted(true)
      setTimeout(() => {
        setIsOpen(false)
        setIsSubmitted(false)
        setEmail('')
        setComment('')
      }, 2000)
    } catch (error) {
      console.error('Failed to send feedback:', error)
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
        className="fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-full bg-red-600 px-4 py-2 text-white shadow-lg hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:bg-red-500 dark:hover:bg-red-600"
      >
        <Bug className="h-4 w-4" />
        <span className="hidden sm:inline">报告问题</span>
      </button>

      {/* 模态框 */}
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl dark:bg-gray-800">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                报告问题
              </h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {isSubmitted ? (
              <div className="py-8 text-center">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                  <svg
                    className="h-6 w-6 text-green-600 dark:text-green-400"
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
                <p className="text-gray-700 dark:text-gray-300">
                  感谢您的反馈！
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label
                    htmlFor="email"
                    className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    邮箱地址（可选）
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                    placeholder="your@email.com"
                  />
                </div>

                <div>
                  <label
                    htmlFor="comment"
                    className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    问题描述
                  </label>
                  <textarea
                    id="comment"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    rows={4}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                    placeholder="请描述您遇到的问题..."
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="flex w-full items-center justify-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:bg-blue-500 dark:hover:bg-blue-600"
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
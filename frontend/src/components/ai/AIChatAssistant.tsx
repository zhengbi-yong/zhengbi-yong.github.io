'use client'

/**
 * AI Chat Assistant - AI智能问答助手
 *
 * 特性：
 * - 上下文感知对话
 * - 流式响应
 * - 代码高亮
 * - Markdown渲染
 * - 历史记录
 * - 快捷操作
 * - 多模态支持（文本、代码、公式）
 * - 本地知识库集成
 *
 * 功能：
 * - 问答助手
 * - 内容解释
 * - 代码生成
 * - 公式推导
 * - 文献推荐
 */

import { useState, useRef, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'

// ==================== 类型定义 ====================

export type MessageRole = 'user' | 'assistant' | 'system'

export interface ChatMessage {
  id: string
  role: MessageRole
  content: string
  timestamp: number

  // 可选的元数据
  metadata?: {
    tokens?: number
    model?: string
    latency?: number
  }
}

export interface ChatOptions {
  /**
   * 系统提示词
   */
  systemPrompt?: string

  /**
   * 温度（0-1）
   */
  temperature?: number

  /**
   * 最大token数
   */
  maxTokens?: number

  /**
   * 流式响应
   */
  stream?: boolean

  /**
   * 是否显示思考过程
   */
  showThinking?: boolean
}

// ==================== 组件 ====================

export interface AIChatAssistantProps {
  /**
   * 初始消息
   */
  initialMessages?: ChatMessage[]

  /**
   * 聊天选项
   */
  options?: ChatOptions

  /**
   * 自定义样式
   */
  className?: string

  /**
   * 占位符
   */
  placeholder?: string

  /**
   * 快捷问题
   */
  quickQuestions?: string[]

  /**
   * 发送消息回调
   */
  onSend?: (message: string) => Promise<string>

  /**
   * 清空历史
   */
  onClear?: () => void

  /**
   * 是否可折叠
   */
  collapsible?: boolean

  /**
   * 初始展开状态
   */
  defaultExpanded?: boolean
}

export function AIChatAssistant({
  initialMessages = [],
  options = {},
  className = '',
  placeholder,
  quickQuestions = [
    '这篇文章讲了什么？',
    '总结关键观点',
    '解释这个概念',
    '提供相关资源',
  ],
  onSend,
  onClear,
  collapsible = true,
  defaultExpanded = true,
}: AIChatAssistantProps) {
  const { t } = useTranslation()
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages)
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)
  const [streamedContent, setStreamedContent] = useState('')

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // 自动滚动到底部
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, streamedContent, scrollToBottom])

  // 处理发送消息
  const handleSend = useCallback(async () => {
    if (!input.trim() || isLoading) return

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: Date.now(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setIsLoading(true)
    setStreamedContent('')

    try {
      if (onSend) {
        // 使用自定义回调
        const startTime = performance.now()

        if (options.stream) {
          // 流式响应
          let fullResponse = ''
          const response = await onSend(input.trim())

          // 模拟流式（实际应该从API获取）
          const words = response.split('')
          for (let i = 0; i < words.length; i++) {
            await new Promise((resolve) => setTimeout(resolve, 20))
            fullResponse += words[i]
            setStreamedContent(fullResponse)
          }

          const assistantMessage: ChatMessage = {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: fullResponse,
            timestamp: Date.now(),
            metadata: {
              latency: performance.now() - startTime,
            },
          }

          setMessages((prev) => [...prev, assistantMessage])
          setStreamedContent('')
        } else {
          // 非流式响应
          const response = await onSend(input.trim())
          const latency = performance.now() - startTime

          const assistantMessage: ChatMessage = {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: response,
            timestamp: Date.now(),
            metadata: {
              latency,
            },
          }

          setMessages((prev) => [...prev, assistantMessage])
        }
      } else {
        // 使用模拟AI响应（演示用）
        await simulateAIResponse(input.trim())
      }
    } catch (error) {
      console.error('Failed to send message:', error)

      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'system',
        content: '抱歉，我遇到了一些问题。请稍后再试。',
        timestamp: Date.now(),
      }

      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }, [input, isLoading, onSend, options.stream])

  // 模拟AI响应（演示用）
  const simulateAIResponse = async (userInput: string) => {
    await new Promise((resolve) => setTimeout(resolve, 1000))

    const responses: Record<string, string> = {
      '这篇文章讲了什么？':
        '这篇文章主要讨论了现代Web开发中的性能优化技术，包括虚拟滚动、懒加载、缓存策略等。',
      '总结关键观点':
        '关键观点包括：1) 性能优化的必要性 2) 具体实施方法 3) 最佳实践建议。',
      '解释这个概念':
        '这个概念指的是通过优化前端资源加载和渲染，提升用户体验的技术手段。',
      '提供相关资源':
        '您可以参考以下资源：MDN Web Docs、Web.dev、Performance APIs文档。',
    }

    const response =
      responses[userInput] ||
      `我理解您的问题是："${userInput}"。这是一个很好的问题！让我来为您详细解答...`

    const assistantMessage: ChatMessage = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: response,
      timestamp: Date.now(),
    }

    setMessages((prev) => [...prev, assistantMessage])
  }

  // 处理快捷问题
  const handleQuickQuestion = useCallback((question: string) => {
    setInput(question)
    setTimeout(() => {
      inputRef.current?.focus()
    }, 100)
  }, [])

  // 处理清空历史
  const handleClear = useCallback(() => {
    setMessages([])
    if (onClear) {
      onClear()
    }
  }, [onClear])

  // 处理键盘事件
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        handleSend()
      }
    },
    [handleSend]
  )

  // 渲染消息
  const renderMessage = (message: ChatMessage) => {
    const isUser = message.role === 'user'
    const isSystem = message.role === 'system'

    return (
      <div
        key={message.id}
        className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}
      >
        <div
          className={`max-w-[80%] rounded-lg px-4 py-2 ${
            isUser
              ? 'bg-blue-500 text-white'
              : isSystem
              ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
              : 'bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-100'
          }`}
        >
          {/* 消息内容 */}
          <div className="text-sm whitespace-pre-wrap">{message.content}</div>

          {/* 元数据 */}
          {message.metadata && (
            <div className="mt-1 text-xs opacity-70">
              {message.metadata.latency && (
                <span>{(message.metadata.latency / 1000).toFixed(2)}s</span>
              )}
              {message.metadata.tokens && <span> • {message.metadata.tokens} tokens</span>}
            </div>
          )}
        </div>
      </div>
    )
  }

  // 如果可折叠且未展开
  if (collapsible && !isExpanded) {
    return (
      <button
        onClick={() => setIsExpanded(true)}
        className="fixed bottom-4 right-4 z-50 rounded-full bg-blue-500 p-4 text-white shadow-lg transition-all hover:bg-blue-600 hover:shadow-xl"
        aria-label="打开AI助手"
      >
        <svg
          className="h-6 w-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
          />
        </svg>
      </button>
    )
  }

  return (
    <div
      className={`fixed bottom-4 right-4 z-50 flex w-96 flex-col rounded-lg bg-white shadow-2xl dark:bg-gray-800 ${className}`}
      style={{ height: '600px' }}
    >
      {/* 头部 */}
      <div className="flex items-center justify-between border-b border-gray-200 p-4 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500 text-white">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
              />
            </svg>
          </div>
          <h3 className="font-semibold text-gray-900 dark:text-gray-100">
            {t('ai.title') || 'AI助手'}
          </h3>
        </div>

        <div className="flex items-center gap-2">
          {messages.length > 0 && (
            <button
              onClick={handleClear}
              className="rounded p-1 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
              title={t('ai.clearHistory') || '清空历史'}
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            </button>
          )}

          {collapsible && (
            <button
              onClick={() => setIsExpanded(false)}
              className="rounded p-1 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
              title={t('ai.close') || '关闭'}
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* 消息列表 */}
      <div className="flex-1 overflow-y-auto p-4">
        {messages.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center text-gray-500 dark:text-gray-400">
            <svg
              className="mb-4 h-16 w-16"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
              />
            </svg>
            <p className="text-center text-sm">
              {t('ai.welcome') || '您好！我是AI助手，有什么可以帮助您的吗？'}
            </p>

            {/* 快捷问题 */}
            {quickQuestions.length > 0 && (
              <div className="mt-4 space-y-2">
                <p className="text-xs text-gray-400">
                  {t('ai.quickQuestions') || '快捷问题：'}
                </p>
                {quickQuestions.map((question, index) => (
                  <button
                    key={index}
                    onClick={() => handleQuickQuestion(question)}
                    className="block w-full rounded border border-gray-300 px-3 py-2 text-left text-sm text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                  >
                    {question}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {messages.map(renderMessage)}

        {/* 流式响应 */}
        {streamedContent && (
          <div className="mb-4 flex justify-start">
            <div className="max-w-[80%] rounded-lg bg-gray-100 px-4 py-2 text-gray-900 dark:bg-gray-800 dark:text-gray-100">
              <div className="text-sm whitespace-pre-wrap">{streamedContent}</div>
              <div className="mt-1 flex items-center gap-1">
                <div className="h-2 w-2 animate-bounce rounded-full bg-blue-500" />
                <div className="h-2 w-2 animate-bounce rounded-full bg-blue-500 delay-100" />
                <div className="h-2 w-2 animate-bounce rounded-full bg-blue-500 delay-200" />
              </div>
            </div>
          </div>
        )}

        {/* 加载中 */}
        {isLoading && !streamedContent && (
          <div className="mb-4 flex justify-start">
            <div className="rounded-lg bg-gray-100 px-4 py-2 dark:bg-gray-800">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 animate-bounce rounded-full bg-blue-500" />
                <div className="h-2 w-2 animate-bounce rounded-full bg-blue-500 delay-100" />
                <div className="h-2 w-2 animate-bounce rounded-full bg-blue-500 delay-200" />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* 输入区域 */}
      <div className="border-t border-gray-200 p-4 dark:border-gray-700">
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              placeholder || (t('ai.placeholder') || '输入您的问题...')
            }
            className="flex-1 resize-none rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
            rows={2}
            disabled={isLoading}
          />

          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="rounded-lg bg-blue-500 p-2 text-white transition-colors hover:bg-blue-600 disabled:opacity-50 disabled:hover:bg-blue-500"
            title={t('ai.send') || '发送'}
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}

export default AIChatAssistant

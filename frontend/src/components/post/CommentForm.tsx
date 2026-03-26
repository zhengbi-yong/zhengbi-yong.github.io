'use client'

import { useState } from 'react'
import { useAuthStore } from '@/lib/store/auth-store'
import { useCommentStore } from '@/lib/store/comment-store'
import { usePostStore } from '@/lib/store/post-store'
import { Button } from '@/components/shadcn/ui/button'
import { Textarea } from '@/components/shadcn/ui/textarea'
import { MessageCircle, Send, LogIn } from 'lucide-react'
import { cn } from '@/components/lib/utils'
import { AuthModal } from '@/components/auth/AuthModal'

interface CommentFormProps {
  slug: string
  className?: string
}

export function CommentForm({ slug, className }: CommentFormProps) {
  const { isAuthenticated } = useAuthStore()
  const { createComment } = useCommentStore()
  const { fetchStats } = usePostStore()

  const [newComment, setNewComment] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!isAuthenticated) {
      setIsAuthModalOpen(true)
      return
    }

    if (!newComment.trim()) {
      return
    }

    setIsSubmitting(true)
    try {
      await createComment(slug, { content: newComment.trim() })
      setNewComment('')
      // Refresh stats
      await fetchStats(slug)
      // Show success message
      alert('评论发表成功！')
    } catch (error) {
      alert('评论发表失败，请重试')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <div className={cn('border rounded-lg bg-white dark:bg-gray-800', className)}>
        <div className="p-4">
          <h3 className="font-semibold mb-3 flex items-center gap-2 text-sm text-gray-900 dark:text-white">
            <MessageCircle className="h-4 w-4" />
            发表评论
          </h3>

          {!isAuthenticated ? (
            <div className="mb-3 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-md text-center">
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                请登录后发表评论
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsAuthModalOpen(true)}
                className="gap-2 text-xs h-8"
              >
                <LogIn className="h-3 w-3" />
                登录 / 注册
              </Button>
            </div>
          ) : null}

          <form onSubmit={handleSubmitComment} className="space-y-2">
            <Textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="写下你的评论..."
              rows={4}
              disabled={!isAuthenticated || isSubmitting}
              className="min-h-[100px] resize-y"
            />
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {newComment.length} / 2000
              </span>
              <Button
                type="submit"
                size="sm"
                disabled={!isAuthenticated || !newComment.trim() || isSubmitting}
                className="gap-2 text-xs h-8"
              >
                <Send className="h-3 w-3" />
                {isSubmitting ? '发送中...' : '发送'}
              </Button>
            </div>
          </form>
        </div>
      </div>

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
    </>
  )
}

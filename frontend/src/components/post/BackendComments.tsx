'use client'

import { useEffect, useState } from 'react'
import { useAuthStore } from '@/lib/store/auth-store'
import { useCommentStore } from '@/lib/store/comment-store'
import { usePostStore } from '@/lib/store/post-store'
import { Button } from '@/components/shadcn/ui/button'
import { MessageCircle, ThumbsUp, Send, LogIn } from 'lucide-react'
import { cn } from '@/components/lib/utils'
import { AuthModal } from '@/components/auth/AuthModal'
import { AppError } from '@/lib/error-handler'

interface BackendCommentsProps {
  slug: string
  className?: string
}

export function BackendComments({ slug, className }: BackendCommentsProps) {
  const { isAuthenticated } = useAuthStore()
  const {
    fetchComments,
    createComment,
    likeComment,
    getComments,
    getCommentsLoading,
    getCommentsError,
    hasMore,
    isCommentLiked,
  } = useCommentStore()
  const { fetchStats } = usePostStore()

  const [newComment, setNewComment] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)

  const comments = getComments(slug)
  const loading = getCommentsLoading(slug)
  const error = getCommentsError(slug)

  useEffect(() => {
    fetchComments(slug)
  }, [slug, fetchComments])

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
      // Refresh comments list and stats
      await fetchComments(slug)
      await fetchStats(slug)
    } catch (error) {
      // Error is handled by store
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleLikeComment = async (commentId: string) => {
    if (!isAuthenticated) {
      setIsAuthModalOpen(true)
      return
    }

    try {
      await likeComment(commentId)
    } catch (error) {
      if (error instanceof AppError && error.statusCode === 401) {
        setIsAuthModalOpen(true)
      }
    }
  }

  const handleLoadMore = () => {
    const cursor = comments.length > 0 ? comments[comments.length - 1].id : undefined
    fetchComments(slug, cursor)
  }

  return (
    <>
      <div className={cn('space-y-6', className)}>
        {/* Comment Form */}
        <div className="border rounded-lg p-4 bg-card">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            发表评论
          </h3>

          {!isAuthenticated && (
            <div className="mb-4 p-4 bg-muted/50 rounded-md text-center">
              <p className="text-muted-foreground mb-3">
                请登录后发表评论
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsAuthModalOpen(true)}
                className="gap-2"
              >
                <LogIn className="h-4 w-4" />
                登录 / 注册
              </Button>
            </div>
          )}

          <form onSubmit={handleSubmitComment} className="space-y-3">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="写下你的评论..."
              rows={3}
              disabled={!isAuthenticated || isSubmitting}
              className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 resize-y"
            />
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground">
                {newComment.length} / 2000 字符
              </span>
              <Button
                type="submit"
                size="sm"
                disabled={!isAuthenticated || !newComment.trim() || isSubmitting}
                className="gap-2"
              >
                <Send className="h-4 w-4" />
                {isSubmitting ? '发送中...' : '发送评论'}
              </Button>
            </div>
          </form>

          {error && (
            <div className="mt-3 text-sm text-destructive">
              {error}
            </div>
          )}
        </div>

        {/* Comments List */}
        <div className="space-y-4">
          <h3 className="font-semibold flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            评论 ({comments.length})
          </h3>

          {loading && comments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              加载评论中...
            </div>
          ) : comments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground border rounded-lg border-dashed">
              暂无评论，快来抢沙发吧！
            </div>
          ) : (
            <>
              <div className="space-y-4">
                {comments.map((comment) => (
                  <div
                    key={comment.id}
                    className="border rounded-lg p-4 bg-card space-y-3"
                  >
                    {/* Comment Header */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-sm font-semibold text-primary">
                            {comment.user.username.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <div className="font-medium text-sm">
                            {comment.user.username}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(comment.created_at).toLocaleDateString('zh-CN', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Comment Content */}
                    <div
                      className="text-sm leading-relaxed"
                      dangerouslySetInnerHTML={{ __html: comment.html_sanitized }}
                    />

                    {/* Comment Actions */}
                    <div className="flex items-center gap-3 pt-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleLikeComment(comment.id)}
                        className={cn(
                          'gap-1.5 h-8',
                          isCommentLiked(comment.id) && 'text-pink-500'
                        )}
                      >
                        <ThumbsUp
                          className={cn(
                            'h-4 w-4',
                            isCommentLiked(comment.id) && 'fill-current'
                          )}
                        />
                        <span className="text-xs">
                          {comment.like_count > 0 ? comment.like_count : '赞'}
                        </span>
                      </Button>
                    </div>

                    {/* Nested Replies */}
                    {comment.replies && comment.replies.length > 0 && (
                      <div className="ml-4 mt-3 space-y-3 pl-4 border-l-2 border-muted">
                        {comment.replies.map((reply) => (
                          <div key={reply.id} className="space-y-2">
                            <div className="flex items-center gap-2">
                              <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center">
                                <span className="text-xs font-semibold text-primary">
                                  {reply.user.username.charAt(0).toUpperCase()}
                                </span>
                              </div>
                              <div>
                                <div className="font-medium text-xs">
                                  {reply.user.username}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {new Date(reply.created_at).toLocaleDateString('zh-CN', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric',
                                  })}
                                </div>
                              </div>
                            </div>
                            <div
                              className="text-xs leading-relaxed"
                              dangerouslySetInnerHTML={{ __html: reply.html_sanitized }}
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Load More Button */}
              {hasMore(slug) && (
                <div className="text-center">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleLoadMore}
                    disabled={loading}
                  >
                    {loading ? '加载中...' : '加载更多评论'}
                  </Button>
                </div>
              )}
            </>
          )}
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

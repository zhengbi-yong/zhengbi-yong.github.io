'use client'

import { useEffect } from 'react'
import { useCommentStore, useAuthStore } from '@/lib/store'
import { Button } from '@/components/shadcn/ui/button'
import { ThumbsUp, MessageCircle } from 'lucide-react'
import { cn } from '@/components/lib/utils'
import { AuthModal } from '@/components/auth/AuthModal'

interface CommentListSimpleProps {
  slug: string
  className?: string
}

export function CommentListSimple({ slug, className }: CommentListSimpleProps) {
  const { isAuthenticated } = useAuthStore()
  const {
    fetchComments,
    likeComment,
    getComments,
    getCommentsLoading,
    hasMore,
    isCommentLiked,
  } = useCommentStore()

  const comments = getComments(slug)
  const loading = getCommentsLoading(slug)

  useEffect(() => {
    fetchComments(slug)
  }, [slug, fetchComments])

  const handleLikeComment = async (commentId: string) => {
    if (!isAuthenticated) {
      return // Silently ignore for now
    }

    try {
      await likeComment(commentId)
    } catch (error) {
      // Error handled silently
    }
  }

  const handleLoadMore = () => {
    const cursor = comments.length > 0 ? comments[comments.length - 1].id : undefined
    fetchComments(slug, cursor)
  }

  return (
    <>
      <div className={cn('border rounded-lg bg-white dark:bg-gray-800', className)}>
        <div className="p-4">
          <h3 className="font-semibold mb-3 flex items-center gap-2 text-sm text-gray-900 dark:text-white">
            <MessageCircle className="h-4 w-4" />
            最新评论 ({comments.length})
          </h3>

          {loading && comments.length === 0 ? (
            <div className="text-center py-6 text-xs text-gray-500 dark:text-gray-400">
              加载中...
            </div>
          ) : comments.length === 0 ? (
            <div className="text-center py-6 text-xs text-gray-500 dark:text-gray-400 border border-dashed rounded">
              暂无评论
            </div>
          ) : (
            <div className="space-y-3 max-h-[calc(50vh-8rem)] overflow-y-auto pr-2 [scrollbar-width:thin] [scrollbar-color:transparent_transparent] hover:[scrollbar-color:rgb(209_213_219)_transparent] dark:hover:[scrollbar-color:rgb(75_85_99)_transparent]">
              {comments.slice(0, 5).map((comment) => (
                <div
                  key={comment.id}
                  className="border-b border-gray-100 dark:border-gray-700 pb-3 last:border-0 last:pb-0"
                >
                  {/* Comment Header */}
                  <div className="flex items-center gap-2 mb-2">
                    <div className="h-6 w-6 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                        {comment.user.username.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-xs text-gray-900 dark:text-white truncate">
                        {comment.user.username}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(comment.created_at).toLocaleDateString('zh-CN', {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Comment Content */}
                  <div
                    className="text-xs leading-relaxed text-gray-700 dark:text-gray-300 line-clamp-3"
                    dangerouslySetInnerHTML={{ __html: comment.html_sanitized }}
                  />

                  {/* Comment Actions */}
                  <div className="flex items-center gap-2 mt-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleLikeComment(comment.id)}
                      className={cn(
                        'gap-1 h-6 px-2',
                        isCommentLiked(comment.id) && 'text-pink-500'
                      )}
                    >
                      <ThumbsUp
                        className={cn(
                          'h-3 w-3',
                          isCommentLiked(comment.id) && 'fill-current'
                        )}
                      />
                      <span className="text-xs">
                        {comment.like_count > 0 ? comment.like_count : '赞'}
                      </span>
                    </Button>
                  </div>
                </div>
              ))}

              {/* Load More / View All */}
              {comments.length > 5 || hasMore(slug) ? (
                <div className="pt-2 text-center">
                  <button
                    onClick={() => document.querySelector('#comments-section')?.scrollIntoView({ behavior: 'smooth' })}
                    className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    查看全部评论 ↓
                  </button>
                </div>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </>
  )
}

'use client'

import { Comments as CommentsComponent } from 'pliny/comments'
import { memo, useState } from 'react'
import siteMetadata from '@/data/siteMetadata'

const Comments = memo(function Comments({ slug }: { slug: string }) {
  const [loadComments, setLoadComments] = useState(false)

  if (!siteMetadata.comments?.provider) {
    return null
  }

  // Check if Giscus is properly configured
  if (siteMetadata.comments.provider === 'giscus') {
    const { repo, repositoryId, category, categoryId } = siteMetadata.comments.giscusConfig
    if (!repo || !repositoryId || !category || !categoryId) {
      // Giscus not configured - show a helpful message instead of loading button
      return (
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800 dark:border-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-200">
          <p className="font-semibold">评论功能未配置</p>
          <p className="mt-1">
            评论系统需要配置 Giscus 才能使用。请在 .env.local 中配置以下环境变量：
          </p>
          <ul className="mt-2 list-inside list-disc space-y-1 text-xs">
            <li>NEXT_PUBLIC_GISCUS_REPO</li>
            <li>NEXT_PUBLIC_GISCUS_REPOSITORY_ID</li>
            <li>NEXT_PUBLIC_GISCUS_CATEGORY</li>
            <li>NEXT_PUBLIC_GISCUS_CATEGORY_ID</li>
          </ul>
          <p className="mt-2 text-xs">
            访问{' '}
            <a
              href="https://giscus.app"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-yellow-600 dark:hover:text-yellow-300"
            >
              https://giscus.app
            </a>{' '}
            获取配置信息。
          </p>
        </div>
      )
    }
  }

  return (
    <>
      {loadComments ? (
        <CommentsComponent commentsConfig={siteMetadata.comments} slug={slug} />
      ) : (
        <button
          onClick={() => setLoadComments(true)}
          className="rounded-lg bg-primary-600 px-4 py-2 text-white transition-colors hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-600"
        >
          加载评论
        </button>
      )}
    </>
  )
})

Comments.displayName = 'Comments'

export default Comments

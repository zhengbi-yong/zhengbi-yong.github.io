'use client'

import { Comments as CommentsComponent } from 'pliny/comments'
import { memo, useState } from 'react'
import siteMetadata from '@/data/siteMetadata'

const Comments = memo(function Comments({ slug }: { slug: string }) {
  const [loadComments, setLoadComments] = useState(false)

  if (!siteMetadata.comments?.provider) {
    return null
  }
  return (
    <>
      {loadComments ? (
        <CommentsComponent commentsConfig={siteMetadata.comments} slug={slug} />
      ) : (
        <button onClick={() => setLoadComments(true)}>Load Comments</button>
      )}
    </>
  )
})

Comments.displayName = 'Comments'

export default Comments

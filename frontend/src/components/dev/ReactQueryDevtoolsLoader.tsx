'use client'

import { useEffect, useState } from 'react'

type ReactQueryDevtoolsComponent =
  typeof import('@tanstack/react-query-devtools')['ReactQueryDevtools']

export default function ReactQueryDevtoolsLoader() {
  const [Devtools, setDevtools] = useState<ReactQueryDevtoolsComponent | null>(null)

  useEffect(() => {
    const shouldEnable =
      process.env.NODE_ENV === 'development' &&
      process.env.NEXT_PUBLIC_ENABLE_QUERY_DEVTOOLS === 'true'

    if (!shouldEnable) {
      return undefined
    }

    let cancelled = false

    import('@tanstack/react-query-devtools')
      .then((mod) => {
        if (!cancelled) {
          setDevtools(() => mod.ReactQueryDevtools)
        }
      })
      .catch((error) => {
        console.warn(
          '[ReactQueryDevtoolsLoader] Skipping devtools because they failed to load.',
          error
        )
      })

    return () => {
      cancelled = true
    }
  }, [])

  if (!Devtools) {
    return null
  }

  return <Devtools initialIsOpen={false} />
}

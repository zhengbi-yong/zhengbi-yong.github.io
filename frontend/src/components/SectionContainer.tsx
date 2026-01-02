import { ReactNode } from 'react'

interface Props {
  children: ReactNode
}

export default function SectionContainer({ children }: Props) {
  return (
    // 移除了 max-w-3xl, mx-auto, 和 xl:max-w-5xl
    // 仅保留了响应式的水平内边距 (px-4, sm:px-6, xl:px-0)
    <section className="px-4 sm:px-6 xl:px-8">{children}</section>
    // 注意：我将 xl:px-0 更改为 xl:px-8，以确保即使在大屏上，内容也有一点边距，
    // 防止内容完全贴边，如果需要完全贴边，可以改回 xl:px-0
  )
}

'use client'

import Image from '@/components/Image'
import { cn } from '@/components/lib/utils'

interface Tool {
  icon: string
  alt?: string
  width?: number
  href?: string
}

interface ToolsCardProps {
  backgroundImage?: string
  iconBackgroundImage?: string
  tools?: Tool[]
  spinBarImage?: string
  spinIcons?: string[]
  className?: string
}

/**
 * ToolsCard - 工具卡片组件
 * 参考 Astro 项目的 Tools 组件
 * 显示工具图标网格和底部旋转动画条
 */
export default function ToolsCard({
  backgroundImage = '/assets/tools/deck.png',
  iconBackgroundImage = '/assets/tools/tool-icon-bg.png',
  tools = [],
  spinBarImage = '/assets/tools/spin-bar.svg',
  spinIcons = [],
  className = '',
}: ToolsCardProps) {
  // 默认工具列表（如果没有提供）
  const defaultTools: Tool[] = [
    { icon: '/assets/tools/logo/tool-ricoog.svg', alt: 'Rico OG', width: 24 },
    { icon: '/assets/tools/logo/tool-gradienthub.svg', alt: 'Gradient Hub', width: 22 },
    { icon: '/assets/tools/logo/tool-uiuxdeck.svg', alt: 'UI/UX Deck', width: 20 },
    { icon: '/assets/tools/logo/tool-inspoweb.png', alt: 'Inspo Web', width: 20 },
    { icon: '/assets/tools/logo/tool-todo.png', alt: 'Todo', width: 24 },
    { icon: '/assets/tools/logo/ricoui.png', alt: 'Rico UI', width: 26 },
  ]

  const finalTools = tools.length > 0 ? tools : defaultTools
  const finalSpinIcons =
    spinIcons.length > 0
      ? spinIcons
      : [
          '/assets/tools/spin.png',
          '/assets/tools/spin.png',
          '/assets/tools/spin.png',
          '/assets/tools/spin.png',
        ]

  return (
    <div
      className={cn(
        'relative flex h-[180px] w-[198px] items-start justify-center overflow-hidden rounded-3xl',
        className
      )}
      style={{
        backgroundImage: `url(${backgroundImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* 工具图标容器 */}
      <div className="tools-container relative m-auto mt-[28px]">
        <div className="tools-list grid grid-cols-4 gap-[12px]">
          {finalTools.map((tool, index) => (
            <div
              key={index}
              className="tool-item relative flex h-[32px] w-[32px] items-center justify-center"
              style={{
                backgroundImage: `url(${iconBackgroundImage})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            >
              {tool.icon && (
                <Image
                  src={tool.icon}
                  alt={tool.alt || `Tool ${index + 1}`}
                  width={tool.width || 24}
                  height={tool.width || 24}
                  className="transition-opacity duration-300 ease-in-out"
                />
              )}
            </div>
          ))}
          {/* 填充空白位置（如果工具数量不足8个） */}
          {Array.from({ length: Math.max(0, 8 - finalTools.length) }).map((_, index) => (
            <div
              key={`empty-${index}`}
              className="tool-item relative flex h-[32px] w-[32px] items-center justify-center"
              style={{
                backgroundImage: `url(${iconBackgroundImage})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            />
          ))}
        </div>
      </div>

      {/* 底部旋转动画条 */}
      <div
        className="bar absolute right-[18px] bottom-[24px] left-[18px] flex h-[39px] w-[calc(100%-36px)] items-center justify-center overflow-hidden rounded-[10px] bg-cover"
        style={{
          backgroundImage: `url(${spinBarImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="bar-spin-inner border-box absolute m-auto flex h-full w-auto items-center justify-center gap-2 overflow-hidden p-0">
          {finalSpinIcons.map((icon, index) => (
            <Image
              key={index}
              src={icon}
              alt=""
              width={24}
              height={24}
              className="spin h-[72%] w-auto cursor-pointer object-cover"
            />
          ))}
        </div>
      </div>
    </div>
  )
}

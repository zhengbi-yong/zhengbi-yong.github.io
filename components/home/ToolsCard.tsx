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
  backgroundImage = '/static/images/tools/deck.png',
  iconBackgroundImage = '/static/images/tools/tool-icon-bg.png',
  tools = [],
  spinBarImage = '/static/images/tools/spin-bar.svg',
  spinIcons = [],
  className = '',
}: ToolsCardProps) {
  // 默认工具列表（如果没有提供）
  const defaultTools: Tool[] = [
    { icon: '/static/images/tools/logo/tool-ricoog.svg', alt: 'Rico OG', width: 24 },
    { icon: '/static/images/tools/logo/tool-gradienthub.svg', alt: 'Gradient Hub', width: 22 },
    { icon: '/static/images/tools/logo/tool-uiuxdeck.svg', alt: 'UI/UX Deck', width: 20 },
    { icon: '/static/images/tools/logo/tool-inspoweb.png', alt: 'Inspo Web', width: 20 },
    { icon: '/static/images/tools/logo/tool-todo.png', alt: 'Todo', width: 24 },
    { icon: '/static/images/tools/logo/ricoui.png', alt: 'Rico UI', width: 26 },
  ]

  const finalTools = tools.length > 0 ? tools : defaultTools
  const finalSpinIcons =
    spinIcons.length > 0 ? spinIcons : ['/static/images/tools/spin.png', '/static/images/tools/spin.png', '/static/images/tools/spin.png', '/static/images/tools/spin.png']

  return (
    <div
      className={cn(
        'relative w-[198px] h-[180px] overflow-hidden rounded-3xl flex items-start justify-center',
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
              className="relative tool-item w-[32px] h-[32px] flex items-center justify-center"
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
              className="relative tool-item w-[32px] h-[32px] flex items-center justify-center"
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
        className="bar absolute bottom-[24px] left-[18px] right-[18px] bg-cover w-[calc(100%-36px)] h-[39px] flex items-center justify-center overflow-hidden rounded-[10px]"
        style={{
          backgroundImage: `url(${spinBarImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute bar-spin-inner w-auto h-full border-box overflow-hidden flex items-center justify-center gap-2 p-0 m-auto">
          {finalSpinIcons.map((icon, index) => (
            <Image
              key={index}
              src={icon}
              alt=""
              width={24}
              height={24}
              className="spin object-cover w-auto h-[72%] cursor-pointer"
            />
          ))}
        </div>
      </div>

    </div>
  )
}


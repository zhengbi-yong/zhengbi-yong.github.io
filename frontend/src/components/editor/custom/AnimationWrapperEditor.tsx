'use client'

import React from 'react'
import type { CustomComponentEditorProps } from '../CustomComponentBlock'

/**
 * Editor for animation wrapper components (FadeIn, SlideIn, ScaleIn, BounceIn).
 * Shows the nested children as a decorated container.
 */
export const AnimationWrapperEditor: React.FC<CustomComponentEditorProps> = ({
  block,
  updateAttr,
}) => {
  const name = block.props?.componentName || 'Animation'
  const attrs = block.props?.attributes || {}
  const children = block.props?.children || []
  const direction = attrs.direction || ''

  const emojiMap: Record<string, string> = {
    FadeIn: '🌅',
    SlideIn: '🛝',
    ScaleIn: '🔍',
    BounceIn: '🏀',
  }

  return (
    <div
      className="custom-block-wrapper border-2 border-dashed border-purple-300 dark:border-purple-700 
                  rounded-lg p-3 my-2 bg-purple-50 dark:bg-purple-900/20"
      contentEditable={false}
    >
      <div className="flex items-center gap-2 mb-2">
        <span className="text-sm font-semibold text-purple-600 dark:text-purple-400">
          {emojiMap[name] || '🎬'} {name}
        </span>
        {direction && (
          <span className="text-xs bg-purple-200 dark:bg-purple-800 px-2 py-0.5 rounded-full">
            {direction}
          </span>
        )}
        <span className="text-xs text-gray-400">
          ({children.length} nested block{children.length !== 1 ? 's' : ''})
        </span>
      </div>

      {direction && (
        <div className="mb-2">
          <label className="text-xs font-mono text-gray-500 mb-1 block">
            direction
          </label>
          <select
            className="text-xs font-mono p-1.5 rounded border border-gray-200 
                       dark:border-gray-600 bg-white dark:bg-gray-900"
            value={direction}
            onChange={(e) => updateAttr('direction', e.target.value)}
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <option value="left">left</option>
            <option value="right">right</option>
            <option value="up">up</option>
            <option value="down">down</option>
          </select>
        </div>
      )}

      {children.length > 0 && (
        <div className="border-t border-purple-200 dark:border-purple-700 pt-2 mt-2">
          <div className="text-xs text-gray-500 italic mb-1">
            Nested blocks (positioned below this wrapper in output):
          </div>
          {children.map((child: any, idx: number) => (
            <div
              key={child.id || idx}
              className="text-xs font-mono text-purple-600 dark:text-purple-400 bg-white/50 
                         dark:bg-gray-800/50 rounded px-2 py-1 mb-1"
            >
              📦 {child.props?.componentName || child.type || 'block'}
            </div>
          ))}
        </div>
      )}

      {children.length === 0 && (
        <div className="text-xs text-gray-400 italic">
          (no nested content — empty animation wrapper)
        </div>
      )}
    </div>
  )
}

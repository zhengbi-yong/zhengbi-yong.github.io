'use client'

import React from 'react'
import type { CustomComponentEditorProps } from '../CustomComponentBlock'

/**
 * Editor for BilibiliVideo — simple bvid input with preview thumbnail.
 */
export const BilibiliVideoEditor: React.FC<CustomComponentEditorProps> = ({
  block,
  updateAttr,
}) => {
  let bvid = ''
  try { bvid = JSON.parse((block.props as any)?.attributesJson || '{}').bvid || '' } catch {}

  return (
    <div
      className="custom-block-wrapper border border-dashed border-pink-300 dark:border-pink-700 
                  rounded-lg p-3 my-2 bg-pink-50 dark:bg-pink-900/20"
      contentEditable={false}
    >
      <div className="flex items-center gap-2 mb-2">
        <span className="text-sm font-semibold text-pink-600 dark:text-pink-400">
          📺 Bilibili Video
        </span>
      </div>

      <div>
        <label className="text-xs font-mono text-gray-500 mb-1 block">
          BV ID
        </label>
        <input
          type="text"
          className="w-full text-sm font-mono p-2 rounded border border-gray-200 
                     dark:border-gray-600 bg-white dark:bg-gray-900 
                     text-gray-800 dark:text-gray-200
                     focus:outline-none focus:ring-2 focus:ring-pink-400"
          value={bvid}
          onChange={(e) => updateAttr('bvid', e.target.value)}
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          placeholder="BV1GJ411x7h7"
          spellCheck={false}
        />
        {bvid && (
          <div className="mt-2 text-xs text-gray-400">
            预览：https://www.bilibili.com/video/{bvid}
          </div>
        )}
      </div>
    </div>
  )
}

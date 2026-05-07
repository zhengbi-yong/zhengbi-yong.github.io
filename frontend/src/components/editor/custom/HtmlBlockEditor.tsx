'use client'

import React from 'react'
import type { CustomComponentEditorProps } from '../CustomComponentBlock'

/**
 * Editor for HtmlBlock — raw HTML content.
 * Shows a code editor with syntax-aware styling.
 */
export const HtmlBlockEditor: React.FC<CustomComponentEditorProps> = ({
  block,
  updateAttr,
}) => {
  const html = block.props?.attributes?.html || ''

  return (
    <div
      className="custom-block-wrapper border border-dashed border-orange-300 dark:border-orange-700 
                  rounded-lg p-3 my-2 bg-orange-50 dark:bg-orange-900/20"
      contentEditable={false}
    >
      <div className="flex items-center gap-2 mb-2">
        <span className="text-sm font-semibold text-orange-600 dark:text-orange-400">
          🔧 HTML Block
        </span>
        <span className="text-xs text-gray-400">
          ({html.length} chars)
        </span>
      </div>
      <textarea
        className="w-full text-xs font-mono p-3 rounded border border-gray-200 
                   dark:border-gray-600 bg-white dark:bg-gray-900 
                   text-gray-800 dark:text-gray-200 resize-y
                   focus:outline-none focus:ring-2 focus:ring-orange-400"
        rows={Math.min(12, Math.max(3, html.split('\n').length))}
        value={html}
        onChange={(e) => updateAttr('html', e.target.value)}
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
        spellCheck={false}
      />
    </div>
  )
}

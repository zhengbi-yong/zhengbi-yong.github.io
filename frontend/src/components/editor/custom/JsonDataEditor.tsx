'use client'

import React from 'react'
import type { CustomComponentEditorProps } from '../CustomComponentBlock'

/**
 * Editor for JSON data chart components (ECharts, Nivo, AntV).
 * Shows a resizable JSON editor.
 */
export const JsonDataEditor: React.FC<CustomComponentEditorProps> = ({
  block,
  updateAttr,
}) => {
  const name = block.props?.componentName || 'Chart'
  let attrs: Record<string, string> = {}
  try { attrs = JSON.parse((block.props as any)?.attributesJson || '{}') } catch {}

  const iconMap: Record<string, string> = {
    EChartsComponent: '📊',
    NivoBarChart: '📊',
    NivoPieChart: '🥧',
    AntVChart: '📈',
  }

  return (
    <div
      className="custom-block-wrapper border border-dashed border-blue-300 dark:border-blue-700 
                  rounded-lg p-3 my-2 bg-blue-50 dark:bg-blue-900/20"
      contentEditable={false}
    >
      <div className="flex items-center gap-2 mb-2">
        <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
          {iconMap[name] || '📊'} {name}
        </span>
      </div>

      {Object.entries(attrs).map(([key, value]) => {
        const isJson = key === 'data' || key === 'option' || key === 'keys'
        const isLong = (value || '').length > 60 || isJson

        return (
          <div key={key} className="mb-2">
            <label className="text-xs font-mono text-gray-500 mb-1 block">
              {key}
            </label>
            {isLong ? (
              <textarea
                className="w-full text-xs font-mono p-2 rounded border border-gray-200 
                           dark:border-gray-600 bg-white dark:bg-gray-900 
                           text-gray-800 dark:text-gray-200 resize-y
                           focus:outline-none focus:ring-2 focus:ring-blue-400"
                rows={Math.min(10, Math.max(2, Math.ceil((value || '').length / 60)))}
                value={value || ''}
                onChange={(e) => updateAttr(key, e.target.value)}
                onClick={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
                spellCheck={false}
              />
            ) : (
              <input
                type="text"
                className="w-full text-xs font-mono p-1.5 rounded border border-gray-200 
                           dark:border-gray-600 bg-white dark:bg-gray-900 
                           text-gray-800 dark:text-gray-200"
                value={value || ''}
                onChange={(e) => updateAttr(key, e.target.value)}
                onClick={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
              />
            )}
          </div>
        )
      })}

      {Object.keys(attrs).length === 0 && (
        <div className="text-xs text-gray-400 italic">No data configured</div>
      )}
    </div>
  )
}

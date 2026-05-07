'use client'

import React from 'react'
import type { CustomComponentEditorProps } from '../CustomComponentBlock'

/**
 * Editor for SimpleChemicalStructure — XYZ/PDB template literal data.
 */
export const ChemicalStructureEditor: React.FC<CustomComponentEditorProps> = ({
  block,
  updateAttr,
}) => {
  let attrs: Record<string, string> = {}
  try { attrs = JSON.parse((block.props as any)?.attributesJson || '{}') } catch {}
  const data = attrs.data || ''
  const style = attrs.style || 'stick'
  const format = attrs.format || 'xyz'
  const height = attrs.height || '400'

  return (
    <div
      className="custom-block-wrapper border border-dashed border-teal-300 dark:border-teal-700 
                  rounded-lg p-3 my-2 bg-teal-50 dark:bg-teal-900/20"
      contentEditable={false}
    >
      <div className="flex items-center gap-2 mb-2">
        <span className="text-sm font-semibold text-teal-600 dark:text-teal-400">
          🧪 SimpleChemicalStructure
        </span>
      </div>

      <div className="mb-2">
        <label className="text-xs font-mono text-gray-500 mb-1 block">
          Structure Data ({format})
        </label>
        <textarea
          className="w-full text-xs font-mono p-2 rounded border border-gray-200 
                     dark:border-gray-600 bg-white dark:bg-gray-900 
                     text-gray-800 dark:text-gray-200 resize-y
                     focus:outline-none focus:ring-2 focus:ring-teal-400"
          rows={Math.min(10, Math.max(4, (data || '').split('\n').length))}
          value={data}
          onChange={(e) => updateAttr('data', e.target.value)}
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          spellCheck={false}
          placeholder={`3\nWater\nO 0.0000 0.0000 0.0000\nH 0.9500 0.0000 -0.3000\nH -0.9500 0.0000 -0.3000`}
        />
      </div>

      <div className="flex gap-3">
        <div>
          <label className="text-xs font-mono text-gray-500 mb-1 block">Style</label>
          <select
            className="text-xs font-mono p-1.5 rounded border border-gray-200 
                       dark:border-gray-600 bg-white dark:bg-gray-900"
            value={style}
            onChange={(e) => updateAttr('style', e.target.value)}
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <option value="stick">stick</option>
            <option value="sphere">sphere</option>
            <option value="line">line</option>
            <option value="cartoon">cartoon</option>
          </select>
        </div>
        <div>
          <label className="text-xs font-mono text-gray-500 mb-1 block">Format</label>
          <select
            className="text-xs font-mono p-1.5 rounded border border-gray-200 
                       dark:border-gray-600 bg-white dark:bg-gray-900"
            value={format}
            onChange={(e) => updateAttr('format', e.target.value)}
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <option value="xyz">xyz</option>
            <option value="pdb">pdb</option>
            <option value="sdf">sdf</option>
          </select>
        </div>
        <div>
          <label className="text-xs font-mono text-gray-500 mb-1 block">Height</label>
          <input
            type="text"
            className="w-20 text-xs font-mono p-1.5 rounded border border-gray-200 
                       dark:border-gray-600 bg-white dark:bg-gray-900"
            value={height}
            onChange={(e) => updateAttr('height', e.target.value)}
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
          />
        </div>
      </div>
    </div>
  )
}

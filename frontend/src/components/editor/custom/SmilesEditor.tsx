'use client'

import React from 'react'
import type { CustomComponentEditorProps } from '../CustomComponentBlock'

/**
 * Editor for RDKitStructure and MoleculeFingerprint — SMILES string input.
 */
export const SmilesEditor: React.FC<CustomComponentEditorProps> = ({
  block,
  updateAttr,
}) => {
  const name = block.props?.componentName || 'Chemistry'
  const attrs = block.props?.attributes || {}
  const smiles = attrs.data || ''
  const width = attrs.width || '400'
  const height = attrs.height || (name === 'MoleculeFingerprint' ? '80' : '300')

  return (
    <div
      className="custom-block-wrapper border border-dashed border-green-300 dark:border-green-700 
                  rounded-lg p-3 my-2 bg-green-50 dark:bg-green-900/20"
      contentEditable={false}
    >
      <div className="flex items-center gap-2 mb-2">
        <span className="text-sm font-semibold text-green-600 dark:text-green-400">
          {name === 'MoleculeFingerprint' ? '🖐️' : '⚛️'} {name}
        </span>
      </div>

      <div className="mb-2">
        <label className="text-xs font-mono text-gray-500 mb-1 block">
          SMILES
        </label>
        <input
          type="text"
          className="w-full text-sm font-mono p-2 rounded border border-gray-200 
                     dark:border-gray-600 bg-white dark:bg-gray-900 
                     text-gray-800 dark:text-gray-200
                     focus:outline-none focus:ring-2 focus:ring-green-400"
          value={smiles}
          onChange={(e) => updateAttr('data', e.target.value)}
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          placeholder="e.g. CN1C=NC2=C1C(=O)N(C(=O)N2C)C"
          spellCheck={false}
        />
      </div>

      <div className="flex gap-3">
        <div className="flex-1">
          <label className="text-xs font-mono text-gray-500 mb-1 block">
            Width
          </label>
          <input
            type="text"
            className="w-full text-xs font-mono p-1.5 rounded border border-gray-200 
                       dark:border-gray-600 bg-white dark:bg-gray-900"
            value={width}
            onChange={(e) => updateAttr('width', e.target.value)}
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
          />
        </div>
        <div className="flex-1">
          <label className="text-xs font-mono text-gray-500 mb-1 block">
            Height
          </label>
          <input
            type="text"
            className="w-full text-xs font-mono p-1.5 rounded border border-gray-200 
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

'use client'

import React from 'react'
import type { FC } from 'react'
import { createReactBlockSpec } from '@blocknote/react'
import type { BlockNoteEditor, BlockNoDefaults } from '@blocknote/core'
import type { ReactCustomBlockRenderProps } from '@blocknote/react'

// ── Prop schema for all customComponent blocks ────────────────────────────────
// To preserve attributes and children through BlockNote's prop system,
// store them as JSON strings. The migration step in migrateLegacyBlocks
// handles conversion. Editor components parse them back as needed.
export const customComponentPropSchema = {
  componentName: { default: '' },
  attributesJson: { default: '{}' },
  childrenJson: { default: '[]' },
} as const

export type CustomComponentBlock = BlockNoDefaults<
  Record<string, any>,
  any,
  any
> & {
  props: {
    componentName: string
    attributes: Record<string, string>
    children: any[]
  }
}

// ── Editor component registry ────────────────────────────────────────────────
export type CustomComponentEditorProps = {
  block: CustomComponentBlock
  editor: BlockNoteEditor<any, any, any>
  /** Update a single attribute on the block */
  updateAttr: (key: string, value: string) => void
  /** Replace all attributes */
  updateAttrs: (attrs: Record<string, string>) => void
}

export type CustomComponentEditor = FC<CustomComponentEditorProps>

const editorRegistry = new Map<string, CustomComponentEditor>()

export function registerCustomEditor(
  componentName: string,
  editor: CustomComponentEditor
) {
  editorRegistry.set(componentName, editor)
}

export function getCustomEditor(
  componentName: string
): CustomComponentEditor | undefined {
  return editorRegistry.get(componentName)
}

// ── Default fallback editor ──────────────────────────────────────────────────
const DefaultCustomEditor: CustomComponentEditor = ({ block, updateAttr }) => {
  const name = block.props?.componentName || 'Unknown'
  // Parse attributes from JSON string (migrated format)
  let attrs: Record<string, string> = {}
  try {
    attrs = JSON.parse((block.props as any)?.attributesJson || '{}')
  } catch { /* keep empty */ }
  const attrKeys = Object.keys(attrs)

  return (
    <div
      className="custom-block-wrapper border border-dashed border-gray-300 dark:border-gray-600 
                  rounded-lg p-3 my-2 bg-gray-50 dark:bg-gray-800/50"
      contentEditable={false}
    >
      <div className="flex items-center gap-2 mb-2">
        <span className="text-sm font-semibold text-gray-500 dark:text-gray-400">
          📦 {name}
        </span>
        <span className="text-xs text-gray-400">
          ({attrKeys.length} props)
        </span>
      </div>

      {attrKeys.length > 0 && (
        <div className="space-y-2">
          {attrKeys.map((key) => {
            const value = attrs[key] || ''
            const isLong = value.length > 100
            return (
              <div key={key} className="flex flex-col gap-1">
                <label className="text-xs font-mono text-gray-500">{key}</label>
                {isLong ? (
                  <textarea
                    className="w-full text-xs font-mono p-2 rounded border border-gray-200 
                               dark:border-gray-600 bg-white dark:bg-gray-900 
                               text-gray-800 dark:text-gray-200 resize-y"
                    rows={Math.min(8, Math.ceil(value.length / 60))}
                    value={value}
                    onChange={(e) => updateAttr(key, e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    onMouseDown={(e) => e.stopPropagation()}
                  />
                ) : (
                  <input
                    type="text"
                    className="w-full text-xs font-mono p-1.5 rounded border border-gray-200 
                               dark:border-gray-600 bg-white dark:bg-gray-900 
                               text-gray-800 dark:text-gray-200"
                    value={value}
                    onChange={(e) => updateAttr(key, e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    onMouseDown={(e) => e.stopPropagation()}
                  />
                )}
              </div>
            )
          })}
        </div>
      )}

      {attrKeys.length === 0 && (
        <div className="text-xs text-gray-400 italic">
          (no editable attributes)
        </div>
      )}
    </div>
  )
}

// ── Block spec factory ───────────────────────────────────────────────────────
export function createCustomComponentBlockSpec() {
  return createReactBlockSpec(
    {
      type: 'customComponent' as const,
      propSchema: customComponentPropSchema,
      content: 'none' as const,
    },
    {
      render: ((props: ReactCustomBlockRenderProps<any>) => {
        const block = props.block as unknown as CustomComponentBlock
        const editor = props.editor as BlockNoteEditor<any, any, any>
        const componentName = block.props?.componentName || ''

        const EditorComponent = getCustomEditor(componentName) || DefaultCustomEditor

        const updateAttr = (key: string, value: string) => {
          const currentAttrs = JSON.parse((block.props as any)?.attributesJson || '{}')
          currentAttrs[key] = value
          editor.updateBlock(block, {
            props: {
              ...block.props,
              attributesJson: JSON.stringify(currentAttrs),
            },
          } as any)
        }

        const updateAttrs = (attrs: Record<string, string>) => {
          editor.updateBlock(block, {
            props: {
              ...block.props,
              attributesJson: JSON.stringify(attrs),
            },
          } as any)
        }

        return (
          <EditorComponent
            block={block}
            editor={editor}
            updateAttr={updateAttr}
            updateAttrs={updateAttrs}
          />
        )
      }) as any,
    }
  )
}

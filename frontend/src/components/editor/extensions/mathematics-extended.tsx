/**
 * Mathematics extensions with React NodeViews for live KaTeX rendering in the editor.
 * BlockMath and InlineMath from @tiptap/extension-mathematics do NOT include NodeViews by default.
 * We extend them here to register our MathNodeView component.
 */
import { BlockMath as TiptapBlockMath } from '@tiptap/extension-mathematics'
import { InlineMath as TiptapInlineMath } from '@tiptap/extension-mathematics'
import { ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react'
import { MathNodeView } from './math-node-view'

/** BlockMath with React NodeView for live KaTeX rendering */
export const BlockMath = (TiptapBlockMath as any).extend({
  // TipTap 3.x uses addNodeView (singular) — returns renderer directly, not array
  addNodeView() {
    return ReactNodeViewRenderer((props: any) => (
      <NodeViewWrapper as="div" className="tiptap-mathematics-render--block">
        <MathNodeView {...props} />
      </NodeViewWrapper>
    ))
  },
}).configure({
  HTMLAttributes: { class: 'tiptap-mathematics-render--block' },
})

/** InlineMath with React NodeView for live KaTeX rendering */
export const InlineMath = (TiptapInlineMath as any).extend({
  // TipTap 3.x uses addNodeView (singular) — returns renderer directly, not array
  addNodeView() {
    return ReactNodeViewRenderer((props: any) => (
      <NodeViewWrapper as="span" className="tiptap-mathematics-render--inline">
        <MathNodeView {...props} />
      </NodeViewWrapper>
    ))
  },
}).configure({
  HTMLAttributes: { class: 'tiptap-mathematics-render--inline' },
})

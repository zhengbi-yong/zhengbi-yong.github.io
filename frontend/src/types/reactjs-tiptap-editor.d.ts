/**
 * TypeScript declarations for reactjs-tiptap-editor subpaths
 *
 * The package's index.d.ts only exports RichTextProvider.
 * All other components are exported via subpaths (e.g., /bold, /history)
 * which don't have .d.ts files. This file provides those declarations.
 *
 * Auto-generated from package introspection — reflects reactjs-tiptap-editor@1.0.22
 */

declare module 'reactjs-tiptap-editor' {
  import type { Editor } from '@tiptap/react'
  import type { ComponentType, ReactNode } from 'react'

  export interface RichTextProviderProps {
    editor: Editor | null
    dark?: boolean
    children?: ReactNode
  }

  export const RichTextProvider: ComponentType<RichTextProviderProps>
}

// ===== RichTextProvider =====
declare module 'reactjs-tiptap-editor/components/RichTextProvider' {
  import type { Editor } from '@tiptap/react'
  import type { ComponentType, ReactNode } from 'react'

  export interface RichTextProviderProps {
    editor: Editor | null
    dark?: boolean
    children?: ReactNode
  }

  export const RichTextProvider: ComponentType<RichTextProviderProps>
}

// ===== Theme =====
declare module 'reactjs-tiptap-editor/theme' {
  export const THEME: Record<string, any>
  export const themeActions: {
    setTheme: (theme: 'light' | 'dark') => void
    setBorderRadius: (radius: string) => void
    setLanguage: (lang: string) => void
  }
  export const useTheme: () => 'light' | 'dark'
}

// ===== SlashCommand =====
declare module 'reactjs-tiptap-editor/slashcommand' {
  import type { ComponentType } from 'react'

  export interface SlashCommandListProps {
    commandList?: any[]
  }

  export const SlashCommandList: ComponentType<SlashCommandListProps>
  export const SlashCommand: any
  export const useFilterCommandList: any
  export const renderCommandListDefault: any
}

// ===== Bubble =====
declare module 'reactjs-tiptap-editor/bubble' {
  import type { ComponentType } from 'react'

  export const RichTextBubbleCallout: ComponentType<Record<string, unknown>>
  export const RichTextBubbleCodeBlock: ComponentType<Record<string, unknown>>
  export const RichTextBubbleColumns: ComponentType<Record<string, unknown>>
  export const RichTextBubbleDrawer: ComponentType<Record<string, unknown>>
  export const RichTextBubbleExcalidraw: ComponentType<Record<string, unknown>>
  export const RichTextBubbleIframe: ComponentType<Record<string, unknown>>
  export const RichTextBubbleImage: ComponentType<Record<string, unknown>>
  export const RichTextBubbleImageGif: ComponentType<Record<string, unknown>>
  export const RichTextBubbleKatex: ComponentType<Record<string, unknown>>
  export const RichTextBubbleLink: ComponentType<Record<string, unknown>>
  export const RichTextBubbleMenuDragHandle: ComponentType<Record<string, unknown>>
  export const RichTextBubbleMermaid: ComponentType<Record<string, unknown>>
  export const RichTextBubbleTable: ComponentType<Record<string, unknown>>
  export const RichTextBubbleText: ComponentType<Record<string, unknown>>
  export const RichTextBubbleTwitter: ComponentType<Record<string, unknown>>
  export const RichTextBubbleVideo: ComponentType<Record<string, unknown>>
}

// ===== Extension subpaths (TipTap extensions + RichText UI components) =====
// Format: reactjs-tiptap-editor/{extension-name}

declare module 'reactjs-tiptap-editor/katex' {
  import type { Node } from '@tiptap/core'
  export interface IKatexAttrs {
    text?: string
    macros?: string
  }
  export interface IKatexOptions {
    HTMLAttributes: Record<string, any>
  }
  export const Katex: Node<IKatexOptions, any>
  export const RichTextKatex: any
}

declare module 'reactjs-tiptap-editor/codeblock' {
  export const CodeBlock: any
  export const RichTextCodeBlock: any
}

declare module 'reactjs-tiptap-editor/history' {
  export const History: any
  export const RichTextRedo: any
  export const RichTextUndo: any
}

declare module 'reactjs-tiptap-editor/bold' {
  export const Bold: any
  export const RichTextBold: any
}

declare module 'reactjs-tiptap-editor/italic' {
  export const Italic: any
  export const RichTextItalic: any
}

declare module 'reactjs-tiptap-editor/strike' {
  export const Strike: any
  export const RichTextStrike: any
}

declare module 'reactjs-tiptap-editor/highlight' {
  export const Highlight: any
  export const RichTextHighlight: any
}

declare module 'reactjs-tiptap-editor/textunderline' {
  export const TextUnderline: any
  export const RichTextUnderline: any
}

declare module 'reactjs-tiptap-editor/blockquote' {
  export const Blockquote: any
  export const RichTextBlockquote: any
}

declare module 'reactjs-tiptap-editor/code' {
  export const Code: any
  export const RichTextCode: any
}

declare module 'reactjs-tiptap-editor/bulletlist' {
  export const BulletList: any
  export const RichTextBulletList: any
}

declare module 'reactjs-tiptap-editor/orderedlist' {
  export const OrderedList: any
  export const RichTextOrderedList: any
}

declare module 'reactjs-tiptap-editor/horizontalrule' {
  export const HorizontalRule: any
  export const RichTextHorizontalRule: any
}

declare module 'reactjs-tiptap-editor/link' {
  export const Link: any
  export const RichTextLink: any
}

declare module 'reactjs-tiptap-editor/image' {
  export const Image: any
  export const DEFAULT_OPTIONS: any
  export const RichTextImage: any
}

declare module 'reactjs-tiptap-editor/video' {
  export const Video: any
  export const RichTextVideo: any
}

declare module 'reactjs-tiptap-editor/imagegif' {
  export const ImageGif: any
  export const RichTextImageGif: any
}

declare module 'reactjs-tiptap-editor/textalign' {
  export const TextAlign: any
  export const RichTextAlign: any
}

declare module 'reactjs-tiptap-editor/textdirection' {
  export const TextDirection: any
  export const RichTextTextDirection: any
}

declare module 'reactjs-tiptap-editor/indent' {
  export const Indent: any
  export const RichTextIndent: any
}

declare module 'reactjs-tiptap-editor/lineheight' {
  export const LineHeight: any
  export const RichTextLineHeight: any
}

declare module 'reactjs-tiptap-editor/tasklist' {
  export const TaskList: any
  export const RichTextTaskList: any
}

declare module 'reactjs-tiptap-editor/table' {
  export const Table: any
  export const RichTextTable: any
}

declare module 'reactjs-tiptap-editor/column' {
  export const Column: any
  export const ColumnNode: any
  export const MultipleColumnNode: any
  export const RichTextColumn: any
}

declare module 'reactjs-tiptap-editor/iframe' {
  export const Iframe: any
  export const RichTextIframe: any
}

declare module 'reactjs-tiptap-editor/drawer' {
  export const Drawer: any
  export const RichTextDrawer: any
}

declare module 'reactjs-tiptap-editor/mermaid' {
  export const Mermaid: any
  export const RichTextMermaid: any
}

declare module 'reactjs-tiptap-editor/excalidraw' {
  export const Excalidraw: any
  export const RichTextExcalidraw: any
}

declare module 'reactjs-tiptap-editor/twitter' {
  export const Twitter: any
  export const RichTextTwitter: any
}

declare module 'reactjs-tiptap-editor/callout' {
  export const Callout: any
  export const RichTextCallout: any
}

declare module 'reactjs-tiptap-editor/codeview' {
  export const CodeView: any
  export const RichTextCodeView: any
}

declare module 'reactjs-tiptap-editor/emoji' {
  export const Emoji: any
  export const EXTENSION_PRIORITY_HIGHEST: number
  export const RichTextEmoji: any
}

declare module 'reactjs-tiptap-editor/fontfamily' {
  export const FontFamily: any
  export const RichTextFontFamily: any
}

declare module 'reactjs-tiptap-editor/fontsize' {
  export const FontSize: any
  export const RichTextFontSize: any
}

declare module 'reactjs-tiptap-editor/heading' {
  export const Heading: any
  export const RichTextHeading: any
}

declare module 'reactjs-tiptap-editor/color' {
  export const Color: any
  export const RichTextColor: any
}

declare module 'reactjs-tiptap-editor/clear' {
  export const Clear: any
  export const RichTextClear: any
}

declare module 'reactjs-tiptap-editor/moremark' {
  export const MoreMark: any
  export const RichTextMoreMark: any
}

declare module 'reactjs-tiptap-editor/searchandreplace' {
  export const SearchAndReplace: any
  export const RichTextSearchAndReplace: any
}

declare module 'reactjs-tiptap-editor/attachment' {
  export const Attachment: any
  export const RichTextAttachment: any
}

declare module 'reactjs-tiptap-editor/exportpdf' {
  export const ExportPdf: any
  export const RichTextExportPdf: any
}

declare module 'reactjs-tiptap-editor/exportword' {
  export const ExportWord: any
  export const RichTextExportWord: any
}

declare module 'reactjs-tiptap-editor/textdirection' {
  export const TextDirection: any
  export const RichTextTextDirection: any
}

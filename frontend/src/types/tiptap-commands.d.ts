/**
 * TipTap Commands Type Augmentation
 *
 * CI 中 @tiptap/extension-bold/italic/strike/heading 的 dist/ 为空，
 * 导致它们的 `declare module '@tiptap/core' { interface Commands { ... } }`
 * 没有被 TypeScript 加载，toggleBold/toggleItalic/toggleStrike/toggleHeading/toggleCode
 * 等命令类型缺失。
 *
 * 此文件手动增强 Commands 接口以解决 CI 类型检查失败。
 */

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    bold: {
      /**
       * Toggle bold text
       */
      toggleBold: () => ReturnType
      /**
       * Set bold
       */
      setBold: () => ReturnType
      /**
       * Unset bold
       */
      unsetBold: () => ReturnType
    }
    italic: {
      /**
       * Toggle italic text
       */
      toggleItalic: () => ReturnType
      /**
       * Set italic
       */
      setItalic: () => ReturnType
      /**
       * Unset italic
       */
      unsetItalic: () => ReturnType
    }
    strike: {
      /**
       * Toggle strike text
       */
      toggleStrike: () => ReturnType
      /**
       * Set strike
       */
      setStrike: () => ReturnType
      /**
       * Unset strike
       */
      unsetStrike: () => ReturnType
    }
    heading: {
      /**
       * Toggle heading
       */
      toggleHeading: (attributes?: { level?: 1 | 2 | 3 | 4 | 5 | 6 }) => ReturnType
      /**
       * Set heading
       */
      setHeading: (attributes?: { level?: 1 | 2 | 3 | 4 | 5 | 6 }) => ReturnType
      /**
       * Unset heading
       */
      unsetHeading: () => ReturnType
    }
  }
}

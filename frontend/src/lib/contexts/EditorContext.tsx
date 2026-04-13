'use client'

/**
 * Editor Context
 *
 * Provides state management for the immersive editor.
 * This is a stub implementation for build compatibility.
 */

import { createContext, useContext, useState, ReactNode } from 'react'

interface EditorContextValue {
  immersiveMode: boolean
  setImmersiveMode: (value: boolean) => void
}

const EditorContext = createContext<EditorContextValue | undefined>(undefined)

export function EditorProvider({ children }: { children: ReactNode }) {
  const [immersiveMode, setImmersiveMode] = useState(false)

  return (
    <EditorContext.Provider value={{ immersiveMode, setImmersiveMode }}>
      {children}
    </EditorContext.Provider>
  )
}

export function useEditorContext(): EditorContextValue {
  const context = useContext(EditorContext)
  if (!context) {
    // Return a default value if not in provider
    return {
      immersiveMode: false,
      setImmersiveMode: () => {},
    }
  }
  return context
}

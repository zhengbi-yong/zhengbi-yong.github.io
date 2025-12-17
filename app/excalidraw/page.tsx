import { ExcalidrawViewer } from '@/components/Excalidraw/ExcalidrawViewer'

export default function ExcalidrawPage() {
  return (
    <ExcalidrawViewer
      height="100vh"
      showToolbar={true}
      showBackButton={true}
      initialData={{ elements: [], appState: {} }}
    />
  )
}

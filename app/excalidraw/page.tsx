import { ExcalidrawViewer } from '@/components/Excalidraw/ExcalidrawViewer'

export default function ExcalidrawPage() {
  return (
    <ExcalidrawViewer
      height="100vh"
      showToolbar={false}
      showBackButton={true}
      initialData={{ elements: [], appState: {} }}
    />
  )
}

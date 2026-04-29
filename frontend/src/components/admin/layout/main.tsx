export function Main({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex-1 overflow-y-auto p-4 lg:p-6">
      {children}
    </main>
  )
}

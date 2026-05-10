import type { ReactNode } from 'react';
import { source } from '@/lib/docs-source';
import Link from 'next/link';

export default async function Layout({ children }: { children: ReactNode }) {
  const pages = source.getPages();
  
  return (
    <div className="flex min-h-screen">
      {/* Simple sidebar */}
      <aside className="w-64 border-r border-border p-4 shrink-0 overflow-y-auto max-h-screen sticky top-0">
        <h2 className="font-semibold text-sm mb-3">📚 Documentation</h2>
        <nav className="space-y-1">
          {pages.map((page) => (
            <Link
              key={page.url}
              href={page.url}
              className="block text-sm text-muted-foreground hover:text-foreground px-2 py-1 rounded-md hover:bg-muted transition-colors"
            >
              {page.data.title}
            </Link>
          ))}
        </nav>
      </aside>
      
      {/* Content */}
      <main className="flex-1 min-w-0 p-8">
        <div className="max-w-3xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}

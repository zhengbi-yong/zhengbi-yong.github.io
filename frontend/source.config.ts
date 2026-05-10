import { defineDocs, defineConfig } from 'fumadocs-mdx/config';

export const docs = defineDocs({
  dir: 'content/docs',
});

export default defineConfig({
  mdxOptions: {
    rehypeCodeOptions: {
      lazy: true,
      fallbackLanguage: 'text',
      onError: (_error: unknown) => {
        // Silently fall back to plain text for unknown languages
      },
    },
  },
});

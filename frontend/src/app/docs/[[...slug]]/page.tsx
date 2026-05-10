import { DocsBody, DocsDescription, DocsTitle } from 'fumadocs-ui/page';
import { notFound } from 'next/navigation';
import { source } from '@/lib/docs-source';

export default async function Page({
  params,
}: {
  params: Promise<{ slug?: string[] }>;
}) {
  const { slug } = await params;
  const path = slug?.join('/') ?? '';

  const page = source.getPage(path ? [path] : []);
  if (!page) notFound();

  const MDX = page.data.body;

  return (
    <>
      <DocsTitle>{page.data.title}</DocsTitle>
      <DocsDescription>{page.data.description}</DocsDescription>
      <DocsBody>
        <MDX />
      </DocsBody>
    </>
  );
}

export function generateStaticParams() {
  return source.generateParams();
}

export async function generateMetadata(props: {
  params: Promise<{ slug?: string[] }>;
}) {
  const { slug } = await props.params;
  const path = slug?.join('/') ?? '';
  const page = source.getPage(path ? [path] : []);
  if (!page) return {};

  return {
    title: page.data.title,
    description: page.data.description,
  };
}

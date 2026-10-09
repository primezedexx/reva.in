import { redirect } from 'next/navigation';

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function StorePassRedirectPage({ params, searchParams }: PageProps) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  const slug = resolvedParams?.slug || '';

  const query = new URLSearchParams();
  if (slug) {
    query.set('store', slug);
  }

  if (resolvedSearchParams) {
    for (const [key, value] of Object.entries(resolvedSearchParams)) {
      if (key !== 'store' && typeof value === 'string') {
        query.set(key, value);
      }
    }
  }

  const destination = query.toString() ? `/c?${query.toString()}` : '/c';
  redirect(destination);
}

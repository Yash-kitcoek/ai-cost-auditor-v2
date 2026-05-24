// app/result/[id]/layout.tsx
// SERVER COMPONENT — can export generateMetadata (unlike page.tsx which is 'use client')

import { Metadata } from 'next';
import { getAudit } from '@/lib/db/supabase';

// ✅ Next.js 15: params is now a Promise
interface Props {
  params: Promise<{ id: string }>;
  children: React.ReactNode;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  // ✅ Await params before destructuring
  const { id } = await params;
  
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://aicostaudit.com';
  const auditUrl = `${baseUrl}/result/${id}`;
  const ogImage = `${baseUrl}/og-image.svg`;

  try {
    const audit = await getAudit(id);
    const savings = audit?.result?.totalMonthlySavings ?? 0;
    const annual = audit?.result?.totalAnnualSavings ?? savings * 12;
    const isOptimal = audit?.result?.isAlreadyOptimal ?? false;

    const title = isOptimal
      ? 'AI Spend Audit — Stack already optimised'
      : savings >= 500
      ? `AI Spend Audit — $${savings.toLocaleString()}/mo in savings found`
      : savings > 0
      ? `AI Spend Audit — $${savings}/mo in potential savings`
      : 'AI Spend Audit Report';

    const description = isOptimal
      ? "This team's AI stack is well-optimised. Run your own free audit in 60 seconds."
      : savings > 0
      ? `We found $${savings}/month ($${annual.toLocaleString()}/year) in AI tool overspend. See the full breakdown and check your own stack free.`
      : 'Free instant audit of AI tool spend. Find overspending in 60 seconds — no login required.';

    const twitterTitle = isOptimal
      ? 'AI Spend Audit — Well optimised stack'
      : savings > 500
      ? `🚨 $${savings.toLocaleString()}/month in wasted AI spend found`
      : savings > 0
      ? `Found $${savings}/month in AI tool overspend`
      : 'AI Spend Audit';

    const twitterDescription = isOptimal
      ? 'Stack is optimised. Check yours free →'
      : `Save $${savings}/month — see full breakdown and audit your own stack free.`;

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        url: auditUrl,
        type: 'website',
        siteName: 'AI Spend Audit',
        images: [{ url: ogImage, width: 1200, height: 630, alt: title }],
      },
      twitter: {
        card: 'summary_large_image',
        title: twitterTitle,
        description: twitterDescription,
        images: [ogImage],
      },
    };
  } catch {
    return {
      title: 'AI Spend Audit Report',
      description: 'Free instant audit of AI tool spend. Find overspending in 60 seconds.',
      openGraph: {
        title: 'AI Spend Audit — Are you overpaying for AI tools?',
        description: 'Free instant audit. Find overspending in 60 seconds — no login required.',
        url: auditUrl,
        type: 'website',
        siteName: 'AI Spend Audit',
        images: [{ url: ogImage, width: 1200, height: 630 }],
      },
      twitter: {
        card: 'summary_large_image',
        title: 'AI Spend Audit',
        description: "Find out if you're overpaying for AI tools. Free, 60 seconds, no login.",
        images: [ogImage],
      },
    };
  }
}

// ✅ Also async + awaiting params in layout default export
export default async function ResultLayout({ children, params }: Props) {
  // We don't need id here but params must match the Promise type
  await params; // satisfies Next.js 15 type constraint
  return <>{children}</>;
}
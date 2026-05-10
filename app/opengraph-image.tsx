// app/result/[id]/opengraph-image.tsx
// Generates a unique OG image for each audit result
// Shows: savings amount, tool count, use case
// This is what appears when someone shares the link on Twitter/Slack/LinkedIn

import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'AI Spend Audit Result';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image({
  params,
}: {
  params: { id: string };
}) {
  // Try to fetch audit data for dynamic content
  let monthlySavings = 0;
  let annualSavings = 0;
  let toolCount = 0;
  let useCase = 'mixed';
  let teamSize = 1;
  let isOptimal = false;

  try {
    const baseUrl =
      process.env.NEXT_PUBLIC_BASE_URL ||
      'http://localhost:3000';

    const res = await fetch(`${baseUrl}/api/audit/${params.id}`, {
      next: { revalidate: 3600 },
    });

    if (res.ok) {
      const data = await res.json();
      monthlySavings = data.result?.totalMonthlySavings ?? 0;
      annualSavings = data.result?.totalAnnualSavings ?? 0;
      toolCount = data.result?.recommendations?.length ?? 0;
      useCase = data.result?.useCase ?? 'mixed';
      teamSize = data.result?.teamSize ?? 1;
      isOptimal = data.result?.isAlreadyOptimal ?? false;
    }
  } catch {
    // Use defaults if fetch fails
  }

  const formatUSD = (n: number) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(n);

  return new ImageResponse(
    (
      <div
        style={{
          width: 1200,
          height: 630,
          background: '#0a0a0f',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'system-ui, sans-serif',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Background gradient blobs */}
        <div
          style={{
            position: 'absolute',
            top: -100,
            left: -100,
            width: 500,
            height: 500,
            background:
              'radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)',
            borderRadius: '50%',
            display: 'flex',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: -100,
            right: -100,
            width: 500,
            height: 500,
            background:
              'radial-gradient(circle, rgba(168,85,247,0.1) 0%, transparent 70%)',
            borderRadius: '50%',
            display: 'flex',
          }}
        />

        {/* Top badge */}
        <div
          style={{
            background: 'rgba(99,102,241,0.15)',
            border: '1px solid rgba(99,102,241,0.3)',
            borderRadius: 24,
            padding: '8px 20px',
            fontSize: 16,
            color: '#a5b4fc',
            marginBottom: 32,
            display: 'flex',
          }}
        >
          AI Cost Audit · {teamSize}-person {useCase} team · {toolCount} tools audited
        </div>

        {/* Main content */}
        {isOptimal ? (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            <div style={{ fontSize: 72, marginBottom: 16, display: 'flex' }}>✅</div>
            <div
              style={{
                fontSize: 64,
                fontWeight: 900,
                color: '#10b981',
                marginBottom: 16,
                display: 'flex',
              }}
            >
              Well Optimized
            </div>
            <div style={{ fontSize: 24, color: '#555', display: 'flex' }}>
              No significant overspend found
            </div>
          </div>
        ) : (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            <div
              style={{
                fontSize: 20,
                color: '#f87171',
                fontFamily: 'monospace',
                textTransform: 'uppercase',
                letterSpacing: 4,
                marginBottom: 16,
                display: 'flex',
              }}
            >
              🚨 Overspending Detected
            </div>

            {/* Big savings number */}
            <div
              style={{
                display: 'flex',
                alignItems: 'baseline',
                gap: 12,
                marginBottom: 8,
              }}
            >
              <span
                style={{
                  fontSize: 96,
                  fontWeight: 900,
                  background: 'linear-gradient(90deg, #6366f1, #a855f7)',
                  backgroundClip: 'text',
                  color: 'transparent',
                  lineHeight: 1,
                  display: 'flex',
                }}
              >
                {formatUSD(monthlySavings)}
              </span>
              <span
                style={{ fontSize: 28, color: '#555', display: 'flex' }}
              >
                /mo
              </span>
            </div>

            <div
              style={{
                fontSize: 26,
                color: '#6ee7b7',
                marginBottom: 32,
                display: 'flex',
              }}
            >
              {formatUSD(annualSavings)} per year in potential savings
            </div>
          </div>
        )}

        {/* Bottom CTA */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            marginTop: 16,
          }}
        >
          <div
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 12,
              padding: '10px 24px',
              fontSize: 18,
              color: '#888',
              display: 'flex',
            }}
          >
            aicostaudit.com
          </div>
          <div
            style={{
              background: 'linear-gradient(90deg, #6366f1, #a855f7)',
              borderRadius: 12,
              padding: '10px 24px',
              fontSize: 18,
              color: 'white',
              fontWeight: 700,
              display: 'flex',
            }}
          >
            Run Free Audit →
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
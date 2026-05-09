'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AuditResult } from '@/lib/audit/types';
import { formatCurrency, actionLabel, actionColor, savingsBadgeColor } from '@/lib/utils/format';

export default function ResultPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [data, setData] = useState<{ id: string; result: AuditResult } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState('');
  const [emailDone, setEmailDone] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function load() {
      // Try localStorage first (works without Supabase)
      const cached = localStorage.getItem(`audit-${id}`);
      if (cached) {
        try {
          setData(JSON.parse(cached));
          setLoading(false);
          return;
        } catch {}
      }
      // Fall back to API
      try {
        const res = await fetch(`/api/audit/${id}`);
        if (res.ok) {
          const json = await res.json();
          setData(json);
        } else {
          setError('Audit not found.');
        }
      } catch {
        setError('Failed to load audit.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  async function submitEmail() {
    if (!email.includes('@')) return;
    await fetch('/api/email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        auditId: id, email, company,
        teamSize: data?.result.teamSize,
        monthlySavings: data?.result.totalMonthlySavings || 0,
      }),
    });
    setEmailDone(true);
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#0a0a0f', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
      Loading audit...
    </div>
  );

  if (error || !data) return (
    <div style={{ minHeight: '100vh', background: '#0a0a0f', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', flexDirection: 'column', gap: 16 }}>
      <p>{error || 'Audit not found.'}</p>
      <button onClick={() => router.push('/')} style={{ background: '#6366f1', color: 'white', border: 'none', padding: '12px 24px', borderRadius: 10, cursor: 'pointer' }}>
        New Audit
      </button>
    </div>
  );

  const { result } = data;
  const isOptimal = result.isAlreadyOptimal;

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0f', color: 'white', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ maxWidth: 640, margin: '0 auto', padding: '48px 16px' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 12, color: '#555', fontFamily: 'monospace', marginBottom: 8 }}>
            AI Spend Audit · {result.teamSize}-person team · {result.useCase}
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0 }}>Your AI Spend Report</h1>
        </div>

        {/* Savings Hero */}
        <div style={{
          background: isOptimal ? 'rgba(59,130,246,0.05)' : 'rgba(16,185,129,0.05)',
          border: `1px solid ${isOptimal ? 'rgba(59,130,246,0.2)' : 'rgba(16,185,129,0.2)'}`,
          borderRadius: 20, padding: 32, textAlign: 'center', marginBottom: 20,
        }}>
          {isOptimal ? (
            <>
              <div style={{ fontSize: 48, marginBottom: 8 }}>✓</div>
              <div style={{ fontSize: 32, fontWeight: 700, color: '#60a5fa' }}>You&apos;re Optimized</div>
              <div style={{ color: '#888', marginTop: 8 }}>No major savings found — your stack is well-matched.</div>
              <div style={{ color: '#555', fontFamily: 'monospace', fontSize: 13, marginTop: 8 }}>
                Current spend: {formatCurrency(result.totalCurrentSpend)}/mo
              </div>
            </>
          ) : (
            <>
              <div style={{ fontSize: 12, color: '#888', fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
                Potential Monthly Savings
              </div>
              <div style={{ fontSize: 56, fontWeight: 800, color: '#34d399' }}>
                {formatCurrency(result.totalMonthlySavings)}
              </div>
              <div style={{ fontSize: 20, color: '#6ee7b7', marginBottom: 8 }}>
                {formatCurrency(result.totalAnnualSavings)} per year
              </div>
              <div style={{ color: '#555', fontFamily: 'monospace', fontSize: 13 }}>
                {formatCurrency(result.totalCurrentSpend)}/mo → {formatCurrency(result.totalOptimizedSpend)}/mo
              </div>
            </>
          )}
        </div>

        {/* AI Summary */}
        {result.summary && (
          <div style={{ background: '#111118', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 16, padding: 20, marginBottom: 16 }}>
            <div style={{ fontSize: 11, color: '#6366f1', fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>
              AI Analysis
            </div>
            <p style={{ color: '#ccc', fontSize: 14, lineHeight: 1.7, margin: 0 }}>{result.summary}</p>
          </div>
        )}

        {/* Tool Breakdown */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, color: '#555', fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>
            Tool Breakdown
          </div>
          {result.recommendations.map((rec) => (
            <div key={rec.toolId} style={{ background: '#111118', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: 20, marginBottom: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <span style={{ fontWeight: 600, color: 'white' }}>{rec.toolName}</span>
                    <span style={{ fontSize: 11, color: '#555', fontFamily: 'monospace' }}>{rec.currentPlan}</span>
                  </div>
                  <p style={{ fontSize: 13, color: '#888', margin: 0, lineHeight: 1.6 }}>{rec.reason}</p>
                  {rec.recommendedPlan && (
                    <div style={{ marginTop: 8, fontSize: 12, color: '#555' }}>
                      → Recommended: <span style={{ color: '#ccc' }}>{rec.recommendedPlan}</span>
                    </div>
                  )}
                  {rec.recommendedTool && (
                    <div style={{ marginTop: 8, fontSize: 12, color: '#555' }}>
                      → Switch to: <span style={{ color: '#ccc' }}>{rec.recommendedTool}</span>
                    </div>
                  )}
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{
                    fontSize: 12, fontWeight: 700, padding: '4px 10px', borderRadius: 6,
                    border: `1px solid ${savingsBadgeColor(rec.savings)}33`,
                    color: savingsBadgeColor(rec.savings), marginBottom: 6,
                  }}>
                    {rec.savings > 0 ? `-${formatCurrency(rec.savings)}/mo` : 'Optimal'}
                  </div>
                  <div style={{ fontSize: 11, fontFamily: 'monospace', color: actionColor(rec.action) }}>
                    {actionLabel(rec.action)}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* High savings Credex CTA */}
        {result.highSavings && (
          <div style={{ background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.3)', borderRadius: 16, padding: 24, marginBottom: 16 }}>
            <h3 style={{ margin: '0 0 8px', color: 'white' }}>💡 Significant savings identified</h3>
            <p style={{ color: '#c4b5fd', fontSize: 14, margin: '0 0 16px' }}>
              At <strong>{formatCurrency(result.totalMonthlySavings)}/month</strong> in savings, a Credex consultant
              can help you capture additional savings through bulk AI procurement and negotiated rates.
            </p>
            <button onClick={() => setShowForm(true)}
              style={{ background: '#7c3aed', color: 'white', border: 'none', padding: '10px 20px', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              Book Free Credex Consultation →
            </button>
          </div>
        )}

        {/* Email capture */}
        {!emailDone && (
          <div style={{ background: '#111118', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: 24, marginBottom: 16 }}>
            {!showForm ? (
              <div style={{ textAlign: 'center' }}>
                <p style={{ color: '#ccc', margin: '0 0 8px', fontWeight: 500 }}>
                  {isOptimal ? 'Get notified when new optimizations apply' : 'Get this report in your inbox'}
                </p>
                <button onClick={() => setShowForm(true)}
                  style={{ background: '#6366f1', color: 'white', border: 'none', padding: '10px 24px', borderRadius: 10, fontSize: 14, cursor: 'pointer' }}>
                  {isOptimal ? 'Notify Me' : 'Email My Report'}
                </button>
              </div>
            ) : (
              <div>
                <p style={{ margin: '0 0 16px', fontWeight: 600 }}>Get your report</p>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  placeholder="Work email *"
                  style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '12px', color: 'white', fontSize: 14, marginBottom: 10, boxSizing: 'border-box' }} />
                <input type="text" value={company} onChange={(e) => setCompany(e.target.value)}
                  placeholder="Company (optional)"
                  style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '12px', color: 'white', fontSize: 14, marginBottom: 10, boxSizing: 'border-box' }} />
                <button onClick={submitEmail}
                  style={{ width: '100%', background: '#6366f1', color: 'white', border: 'none', padding: '12px', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
                  Send Report
                </button>
              </div>
            )}
          </div>
        )}

        {emailDone && (
          <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 16, padding: 20, textAlign: 'center', marginBottom: 16, color: '#34d399' }}>
            ✅ Report sent to {email}
          </div>
        )}

        {/* Share + New Audit */}
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={() => { navigator.clipboard.writeText(window.location.href); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
            style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#ccc', padding: '12px', borderRadius: 12, fontSize: 14, cursor: 'pointer' }}>
            {copied ? '✓ Copied!' : '🔗 Share Report'}
          </button>
          <button onClick={() => router.push('/')}
            style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#ccc', padding: '12px', borderRadius: 12, fontSize: 14, cursor: 'pointer' }}>
            ← New Audit
          </button>
        </div>

        <p style={{ textAlign: 'center', fontSize: 11, color: '#333', marginTop: 32, fontFamily: 'monospace' }}>
          aicostaudit.com · Prices verified May 2026
        </p>
      </div>
    </div>
  );
}
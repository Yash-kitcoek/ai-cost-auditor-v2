'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AuditResult, ToolRecommendation } from '@/lib/audit/types';
import { formatCurrency, actionLabel, actionColor, savingsBadgeColor } from '@/lib/utils/format';

// ── Types ─────────────────────────────────────────────────────────────────────
interface AuditData {
  id: string;
  result: AuditResult;
}

// ── Inline styles ─────────────────────────────────────────────────────────────
const card = {
  background: '#111118',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 16,
  padding: 24,
  marginBottom: 12,
};

// ── Sub-components ────────────────────────────────────────────────────────────

function ScoreBadge({ score }: { score: number }) {
  const color = score >= 80 ? '#10b981' : score >= 50 ? '#f59e0b' : '#ef4444';
  const label = score >= 80 ? 'Well Optimized' : score >= 50 ? 'Room to Improve' : 'Significant Overspend';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'center', marginBottom: 8 }}>
      <div style={{
        width: 52, height: 52, borderRadius: '50%',
        border: `3px solid ${color}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 16, fontWeight: 800, color,
      }}>
        {score}
      </div>
      <div>
        <div style={{ fontSize: 13, fontWeight: 600, color }}>{label}</div>
        <div style={{ fontSize: 11, color: '#555' }}>Efficiency score out of 100</div>
      </div>
    </div>
  );
}

function SavingsHero({ result }: { result: AuditResult }) {
  if (result.isAlreadyOptimal) {
    return (
      <div style={{ ...card, textAlign: 'center', padding: '36px 24px' }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
        <h2 style={{ fontSize: 26, fontWeight: 800, margin: '0 0 8px', color: '#10b981' }}>
          You&apos;re spending well.
        </h2>
        <p style={{ color: '#666', fontSize: 15, margin: 0 }}>
          No significant overspend found for your stack. Review quarterly as pricing evolves.
        </p>
        <ScoreBadge score={result.score} />
      </div>
    );
  }

  return (
    <div style={{
      ...card,
      background: 'linear-gradient(135deg, rgba(99,102,241,0.12) 0%, rgba(168,85,247,0.08) 50%, rgba(16,185,129,0.08) 100%)',
      border: '1px solid rgba(99,102,241,0.25)',
      textAlign: 'center', padding: '40px 24px',
    }}>
      <div style={{ fontSize: 12, color: '#a5b4fc', fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 16 }}>
        Potential Savings Found
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', gap: 40, marginBottom: 24, flexWrap: 'wrap' }}>
        <div>
          <div style={{
            fontSize: 56, fontWeight: 900, lineHeight: 1,
            background: 'linear-gradient(90deg,#6366f1,#a855f7)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>
            {formatCurrency(result.totalMonthlySavings)}
          </div>
          <div style={{ fontSize: 13, color: '#666', marginTop: 4 }}>per month</div>
        </div>
        <div style={{ borderLeft: '1px solid rgba(255,255,255,0.08)', paddingLeft: 40 }}>
          <div style={{
            fontSize: 56, fontWeight: 900, lineHeight: 1,
            background: 'linear-gradient(90deg,#a855f7,#10b981)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>
            {formatCurrency(result.totalAnnualSavings)}
          </div>
          <div style={{ fontSize: 13, color: '#666', marginTop: 4 }}>per year</div>
        </div>
      </div>

      <div style={{ fontSize: 13, color: '#555', marginBottom: 20 }}>
        Current spend:{' '}
        <strong style={{ color: '#888' }}>{formatCurrency(result.totalCurrentSpend)}/mo</strong>
        {' → '}Optimized:{' '}
        <strong style={{ color: '#10b981' }}>{formatCurrency(result.totalOptimizedSpend)}/mo</strong>
      </div>

      <ScoreBadge score={result.score} />
    </div>
  );
}

function RecommendationCard({ rec }: { rec: ToolRecommendation }) {
  const acColor = actionColor(rec.action);
  const hasSavings = rec.savings > 0;

  return (
    <div style={{
      background: '#0f0f1a',
      border: `1px solid rgba(255,255,255,0.07)`,
      borderLeft: `3px solid ${acColor}`,
      borderRadius: 12,
      padding: '16px 18px',
      marginBottom: 8,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
        {/* Left: tool info */}
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <span style={{
              fontSize: 11, fontWeight: 700, color: acColor,
              background: `${acColor}18`, borderRadius: 6,
              padding: '2px 8px', fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: 0.5,
            }}>
              {actionLabel(rec.action)}
            </span>
            <span style={{ fontSize: 14, fontWeight: 700, color: 'white' }}>{rec.toolName}</span>
          </div>

          <div style={{ fontSize: 12, color: '#555', marginBottom: 8 }}>
            <span style={{ color: '#666' }}>{rec.currentPlan}</span>
            {rec.recommendedPlan && rec.recommendedPlan !== rec.currentPlan && (
              <>
                <span style={{ color: '#444', margin: '0 6px' }}>→</span>
                <span style={{ color: acColor }}>{rec.recommendedPlan}</span>
              </>
            )}
            {rec.recommendedTool && (
              <>
                <span style={{ color: '#444', margin: '0 6px' }}>→</span>
                <span style={{ color: acColor }}>Switch to {rec.recommendedTool}</span>
              </>
            )}
          </div>

          <p style={{ fontSize: 12, color: '#666', margin: 0, lineHeight: 1.6 }}>{rec.reason}</p>
        </div>

        {/* Right: savings */}
        <div style={{ textAlign: 'right', minWidth: 90 }}>
          {hasSavings ? (
            <>
              <div style={{
                fontSize: 22, fontWeight: 800,
                color: savingsBadgeColor(rec.savings),
              }}>
                -{formatCurrency(rec.savings)}
              </div>
              <div style={{ fontSize: 11, color: '#444' }}>/month</div>
            </>
          ) : (
            <div style={{ fontSize: 12, color: '#10b981', fontWeight: 600 }}>Optimal</div>
          )}
        </div>
      </div>
    </div>
  );
}

function AISummaryBlock({ summary }: { summary?: string }) {
  if (!summary) return null;
  return (
    <div style={{
      ...card,
      background: 'rgba(99,102,241,0.05)',
      border: '1px solid rgba(99,102,241,0.2)',
    }}>
      <div style={{ fontSize: 11, color: '#6366f1', fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>
        AI Analysis
      </div>
      <p style={{ fontSize: 14, color: '#bbb', lineHeight: 1.8, margin: 0 }}>{summary}</p>
    </div>
  );
}

function CredexCTA({ monthlySavings }: { monthlySavings: number }) {
  if (monthlySavings <= 500) return null;
  return (
    <div style={{
      ...card,
      background: 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(168,85,247,0.1))',
      border: '1px solid rgba(99,102,241,0.3)',
      textAlign: 'center',
    }}>
      <div style={{ fontSize: 22, marginBottom: 8 }}>💰</div>
      <h3 style={{ fontSize: 18, fontWeight: 800, margin: '0 0 8px', color: 'white' }}>
        Lock in these savings with Credex
      </h3>
      <p style={{ fontSize: 13, color: '#777', margin: '0 0 20px', lineHeight: 1.6 }}>
        Credex sells discounted AI infrastructure credits — Cursor, Claude, ChatGPT Enterprise, and more —
        sourced from companies that overforecast. Your audit shows{' '}
        <strong style={{ color: '#a5b4fc' }}>{formatCurrency(monthlySavings)}/mo</strong> in potential savings.
        A Credex consultation takes 15 minutes.
      </p>
      <a
        href="https://credex.ai"
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display: 'inline-block',
          background: 'linear-gradient(90deg, #6366f1, #a855f7)',
          color: 'white', border: 'none',
          padding: '12px 28px', borderRadius: 10,
          fontSize: 14, fontWeight: 700,
          cursor: 'pointer', textDecoration: 'none',
        }}
      >
        Book a Free Credex Consultation →
      </a>
    </div>
  );
}

// ── LeadCapture — FIXED ───────────────────────────────────────────────────────
// Changes vs original:
//   1. Sends `monthlySavings` in POST body (was missing — needed for email subject + Credex alert)
//   2. Sends `honeypot` in POST body (was missing — needed for server-side bot detection)
//   3. Added `teamSize` optional field (stored in leads table)
//   4. Surfaces real API error messages instead of generic fallback
function LeadCapture({ auditId, monthlySavings }: { auditId: string; monthlySavings: number }) {
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState('');
  const [role, setRole] = useState('');
  const [teamSize, setTeamSize] = useState('');
  const [honeypot, setHoneypot] = useState(''); // invisible bot trap — never shown to real users
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fieldStyle = {
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 8,
    padding: '10px 12px',
    color: 'white',
    fontSize: 13,
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box' as const,
  };

  async function handleCapture() {
    if (!email.includes('@')) { setError('Enter a valid email.'); return; }
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          auditId,
          email,
          company: company || undefined,
          role: role || undefined,
          teamSize: teamSize ? Number(teamSize) : undefined,
          monthlySavings,  // FIX: was missing — needed for email subject line + Credex alert threshold
          honeypot,        // FIX: was missing — needed for server-side bot detection
        }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || 'Failed to save');
      setSubmitted(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <div style={{ ...card, textAlign: 'center', padding: '32px 24px' }}>
        <div style={{ fontSize: 36, marginBottom: 10 }}>✉️</div>
        <div style={{ fontSize: 16, fontWeight: 700, color: '#10b981', marginBottom: 6 }}>Report sent!</div>
        <p style={{ fontSize: 13, color: '#555', margin: 0 }}>
          Check your inbox for your full audit report.
          {monthlySavings > 500 && ' A Credex advisor will be in touch shortly.'}
        </p>
      </div>
    );
  }

  return (
    <div style={card}>
      <div style={{ fontSize: 11, color: '#555', fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>
        Get Your Report
      </div>
      <p style={{ fontSize: 13, color: '#666', margin: '0 0 16px' }}>
        Email yourself a copy of this audit
        {monthlySavings > 500 ? ' — and get a Credex advisor to help you act on it.' : '.'}
      </p>

      {/* Honeypot: visually hidden from real users, bots auto-fill it */}
      <input
        type="text"
        name="website"
        value={honeypot}
        onChange={(e) => setHoneypot(e.target.value)}
        style={{ display: 'none' }}
        tabIndex={-1}
        aria-hidden="true"
        autoComplete="off"
      />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <input
          type="email"
          placeholder="you@company.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={fieldStyle}
        />

        <div style={{ display: 'flex', gap: 10 }}>
          <input
            type="text"
            placeholder="Company (optional)"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            style={fieldStyle}
          />
          <input
            type="text"
            placeholder="Role (optional)"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            style={fieldStyle}
          />
        </div>

        <input
          type="number"
          placeholder="Team size (optional)"
          value={teamSize}
          onChange={(e) => setTeamSize(e.target.value)}
          min={1}
          style={fieldStyle}
        />

        {error && (
          <div style={{ fontSize: 12, color: '#fca5a5' }}>{error}</div>
        )}

        <button
          onClick={handleCapture}
          disabled={loading}
          style={{
            background: loading ? '#1f2937' : '#6366f1',
            color: loading ? '#555' : 'white',
            border: 'none',
            padding: '12px',
            borderRadius: 10,
            fontSize: 14,
            fontWeight: 600,
            cursor: loading ? 'not-allowed' : 'pointer',
          }}
        >
          {loading ? 'Sending…' : 'Email my report →'}
        </button>
      </div>
    </div>
  );
}

// ── ShareBlock — UPGRADED ────────────────────────────────────────────────────
// Changes vs original:
//   1. Added X (Twitter) share button with emotional share text including savings
//   2. Added LinkedIn share button
//   3. Added privacy note confirming PII is stripped from the public link
//   4. Share text is dynamic — "$X/mo in wasted spend" when savings > 0
function ShareBlock({ auditId, monthlySavings }: { auditId: string; monthlySavings: number }) {
  const [copied, setCopied] = useState(false);

  const url = typeof window !== 'undefined'
    ? `${window.location.origin}/result/${auditId}`
    : `/result/${auditId}`;

  // Emotional share text — specific savings amount drives clicks vs generic "check this"
  const shareText =
    monthlySavings > 0
      ? `We found $${monthlySavings.toLocaleString()}/month in wasted AI tool spend. Check yours free →`
      : `Just audited our AI tool stack — here's the breakdown →`;

  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(url)}`;
  const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;

  function handleCopy() {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  const socialBtn = {
    display: 'flex' as const, alignItems: 'center' as const, gap: 6,
    borderRadius: 8, padding: '9px 16px',
    fontSize: 13, fontWeight: 600,
    cursor: 'pointer', textDecoration: 'none', whiteSpace: 'nowrap' as const,
    flexShrink: 0,
  };

  return (
    <>
      {/* Privacy note */}
      <p style={{ fontSize: 12, color: '#444', margin: '0 0 10px', lineHeight: 1.6 }}>
        Your email, company name, and role are excluded from this link — only tool usage,
        costs, and savings insights are shown. Safe to share with your team or CFO.
      </p>

      {/* URL copy row */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: 10, padding: '10px 14px', marginBottom: 10,
      }}>
        <span style={{ fontSize: 12, color: '#444', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {url}
        </span>
        <button
          onClick={handleCopy}
          style={{
            background: copied ? 'rgba(16,185,129,0.15)' : 'rgba(99,102,241,0.15)',
            border: `1px solid ${copied ? 'rgba(16,185,129,0.3)' : 'rgba(99,102,241,0.3)'}`,
            color: copied ? '#10b981' : '#a5b4fc',
            borderRadius: 6, padding: '6px 14px',
            fontSize: 12, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap',
            flexShrink: 0,
          }}
        >
          {copied ? '✓ Copied!' : 'Copy link'}
        </button>
      </div>

      {/* Social share buttons */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <a href={twitterUrl} target="_blank" rel="noopener noreferrer"
          style={{
            ...socialBtn,
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.1)',
            color: 'white',
          }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.259 5.631zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
          </svg>
          Share on X
        </a>

        <a href={linkedinUrl} target="_blank" rel="noopener noreferrer"
          style={{
            ...socialBtn,
            background: 'rgba(10,102,194,0.15)',
            border: '1px solid rgba(10,102,194,0.3)',
            color: '#60a5fa',
          }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
          </svg>
          Share on LinkedIn
        </a>
      </div>

      {/* Preview of what gets shared on X */}
      {monthlySavings > 0 && (
        <div style={{
          marginTop: 10, padding: '8px 12px',
          background: 'rgba(99,102,241,0.06)',
          border: '1px solid rgba(99,102,241,0.15)',
          borderRadius: 8, fontSize: 11, color: '#555', lineHeight: 1.5,
        }}>
          <span style={{ color: '#444' }}>Share text: </span>
          <span style={{ color: '#666', fontStyle: 'italic' }}>"{shareText}"</span>
        </div>
      )}
    </>
  );
}

// ── Main result page ──────────────────────────────────────────────────────────
export default function ResultPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [auditData, setAuditData] = useState<AuditData | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!id) return;

    // 1. Try localStorage first — instant, no network (just submitted)
    try {
      const local = localStorage.getItem(`audit-${id}`);
      if (local) {
        const parsed = JSON.parse(local);
        setAuditData(parsed);
        return;
      }
    } catch {
      // localStorage unavailable or corrupt — fall through to API
    }

    // 2. Fetch from API — handles shared URLs on different devices
    fetch(`/api/audit/${id}`)
      .then(async (res) => {
        if (!res.ok) throw new Error('Not found');
        const data = await res.json();
        setAuditData({ id: data.id, result: data.result });
      })
      .catch(() => setNotFound(true));
  }, [id]);

  // ── Loading state ──
  if (!auditData && !notFound) {
    return (
      <div style={{ minHeight: '100vh', background: '#0a0a0f', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: 40, height: 40, borderRadius: '50%',
            border: '3px solid rgba(99,102,241,0.3)',
            borderTopColor: '#6366f1',
            animation: 'spin 0.8s linear infinite',
            margin: '0 auto 16px',
          }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          <div style={{ color: '#555', fontSize: 14 }}>Loading your audit...</div>
        </div>
      </div>
    );
  }

  // ── Not found state ──
  if (notFound) {
    return (
      <div style={{ minHeight: '100vh', background: '#0a0a0f', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', maxWidth: 360, padding: '0 16px' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
          <h2 style={{ color: 'white', fontSize: 22, fontWeight: 800, margin: '0 0 8px' }}>Audit not found</h2>
          <p style={{ color: '#555', fontSize: 14, marginBottom: 24 }}>
            This audit link may have expired or the ID is incorrect.
          </p>
          <button
            onClick={() => router.push('/')}
            style={{
              background: '#6366f1', color: 'white', border: 'none',
              padding: '12px 24px', borderRadius: 10,
              fontSize: 14, fontWeight: 600, cursor: 'pointer',
            }}
          >
            Run a New Audit →
          </button>
        </div>
      </div>
    );
  }

  const { result } = auditData!;
  const savings = result.totalMonthlySavings;
  const optimizedRecs = result.recommendations.filter((r) => r.action !== 'keep');
  const keepRecs = result.recommendations.filter((r) => r.action === 'keep');

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0f', color: 'white', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ maxWidth: 680, margin: '0 auto', padding: '48px 16px 80px' }}>

        {/* ── NAV ── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
          <button
            onClick={() => router.push('/')}
            style={{
              background: 'none', border: '1px solid rgba(255,255,255,0.1)',
              color: '#555', borderRadius: 8, padding: '6px 14px',
              fontSize: 12, cursor: 'pointer', fontFamily: 'monospace',
            }}
          >
            ← New Audit
          </button>
          <div style={{
            fontSize: 11, color: '#444', fontFamily: 'monospace',
            textTransform: 'uppercase', letterSpacing: 1,
          }}>
            Audit #{id?.slice(0, 8)}
          </div>
        </div>

        {/* ── HERO SAVINGS ── */}
        <SavingsHero result={result} />

        {/* ── AI SUMMARY ── */}
        <AISummaryBlock summary={result.summary} />

        {/* ── CREDEX CTA (high savings only) ── */}
        <CredexCTA monthlySavings={savings} />

        {/* ── RECOMMENDATIONS ── */}
        {optimizedRecs.length > 0 && (
          <div style={card}>
            <div style={{ fontSize: 11, color: '#555', fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16 }}>
              Optimization Opportunities
            </div>
            {optimizedRecs.map((rec) => (
              <RecommendationCard key={rec.toolId} rec={rec} />
            ))}
          </div>
        )}

        {/* ── OPTIMAL TOOLS ── */}
        {keepRecs.length > 0 && (
          <div style={card}>
            <div style={{ fontSize: 11, color: '#555', fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16 }}>
              Already Optimal
            </div>
            {keepRecs.map((rec) => (
              <RecommendationCard key={rec.toolId} rec={rec} />
            ))}
          </div>
        )}

        {/* ── SHARE ── */}
        <div style={{ ...card }}>
          <div style={{ fontSize: 11, color: '#555', fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>
            Share This Report
          </div>
          <ShareBlock auditId={id} monthlySavings={savings} />
        </div>

        {/* ── LEAD CAPTURE ── */}
        <LeadCapture auditId={id} monthlySavings={savings} />

        {/* ── FOOTER ── */}
        <div style={{ textAlign: 'center', marginTop: 32, fontSize: 11, color: '#2a2a35' }}>
          Pricing data current as of May 2026 · Built with ♥ for founders who hate waste
        </div>
      </div>
    </div>
  );
}
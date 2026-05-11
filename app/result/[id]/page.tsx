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

// ── Shared card style ─────────────────────────────────────────────────────────
const card = {
  background: '#111118',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 16,
  padding: 24,
  marginBottom: 12,
};

// ── ScoreBadge ────────────────────────────────────────────────────────────────
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

// ── SavingsHero ───────────────────────────────────────────────────────────────
function SavingsHero({ result }: { result: AuditResult }) {
  if (result.isAlreadyOptimal) {
    return (
      <div style={{ ...card, textAlign: 'center', padding: '36px 24px' }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
        <h2 style={{ fontSize: 26, fontWeight: 800, margin: '0 0 8px', color: '#10b981' }}>
          You&apos;re spending well.
        </h2>
        <p style={{ color: '#666', fontSize: 15, margin: '0 0 20px' }}>
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
          <div style={{ fontSize: 56, fontWeight: 900, lineHeight: 1, background: 'linear-gradient(90deg,#6366f1,#a855f7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            {formatCurrency(result.totalMonthlySavings)}
          </div>
          <div style={{ fontSize: 13, color: '#666', marginTop: 4 }}>per month</div>
        </div>
        <div style={{ borderLeft: '1px solid rgba(255,255,255,0.08)', paddingLeft: 40 }}>
          <div style={{ fontSize: 56, fontWeight: 900, lineHeight: 1, background: 'linear-gradient(90deg,#a855f7,#10b981)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            {formatCurrency(result.totalAnnualSavings)}
          </div>
          <div style={{ fontSize: 13, color: '#666', marginTop: 4 }}>per year</div>
        </div>
      </div>
      <div style={{ fontSize: 13, color: '#555', marginBottom: 20 }}>
        Current spend: <strong style={{ color: '#888' }}>{formatCurrency(result.totalCurrentSpend)}/mo</strong>
        {' → '}Optimized: <strong style={{ color: '#10b981' }}>{formatCurrency(result.totalOptimizedSpend)}/mo</strong>
      </div>
      <ScoreBadge score={result.score} />
    </div>
  );
}

// ── RecommendationCard ────────────────────────────────────────────────────────
function RecommendationCard({ rec }: { rec: ToolRecommendation }) {
  const acColor = actionColor(rec.action);
  const hasSavings = rec.savings > 0;
  return (
    <div style={{
      background: '#0f0f1a', border: '1px solid rgba(255,255,255,0.07)',
      borderLeft: `3px solid ${acColor}`, borderRadius: 12,
      padding: '16px 18px', marginBottom: 8,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: acColor, background: `${acColor}18`, borderRadius: 6, padding: '2px 8px', fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: 0.5 }}>
              {actionLabel(rec.action)}
            </span>
            <span style={{ fontSize: 14, fontWeight: 700, color: 'white' }}>{rec.toolName}</span>
          </div>
          <div style={{ fontSize: 12, color: '#555', marginBottom: 8 }}>
            <span style={{ color: '#666' }}>{rec.currentPlan}</span>
            {rec.recommendedPlan && rec.recommendedPlan !== rec.currentPlan && (
              <><span style={{ color: '#444', margin: '0 6px' }}>→</span><span style={{ color: acColor }}>{rec.recommendedPlan}</span></>
            )}
            {rec.recommendedTool && (
              <><span style={{ color: '#444', margin: '0 6px' }}>→</span><span style={{ color: acColor }}>Switch to {rec.recommendedTool}</span></>
            )}
          </div>
          <p style={{ fontSize: 12, color: '#666', margin: 0, lineHeight: 1.6 }}>{rec.reason}</p>
        </div>
        <div style={{ textAlign: 'right', minWidth: 90 }}>
          {hasSavings ? (
            <>
              <div style={{ fontSize: 22, fontWeight: 800, color: savingsBadgeColor(rec.savings) }}>-{formatCurrency(rec.savings)}</div>
              <div style={{ fontSize: 11, color: '#444' }}>/month</div>
              <div style={{ fontSize: 11, color: '#333', marginTop: 2 }}>-{formatCurrency(rec.savings * 12)}/yr</div>
            </>
          ) : (
            <div style={{ fontSize: 12, color: '#10b981', fontWeight: 600 }}>✓ Optimal</div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── AISummaryBlock ────────────────────────────────────────────────────────────
function AISummaryBlock({ summary }: { summary?: string }) {
  if (!summary) return null;
  return (
    <div style={{ ...card, background: 'rgba(99,102,241,0.05)', border: '1px solid rgba(99,102,241,0.2)' }}>
      <div style={{ fontSize: 11, color: '#6366f1', fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>AI Analysis</div>
      <p style={{ fontSize: 14, color: '#bbb', lineHeight: 1.8, margin: 0 }}>{summary}</p>
    </div>
  );
}

// ── CredexCTA ─────────────────────────────────────────────────────────────────
function CredexCTA({ monthlySavings }: { monthlySavings: number }) {
  if (monthlySavings <= 500) return null;
  return (
    <div style={{ ...card, background: 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(168,85,247,0.1))', border: '1px solid rgba(99,102,241,0.3)', textAlign: 'center' }}>
      <div style={{ fontSize: 22, marginBottom: 8 }}>💰</div>
      <h3 style={{ fontSize: 18, fontWeight: 800, margin: '0 0 8px', color: 'white' }}>Lock in these savings with Credex</h3>
      <p style={{ fontSize: 13, color: '#777', margin: '0 0 20px', lineHeight: 1.6 }}>
        Credex sells discounted AI infrastructure credits — Cursor, Claude, ChatGPT Enterprise, and more — sourced from companies that overforecast. Your audit shows{' '}
        <strong style={{ color: '#a5b4fc' }}>{formatCurrency(monthlySavings)}/mo</strong> in potential savings. A Credex consultation takes 15 minutes.
      </p>
      <a href="https://credex.ai" target="_blank" rel="noopener noreferrer"
        style={{ display: 'inline-block', background: 'linear-gradient(90deg, #6366f1, #a855f7)', color: 'white', border: 'none', padding: '12px 28px', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer', textDecoration: 'none' }}>
        Book a Free Credex Consultation →
      </a>
    </div>
  );
}

// ── BenchmarkBlock ────────────────────────────────────────────────────────────
function BenchmarkBlock({ totalCurrentSpend, teamSize, useCase }: { totalCurrentSpend: number; teamSize: number; useCase: string }) {
  if (totalCurrentSpend <= 0 || teamSize <= 0) return null;
  const devCount = Math.max(1, teamSize);
  const yourPerDev = Math.round(totalCurrentSpend / devCount);

  const benchmarks: Record<string, Record<string, { median: number; p25: number; p75: number; label: string }>> = {
    solo:       { coding: { median: 35, p25: 20, p75: 60,  label: 'solo devs' },        writing: { median: 25, p25: 0,  p75: 40,  label: 'solo writers' },    data: { median: 30, p25: 15, p75: 55,  label: 'solo analysts' },    research: { median: 20, p25: 0,  p75: 40,  label: 'solo researchers' }, mixed: { median: 30, p25: 15, p75: 55,  label: 'solo professionals' } },
    small:      { coding: { median: 55, p25: 30, p75: 90,  label: '2–5 person teams' }, writing: { median: 30, p25: 10, p75: 50,  label: '2–5 person teams' }, data: { median: 45, p25: 20, p75: 80,  label: '2–5 person teams' }, research: { median: 35, p25: 15, p75: 60,  label: '2–5 person teams' }, mixed: { median: 45, p25: 20, p75: 75,  label: '2–5 person teams' } },
    mid:        { coding: { median: 75, p25: 40, p75: 130, label: '6–20 person teams' },writing: { median: 35, p25: 15, p75: 60,  label: '6–20 person teams' },data: { median: 60, p25: 30, p75: 110, label: '6–20 person teams' },research: { median: 45, p25: 20, p75: 80,  label: '6–20 person teams' }, mixed: { median: 60, p25: 30, p75: 100, label: '6–20 person teams' } },
    large:      { coding: { median: 90, p25: 50, p75: 160, label: '21–100 person orgs' },writing:{ median: 40, p25: 20, p75: 70,  label: '21–100 person orgs' },data: { median: 75, p25: 40, p75: 130, label: '21–100 person orgs' },research:{ median: 55, p25: 25, p75: 95,  label: '21–100 person orgs' }, mixed: { median: 70, p25: 35, p75: 120, label: '21–100 person orgs' } },
    enterprise: { coding: { median: 120,p25: 70, p75: 200, label: '100+ person orgs' }, writing: { median: 50, p25: 25, p75: 90,  label: '100+ person orgs' }, data: { median: 100,p25: 55, p75: 170, label: '100+ person orgs' }, research: { median: 70, p25: 35, p75: 120, label: '100+ person orgs' }, mixed: { median: 95, p25: 50, p75: 160, label: '100+ person orgs' } },
  };

  const bucket = devCount === 1 ? 'solo' : devCount <= 5 ? 'small' : devCount <= 20 ? 'mid' : devCount <= 100 ? 'large' : 'enterprise';
  const b = benchmarks[bucket][useCase] ?? benchmarks[bucket]['mixed'];

  const isLean = yourPerDev <= b.p25;
  const isNormal = yourPerDev <= b.median;
  const isHigh = yourPerDev <= b.p75;
  const verdict = isLean ? 'Lean spender' : isNormal ? 'Around median' : isHigh ? 'Above median' : 'Top 25% spenders';
  const verdictColor: string = isLean || isNormal ? '#10b981' : isHigh ? '#f59e0b' : '#ef4444';

  const maxVal = Math.max(b.p75 * 1.3, yourPerDev * 1.1);
  function pct(val: number) { return Math.min(100, Math.round((val / maxVal) * 100)); }

  return (
    <div style={card}>
      <div style={{ fontSize: 11, color: '#555', fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 14 }}>
        Benchmark — AI Spend Per Developer
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ fontSize: 11, color: '#555', marginBottom: 4 }}>Your spend / developer</div>
          <div style={{ fontSize: 36, fontWeight: 900, color: verdictColor }}>${yourPerDev}<span style={{ fontSize: 14, fontWeight: 400, color: '#555' }}>/mo</span></div>
          <div style={{ fontSize: 11, fontWeight: 600, color: verdictColor, marginTop: 2 }}>{verdict}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 11, color: '#555', marginBottom: 6 }}>Peers: {b.label}</div>
          <div style={{ fontSize: 12, color: '#666', marginBottom: 2 }}>25th pct: <strong style={{ color: '#888' }}>${b.p25}/dev</strong></div>
          <div style={{ fontSize: 12, color: '#666', marginBottom: 2 }}>Median: <strong style={{ color: '#888' }}>${b.median}/dev</strong></div>
          <div style={{ fontSize: 12, color: '#666' }}>75th pct: <strong style={{ color: '#888' }}>${b.p75}/dev</strong></div>
        </div>
      </div>
      <div style={{ position: 'relative', height: 40 }}>
        <div style={{ position: 'absolute', left: 0, right: 0, top: 12, height: 8, background: 'rgba(255,255,255,0.04)', borderRadius: 4 }} />
        <div style={{ position: 'absolute', left: `${pct(b.p25)}%`, top: 6, width: 2, height: 20, background: '#10b981', borderRadius: 1 }} />
        <div style={{ position: 'absolute', left: `${pct(b.p25)}%`, top: 28, fontSize: 9, color: '#10b981', transform: 'translateX(-50%)' }}>p25</div>
        <div style={{ position: 'absolute', left: `${pct(b.median)}%`, top: 6, width: 2, height: 20, background: '#6366f1', borderRadius: 1 }} />
        <div style={{ position: 'absolute', left: `${pct(b.median)}%`, top: 28, fontSize: 9, color: '#6366f1', transform: 'translateX(-50%)' }}>med</div>
        <div style={{ position: 'absolute', left: `${pct(b.p75)}%`, top: 6, width: 2, height: 20, background: '#f59e0b', borderRadius: 1 }} />
        <div style={{ position: 'absolute', left: `${pct(b.p75)}%`, top: 28, fontSize: 9, color: '#f59e0b', transform: 'translateX(-50%)' }}>p75</div>
        <div style={{ position: 'absolute', left: `${pct(yourPerDev)}%`, top: 8, width: 16, height: 16, background: verdictColor, borderRadius: '50%', transform: 'translateX(-50%)', border: '2px solid #0a0a0f', zIndex: 2 }} />
        <div style={{ position: 'absolute', left: `${pct(yourPerDev)}%`, top: 28, fontSize: 9, color: verdictColor, transform: 'translateX(-50%)', fontWeight: 700 }}>you</div>
      </div>
      <div style={{ marginTop: 28, fontSize: 11, color: '#444' }}>
        Benchmarks based on industry surveys and public tooling cost data (May 2026).
      </div>
    </div>
  );
}

// ── LeadCapture ───────────────────────────────────────────────────────────────
function LeadCapture({ auditId, monthlySavings }: { auditId: string; monthlySavings: number }) {
  const [email, setEmail]       = useState('');
  const [company, setCompany]   = useState('');
  const [role, setRole]         = useState('');
  const [teamSize, setTeamSize] = useState('');
  const [honeypot, setHoneypot] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  const fieldStyle = {
    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 8, padding: '10px 12px', color: 'white', fontSize: 13,
    outline: 'none', width: '100%', boxSizing: 'border-box' as const,
  };

  async function handleCapture() {
    if (!email.includes('@')) { setError('Enter a valid email.'); return; }
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/email', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ auditId, email, company: company || undefined, role: role || undefined, teamSize: teamSize ? Number(teamSize) : undefined, monthlySavings, honeypot }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || 'Failed to save');
      setSubmitted(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally { setLoading(false); }
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
      <div style={{ fontSize: 11, color: '#555', fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Get Your Report</div>
      <p style={{ fontSize: 13, color: '#666', margin: '0 0 16px' }}>
        Email yourself a copy of this audit{monthlySavings > 500 ? ' — and get a Credex advisor to help you act on it.' : '.'}
      </p>
      <input type="text" name="website" value={honeypot} onChange={(e) => setHoneypot(e.target.value)} style={{ display: 'none' }} tabIndex={-1} aria-hidden="true" autoComplete="off" />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <input type="email" placeholder="you@company.com" value={email} onChange={(e) => setEmail(e.target.value)} style={fieldStyle} />
        <div style={{ display: 'flex', gap: 10 }}>
          <input type="text" placeholder="Company (optional)" value={company} onChange={(e) => setCompany(e.target.value)} style={fieldStyle} />
          <input type="text" placeholder="Role (optional)" value={role} onChange={(e) => setRole(e.target.value)} style={fieldStyle} />
        </div>
        <input type="number" placeholder="Team size (optional)" value={teamSize} onChange={(e) => setTeamSize(e.target.value)} min={1} style={fieldStyle} />
        {error && <div style={{ fontSize: 12, color: '#fca5a5' }}>{error}</div>}
        <button onClick={handleCapture} disabled={loading}
          style={{ background: loading ? '#1f2937' : '#6366f1', color: loading ? '#555' : 'white', border: 'none', padding: '12px', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer' }}>
          {loading ? 'Sending…' : 'Email my report →'}
        </button>
      </div>
    </div>
  );
}

// ── ShareBlock ────────────────────────────────────────────────────────────────
function ShareBlock({ auditId, monthlySavings }: { auditId: string; monthlySavings: number }) {
  const [copied, setCopied] = useState(false);
  const url = typeof window !== 'undefined' ? `${window.location.origin}/result/${auditId}` : `/result/${auditId}`;
  const shareText = monthlySavings > 0 ? `We found $${monthlySavings.toLocaleString()}/month in wasted AI tool spend. Check yours free →` : `Just audited our AI tool stack — here's the breakdown →`;
  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(url)}`;
  const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;

  function handleCopy() {
    navigator.clipboard.writeText(url).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  }

  return (
    <>
      <p style={{ fontSize: 12, color: '#444', margin: '0 0 10px', lineHeight: 1.6 }}>
        Your email, company name, and role are excluded from this link — only tool usage, costs, and savings are shown. Safe to share with your team or CFO.
      </p>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10, padding: '10px 14px', marginBottom: 10 }}>
        <span style={{ fontSize: 12, color: '#444', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{url}</span>
        <button onClick={handleCopy}
          style={{ background: copied ? 'rgba(16,185,129,0.15)' : 'rgba(99,102,241,0.15)', border: `1px solid ${copied ? 'rgba(16,185,129,0.3)' : 'rgba(99,102,241,0.3)'}`, color: copied ? '#10b981' : '#a5b4fc', borderRadius: 6, padding: '6px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0 }}>
          {copied ? '✓ Copied!' : 'Copy link'}
        </button>
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <a href={twitterUrl} target="_blank" rel="noopener noreferrer"
          style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', borderRadius: 8, padding: '9px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer', textDecoration: 'none' }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.259 5.631zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
          Share on X
        </a>
        <a href={linkedinUrl} target="_blank" rel="noopener noreferrer"
          style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(10,102,194,0.15)', border: '1px solid rgba(10,102,194,0.3)', color: '#60a5fa', borderRadius: 8, padding: '9px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer', textDecoration: 'none' }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
          Share on LinkedIn
        </a>
      </div>
      {monthlySavings > 0 && (
        <div style={{ marginTop: 10, padding: '8px 12px', background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.15)', borderRadius: 8, fontSize: 11, color: '#555', lineHeight: 1.5 }}>
          <span style={{ color: '#444' }}>Share text: </span>
          <span style={{ color: '#666', fontStyle: 'italic' }}>&ldquo;{shareText}&rdquo;</span>
        </div>
      )}
    </>
  );
}

// ── PDFExportButton ───────────────────────────────────────────────────────────
function PDFExportButton({ result, auditId }: { result: AuditResult; auditId: string }) {
  const [loading, setLoading] = useState(false);

  async function handleExport() {
    setLoading(true);
    try {
      const jspdfModule = await import('jspdf').catch(() => { throw new Error('Run: npm install jspdf'); });
      const { jsPDF } = jspdfModule;
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pageW = 210; const margin = 20; const contentW = pageW - margin * 2;
      let y = 20;

      function addText(text: string, x: number, yPos: number, opts: { size?: number; style?: 'normal'|'bold'; color?: [number,number,number]; align?: 'left'|'center'|'right'; maxWidth?: number } = {}): number {
        const { size = 10, style = 'normal', color = [220,220,220], align = 'left', maxWidth } = opts;
        doc.setFontSize(size); doc.setFont('helvetica', style); doc.setTextColor(...color);
        if (maxWidth) { const lines = doc.splitTextToSize(text, maxWidth); doc.text(lines, x, yPos, { align }); return yPos + lines.length * (size * 0.4); }
        doc.text(text, x, yPos, { align }); return yPos + size * 0.4 + 2;
      }
      function addRect(x: number, yPos: number, w: number, h: number, color: [number,number,number]) { doc.setFillColor(...color); doc.rect(x, yPos, w, h, 'F'); }
      function checkPage(needed = 30) { if (y + needed > 270) { doc.addPage(); addRect(0, 0, 210, 297, [10,10,15]); y = 20; } }

      addRect(0, 0, 210, 297, [10,10,15]);
      addRect(margin, y, contentW, 1, [99,102,241]); y += 6;
      addText('AI SPEND AUDIT REPORT', margin, y, { size: 8, color: [99,102,241] }); y += 6;
      addText('AI Cost Audit', margin, y, { size: 20, style: 'bold', color: [255,255,255] }); y += 10;
      addText(`Audit ID: ${auditId.slice(0,8)} · ${new Date().toLocaleDateString()}`, margin, y, { size: 8, color: [100,100,120] }); y += 12;

      if (!result.isAlreadyOptimal && result.totalMonthlySavings > 0) {
        addRect(margin, y, contentW, 28, [17,17,24]);
        addText('MONTHLY', margin+6, y+7, { size: 7, color: [150,150,200] });
        addText(formatCurrency(result.totalMonthlySavings), margin+6, y+20, { size: 18, style: 'bold', color: [99,102,241] });
        addText('ANNUALLY', margin+90, y+7, { size: 7, color: [150,150,200] });
        addText(formatCurrency(result.totalAnnualSavings), margin+90, y+20, { size: 18, style: 'bold', color: [168,85,247] });
        y += 34;
        addText(`Current: ${formatCurrency(result.totalCurrentSpend)}/mo  →  Optimised: ${formatCurrency(result.totalOptimizedSpend)}/mo`, margin, y, { size: 9, color: [120,120,140] }); y += 8;
      } else {
        addRect(margin, y, contentW, 14, [17,24,17]);
        addText('Stack is already well-optimised — no significant overspend found.', margin+6, y+9, { size: 9, color: [16,185,129] }); y += 20;
      }

      const scoreColor: [number,number,number] = result.score >= 80 ? [16,185,129] : result.score >= 50 ? [245,158,11] : [239,68,68];
      addText(`Efficiency score: ${result.score}/100`, margin, y, { size: 9, style: 'bold', color: scoreColor }); y += 10;

      if (result.summary) {
        checkPage(30); addText('AI ANALYSIS', margin, y, { size: 7, color: [99,102,241] }); y += 5;
        addRect(margin, y, contentW, 0.5, [40,40,60]); y += 4;
        y = addText(result.summary, margin, y, { size: 9, color: [180,180,200], maxWidth: contentW }) + 8;
      }

      checkPage(20); addText('RECOMMENDATIONS', margin, y, { size: 7, color: [99,102,241] }); y += 5;
      addRect(margin, y, contentW, 0.5, [40,40,60]); y += 6;
      const ac: Record<string,[number,number,number]> = { downgrade:[245,158,11], switch:[99,102,241], cancel:[239,68,68], keep:[16,185,129] };

      for (const rec of result.recommendations) {
        checkPage(24);
        addRect(margin, y, contentW, 22, [17,17,24]);
        const aColor = ac[rec.action] ?? [120,120,140] as [number,number,number];
        doc.setFillColor(...aColor); doc.rect(margin+3, y+6, 16, 9, 'F');
        addText(actionLabel(rec.action).toUpperCase(), margin+11, y+12, { size: 6, style: 'bold', color: [10,10,15], align: 'center' });
        addText(rec.toolName, margin+23, y+9, { size: 10, style: 'bold', color: [240,240,255] });
        addText(rec.recommendedPlan ? `${rec.currentPlan} → ${rec.recommendedPlan}` : rec.recommendedTool ? `Switch to ${rec.recommendedTool}` : rec.currentPlan, margin+23, y+16, { size: 8, color: [100,100,130] });
        if (rec.savings > 0) addText(`-${formatCurrency(rec.savings)}/mo`, pageW-margin-3, y+13, { size: 10, style: 'bold', color: [16,185,129], align: 'right' });
        else addText('Optimal', pageW-margin-3, y+13, { size: 9, color: [16,185,129], align: 'right' });
        y += 24;
        checkPage(12);
        y = addText(`  ${rec.reason}`, margin+4, y, { size: 8, color: [120,120,140], maxWidth: contentW-4 }) + 4;
      }

      checkPage(16); y += 4; addRect(margin, y, contentW, 0.5, [40,40,60]); y += 6;
      addText('Powered by AI Spend Audit · aicostaudit.com · Pricing verified May 2026', pageW/2, y, { size: 7, color: [60,60,80], align: 'center' });
      doc.save(`ai-spend-audit-${auditId.slice(0,8)}.pdf`);
    } catch (err) { console.error('PDF export failed:', err); alert('PDF export failed. Run: npm install jspdf'); }
    finally { setLoading(false); }
  }

  return (
    <button onClick={handleExport} disabled={loading}
      style={{ display: 'flex', alignItems: 'center', gap: 8, background: loading ? 'rgba(255,255,255,0.04)' : 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.3)', color: loading ? '#444' : '#a5b4fc', borderRadius: 10, padding: '11px 20px', fontSize: 13, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', width: '100%', justifyContent: 'center' }}>
      {loading ? 'Generating PDF…' : (
        <>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
            <polyline points="7 10 12 15 17 10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          Download PDF Report
        </>
      )}
    </button>
  );
}

// ── EmbedSnippet ──────────────────────────────────────────────────────────────
// NOTE: Uses string concatenation to avoid JSX parser issues with <script> tags
function EmbedSnippet() {
  const [copied, setCopied] = useState(false);
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://aicostaudit.com';
  const divTag    = '<div id="ai-audit-widget"></div>';
  const scriptTag = '<script src="' + baseUrl + '/api/widget" async></script>';
  const snippet   = divTag + '\n' + scriptTag;

  function handleCopy() {
    navigator.clipboard.writeText(snippet).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  }

  return (
    <div>
      <div style={{ background: '#0a0a0f', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 8, padding: '10px 14px', fontFamily: 'monospace', fontSize: 11, color: '#6366f1', marginBottom: 8, whiteSpace: 'pre-wrap', wordBreak: 'break-all' as const }}>
        {divTag}{'\n'}{scriptTag}
      </div>
      <button onClick={handleCopy}
        style={{ background: copied ? 'rgba(16,185,129,0.15)' : 'rgba(99,102,241,0.15)', border: `1px solid ${copied ? 'rgba(16,185,129,0.3)' : 'rgba(99,102,241,0.3)'}`, color: copied ? '#10b981' : '#a5b4fc', borderRadius: 6, padding: '7px 16px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
        {copied ? '✓ Copied!' : 'Copy embed code'}
      </button>
    </div>
  );
}

// ── ReferralBlock ─────────────────────────────────────────────────────────────
function ReferralBlock() {
  const [code, setCode]           = useState<string | null>(null);
  const [inputCode, setInputCode] = useState('');
  const [loading, setLoading]     = useState(false);
  const [validating, setValidating] = useState(false);
  const [perk, setPerk]           = useState<string | null>(null);
  const [codeError, setCodeError] = useState('');
  const [copied, setCopied]       = useState(false);

  async function getMyCode() {
    setLoading(true);
    try {
      const res = await fetch('/api/referral', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) });
      const d = await res.json();
      if (d.code) setCode(d.code);
    } catch { /* silently fail */ }
    finally { setLoading(false); }
  }

  async function validateCode() {
    if (!inputCode.trim()) return;
    setValidating(true); setCodeError(''); setPerk(null);
    try {
      const res = await fetch(`/api/referral?code=${encodeURIComponent(inputCode.trim().toUpperCase())}`);
      const d = await res.json();
      if (d.valid) setPerk(d.perk);
      else setCodeError(d.error || 'Invalid code');
    } catch { setCodeError('Could not validate code'); }
    finally { setValidating(false); }
  }

  function copyCode() {
    if (!code) return;
    navigator.clipboard.writeText(code).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  }

  const fieldStyle = { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '9px 12px', color: 'white', fontSize: 13, outline: 'none' };

  return (
    <div style={card}>
      <div style={{ fontSize: 11, color: '#555', fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Referral Perks</div>
      <p style={{ fontSize: 12, color: '#555', margin: '0 0 14px', lineHeight: 1.6 }}>
        Share your code with a teammate or founder friend. When they book a Credex consultation, <strong style={{ color: '#a5b4fc' }}>both of you</strong> get 1 month of Credex credits free.
      </p>
      {!code ? (
        <button onClick={getMyCode} disabled={loading}
          style={{ background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)', color: '#a5b4fc', borderRadius: 8, padding: '9px 18px', fontSize: 13, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', marginBottom: 14 }}>
          {loading ? 'Generating…' : 'Get my referral code →'}
        </button>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <div style={{ ...fieldStyle, flex: 1, fontFamily: 'monospace', fontSize: 18, fontWeight: 800, color: '#a5b4fc', letterSpacing: 4, textAlign: 'center' as const }}>{code}</div>
          <button onClick={copyCode}
            style={{ background: copied ? 'rgba(16,185,129,0.15)' : 'rgba(99,102,241,0.15)', border: `1px solid ${copied ? 'rgba(16,185,129,0.3)' : 'rgba(99,102,241,0.3)'}`, color: copied ? '#10b981' : '#a5b4fc', borderRadius: 8, padding: '9px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
            {copied ? '✓' : 'Copy'}
          </button>
        </div>
      )}
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', margin: '14px 0' }} />
      <div style={{ fontSize: 11, color: '#555', marginBottom: 6 }}>Have a friend&apos;s code?</div>
      <div style={{ display: 'flex', gap: 8 }}>
        <input type="text" placeholder="SAVE-XXXX" maxLength={9} value={inputCode} onChange={(e) => setInputCode(e.target.value.toUpperCase())} style={{ ...fieldStyle, flex: 1, fontFamily: 'monospace', letterSpacing: 2 }} />
        <button onClick={validateCode} disabled={validating || !inputCode.trim()}
          style={{ background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)', color: '#a5b4fc', borderRadius: 8, padding: '9px 14px', fontSize: 12, fontWeight: 600, cursor: validating ? 'not-allowed' : 'pointer' }}>
          {validating ? '…' : 'Apply'}
        </button>
      </div>
      {codeError && <div style={{ fontSize: 11, color: '#fca5a5', marginTop: 6 }}>{codeError}</div>}
      {perk && (
        <div style={{ marginTop: 8, padding: '8px 12px', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 8, fontSize: 12, color: '#10b981' }}>
          ✓ Code applied! Perk unlocked: <strong>{perk}</strong> — mention this code when you book your Credex consultation.
        </div>
      )}
    </div>
  );
}

// ── Main result page ──────────────────────────────────────────────────────────
export default function ResultPage() {
  const params  = useParams();
  const router  = useRouter();
  const id      = params?.id as string;

  const [auditData, setAuditData] = useState<AuditData | null>(null);
  const [notFound, setNotFound]   = useState(false);

  useEffect(() => {
    if (!id) return;
    try {
      const local = localStorage.getItem(`audit-${id}`);
      if (local) { setAuditData(JSON.parse(local)); return; }
    } catch { /* fall through */ }

    fetch(`/api/audit/${id}`)
      .then(async (res) => {
        if (!res.ok) throw new Error('Not found');
        const data = await res.json();
        setAuditData({ id: data.id, result: data.result });
      })
      .catch(() => setNotFound(true));
  }, [id]);

  if (!auditData && !notFound) {
    return (
      <div style={{ minHeight: '100vh', background: '#0a0a0f', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 40, height: 40, borderRadius: '50%', border: '3px solid rgba(99,102,241,0.3)', borderTopColor: '#6366f1', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          <div style={{ color: '#555', fontSize: 14 }}>Loading your audit...</div>
        </div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div style={{ minHeight: '100vh', background: '#0a0a0f', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', maxWidth: 360, padding: '0 16px' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
          <h2 style={{ color: 'white', fontSize: 22, fontWeight: 800, margin: '0 0 8px' }}>Audit not found</h2>
          <p style={{ color: '#555', fontSize: 14, marginBottom: 24 }}>This audit link may have expired or the ID is incorrect.</p>
          <button onClick={() => router.push('/')} style={{ background: '#6366f1', color: 'white', border: 'none', padding: '12px 24px', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
            Run a New Audit →
          </button>
        </div>
      </div>
    );
  }

  const { result } = auditData!;
  const savings       = result.totalMonthlySavings;
  const optimizedRecs = result.recommendations.filter((r) => r.action !== 'keep');
  const keepRecs      = result.recommendations.filter((r) => r.action === 'keep');

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0f', color: 'white', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ maxWidth: 680, margin: '0 auto', padding: '48px 16px 80px' }}>

        {/* ── NAV ── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
          <button onClick={() => router.push('/')}
            style={{ background: 'none', border: '1px solid rgba(255,255,255,0.1)', color: '#555', borderRadius: 8, padding: '6px 14px', fontSize: 12, cursor: 'pointer', fontFamily: 'monospace' }}>
            ← New Audit
          </button>
          <div style={{ fontSize: 11, color: '#444', fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: 1 }}>
            Audit #{id?.slice(0, 8)}
          </div>
        </div>

        {/* ── HERO ── */}
        <SavingsHero result={result} />

        {/* ── AI SUMMARY ── */}
        <AISummaryBlock summary={result.summary} />

        {/* ── CREDEX CTA ── */}
        <CredexCTA monthlySavings={savings} />

        {/* ── BENCHMARK ── */}
        <BenchmarkBlock totalCurrentSpend={result.totalCurrentSpend} teamSize={result.teamSize} useCase={result.useCase} />

        {/* ── RECOMMENDATIONS ── */}
        {optimizedRecs.length > 0 && (
          <div style={card}>
            <div style={{ fontSize: 11, color: '#555', fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16 }}>
              ⚡ {optimizedRecs.length} Immediate Action{optimizedRecs.length > 1 ? 's' : ''} to Reduce Spend
            </div>
            {optimizedRecs.map((rec) => <RecommendationCard key={rec.toolId} rec={rec} />)}
          </div>
        )}

        {/* ── ALREADY OPTIMAL ── */}
        {keepRecs.length > 0 && (
          <div style={card}>
            <div style={{ fontSize: 11, color: '#555', fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16 }}>
              ✓ Already Optimal ({keepRecs.length})
            </div>
            {keepRecs.map((rec) => <RecommendationCard key={rec.toolId} rec={rec} />)}
          </div>
        )}

        {/* ── SHARE ── */}
        <div style={card}>
          <div style={{ fontSize: 11, color: '#555', fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>
            Share This Report
          </div>
          <ShareBlock auditId={id} monthlySavings={savings} />
        </div>

        {/* ── LEAD CAPTURE ── */}
        <LeadCapture auditId={id} monthlySavings={savings} />

        {/* ── PDF EXPORT ── */}
        <div style={card}>
          <div style={{ fontSize: 11, color: '#555', fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>Export Report</div>
          <p style={{ fontSize: 12, color: '#555', margin: '0 0 12px' }}>Download a formatted PDF — useful for sharing with your CFO or attaching to a budget review.</p>
          <PDFExportButton result={result} auditId={id} />
        </div>

        {/* ── EMBED WIDGET ── */}
        <div style={card}>
          <div style={{ fontSize: 11, color: '#555', fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>Embed on Your Site</div>
          <p style={{ fontSize: 12, color: '#555', margin: '0 0 12px', lineHeight: 1.6 }}>Drop this snippet into any blog post — your readers get a live audit tool without leaving your site.</p>
          <EmbedSnippet />
        </div>

        {/* ── REFERRAL ── */}
        <ReferralBlock />

        {/* ── FOOTER ── */}
        <div style={{ textAlign: 'center', marginTop: 32, fontSize: 11, color: '#2a2a35' }}>
          Pricing data current as of May 2026 · Built with ♥ for founders who hate waste
        </div>
      </div>
    </div>
  );
}
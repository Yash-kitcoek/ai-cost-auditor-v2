'use client';
// app/widget/page.tsx
// This page renders INSIDE the embed iframe.
// It's a stripped-down version of the main audit form — compact, no nav, no footer.
// When an audit completes, it posts the result up to the parent page via postMessage.

import { useState, useEffect } from 'react';
import { useFormState } from '@/hooks/useFormState';
import { PRICING, TOOL_NAMES } from '@/lib/audit/pricing';
import { ToolId } from '@/lib/audit/types';
import { formatCurrency } from '@/lib/utils/format';

// Top tools most likely to be relevant for a blogger's audience
const QUICK_TOOLS: ToolId[] = ['cursor', 'github-copilot', 'claude', 'chatgpt', 'openai-api'];

const s = {
  page: { minHeight: '100vh', background: '#0a0a0f', color: 'white', fontFamily: 'system-ui,sans-serif', padding: '16px' } as const,
  card: { background: '#111118', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: 16, marginBottom: 10 } as const,
  input: { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, padding: '7px 10px', color: 'white', fontSize: 12, outline: 'none', width: '100%', boxSizing: 'border-box' } as const,
  label: { fontSize: 10, color: '#555', fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4, display: 'block' } as const,
};

export default function WidgetPage() {
  const { input, hydrated, addTool, removeTool, updateTool, setTeamSize } = useFormState();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<{ id: string; savings: number; score: number } | null>(null);

  // Tell the parent iframe how tall we are after render
  useEffect(() => {
    function reportHeight() {
      window.parent.postMessage({
        type: 'AI_AUDIT_RESIZE',
        height: document.body.scrollHeight + 16,
      }, '*');
    }
    reportHeight();
    const observer = new ResizeObserver(reportHeight);
    observer.observe(document.body);
    return () => observer.disconnect();
  }, [result, input]);

  async function handleAudit() {
    if (!input.tools.length) { setError('Add at least one tool.'); return; }
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input, honeypot: '' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Audit failed');

      const savings = data.result.totalMonthlySavings;
      const score = data.result.score;
      setResult({ id: data.id, savings, score });

      // Notify the parent page
      window.parent.postMessage({
        type: 'AI_AUDIT_RESULT',
        result: { id: data.id, savings, score },
      }, '*');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  }

  if (!hydrated) return null;

  // ── Result state ──────────────────────────────────────────────────────────
  if (result) {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
    return (
      <div style={s.page}>
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          {result.savings > 0 ? (
            <>
              <div style={{ fontSize: 11, color: '#a5b4fc', fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
                Potential savings found
              </div>
              <div style={{ fontSize: 42, fontWeight: 900, background: 'linear-gradient(90deg,#6366f1,#a855f7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                {formatCurrency(result.savings)}/mo
              </div>
              <div style={{ fontSize: 12, color: '#555', margin: '6px 0 20px' }}>
                {formatCurrency(result.savings * 12)} per year
              </div>
            </>
          ) : (
            <>
              <div style={{ fontSize: 36, marginBottom: 8 }}>✅</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#10b981', marginBottom: 6 }}>Well optimised!</div>
              <div style={{ fontSize: 12, color: '#555', marginBottom: 20 }}>No significant overspend found.</div>
            </>
          )}

          <a
            href={`${baseUrl}/result/${result.id}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-block',
              background: 'linear-gradient(90deg,#6366f1,#a855f7)',
              color: 'white', textDecoration: 'none',
              padding: '10px 24px', borderRadius: 8,
              fontSize: 13, fontWeight: 600, marginBottom: 10,
            }}
          >
            See full breakdown →
          </a>

          <div>
            <button
              onClick={() => setResult(null)}
              style={{ background: 'none', border: '1px solid rgba(255,255,255,0.1)', color: '#555', borderRadius: 6, padding: '6px 14px', fontSize: 11, cursor: 'pointer' }}
            >
              Run another audit
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Form state ────────────────────────────────────────────────────────────
  return (
    <div style={s.page}>
      {/* Header */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 14, fontWeight: 800, color: 'white', marginBottom: 2 }}>
          AI Spend Audit
        </div>
        <div style={{ fontSize: 11, color: '#555' }}>
          See if your team is overpaying for AI tools
        </div>
      </div>

      {/* Team size */}
      <div style={s.card}>
        <label style={s.label}>Team size</label>
        <input
          type="number" min={1} max={10000}
          value={input.teamSize || 1}
          onChange={(e) => setTeamSize(Number(e.target.value))}
          style={{ ...s.input, width: 80 }}
        />
      </div>

      {/* Tool picker */}
      <div style={s.card}>
        <label style={s.label}>Your AI tools</label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
          {QUICK_TOOLS.map((toolId) => {
            const active = input.tools.some((t) => t.toolId === toolId);
            return (
              <button
                key={toolId}
                onClick={() => active ? removeTool(toolId) : addTool(toolId)}
                style={{
                  background: active ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${active ? 'rgba(99,102,241,0.5)' : 'rgba(255,255,255,0.08)'}`,
                  color: active ? '#a5b4fc' : '#666',
                  borderRadius: 6, padding: '5px 10px',
                  fontSize: 11, cursor: 'pointer',
                }}
              >
                {TOOL_NAMES[toolId]}
              </button>
            );
          })}
        </div>

        {/* Plan + spend per active tool */}
        {input.tools.map((entry) => {
          const plans = PRICING[entry.toolId] ?? [];
          return (
            <div key={entry.toolId} style={{ display: 'flex', gap: 6, marginBottom: 6, alignItems: 'center' }}>
              <span style={{ fontSize: 11, color: '#888', width: 80, flexShrink: 0 }}>
                {TOOL_NAMES[entry.toolId]}
              </span>
              <select
                value={entry.plan}
                onChange={(e) => updateTool(entry.toolId, { plan: e.target.value })}
                style={{ ...s.input, flex: 1 }}
              >
                {plans.map((p) => (
                  <option key={p.planId} value={p.planId}>{p.planId}</option>
                ))}
              </select>
              <input
                type="number" min={0} placeholder="$/mo"
                value={entry.monthlySpend || ''}
                onChange={(e) => updateTool(entry.toolId, { monthlySpend: Number(e.target.value) })}
                style={{ ...s.input, width: 60 }}
              />
            </div>
          );
        })}
      </div>

      {error && <div style={{ fontSize: 12, color: '#fca5a5', marginBottom: 8 }}>{error}</div>}

      <button
        onClick={handleAudit}
        disabled={loading || !input.tools.length}
        style={{
          width: '100%', background: loading ? '#1f2937' : 'linear-gradient(90deg,#6366f1,#a855f7)',
          color: loading ? '#555' : 'white',
          border: 'none', borderRadius: 10, padding: '12px',
          fontSize: 13, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
        }}
      >
        {loading ? 'Auditing…' : 'Run Free Audit →'}
      </button>
    </div>
  );
}
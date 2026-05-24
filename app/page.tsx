'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useFormState } from '@/hooks/useFormState';
import { PRICING, TOOL_NAMES } from '@/lib/audit/pricing';
import { ToolId } from '@/lib/audit/types';
import { formatCurrency } from '@/lib/utils/format';

const ALL_TOOLS: ToolId[] = [
  'cursor', 'github-copilot', 'claude', 'chatgpt',
  'anthropic-api', 'openai-api', 'gemini', 'windsurf',
];

const USE_CASES = [
  { id: 'coding',   label: '⌨️ Coding' },
  { id: 'writing',  label: '✍️ Writing' },
  { id: 'data',     label: '📊 Data' },
  { id: 'research', label: '🔍 Research' },
  { id: 'mixed',    label: '⚡ Mixed' },
] as const;

const TOOL_ICONS: Record<ToolId, string> = {
  cursor: '🖱️', 'github-copilot': '🐙', claude: '🔮', chatgpt: '💬',
  'anthropic-api': '🧠', 'openai-api': '🤖', gemini: '♊', windsurf: '🏄',
};

const inputStyle = {
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 6, padding: '8px',
  color: 'white', fontSize: 12,
  outline: 'none', width: '100%',
  boxSizing: 'border-box' as const,
};

export default function HomePage() {
  const router = useRouter();
  const { input, hydrated, addTool, removeTool, updateTool, setTeamSize, setUseCase } = useFormState();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [honeypot, setHoneypot] = useState('');
  const [email, setEmail] = useState('');

  const totalSpend = input.tools.reduce((sum, t) => sum + (t.monthlySpend || 0), 0);
  const hasUsageBased = input.tools.some((t) => {
    const plan = PRICING[t.toolId]?.find((p) => p.planId === t.plan);
    return plan?.isUsageBased;
  });

  async function handleSubmit() {
    if (!input.tools.length) { setError('Add at least one AI tool.'); return; }
    if (!email || !email.includes('@')) { setError('A valid email is required for pricing-change alerts.'); return; }

    setError('');
    setLoading(true);

    try {
      const toolsMap: Record<string, string> = {};
      const usageMap: Record<string, number> = {};

      for (const tool of input.tools) {
        const plans = PRICING[tool.toolId] || [];
        const matchedPlan = plans.find((p) => p.planId === tool.plan);
        const tierName = matchedPlan?.label || tool.plan;
        toolsMap[tool.toolId] = tierName;
        if (tool.monthlySpend && tool.monthlySpend > 0) {
          usageMap[tool.toolId] = tool.monthlySpend;
        }
      }

      const res = await fetch('/api/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          tools: toolsMap,
          usage: usageMap,
          honeypot,
          teamSize: input.teamSize,   // ← fixes benchmark NaN
          useCase: input.useCase,     // ← fixes benchmark NaN
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Audit failed');

      const auditId = data.auditId || data.id;
      localStorage.setItem(`audit-${auditId}`, JSON.stringify(data));
      router.push(`/result/${auditId}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
      setLoading(false);
    }
  }

  if (!hydrated) return null;

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0f', color: 'white', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ maxWidth: 640, margin: '0 auto', padding: '64px 16px' }}>

        {/* ── HEADER ── */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{
            display: 'inline-block', background: 'rgba(99,102,241,0.1)',
            border: '1px solid rgba(99,102,241,0.3)', borderRadius: 20,
            padding: '6px 16px', fontSize: 13, color: '#a5b4fc', marginBottom: 20,
          }}>
            Free · No login · 60-second audit
          </div>
          <h1 style={{ fontSize: 44, fontWeight: 800, margin: '0 0 12px', lineHeight: 1.2 }}>
            Are you overpaying<br />
            <span style={{
              background: 'linear-gradient(90deg,#6366f1,#a855f7,#10b981)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>
              for AI tools?
            </span>
          </h1>
          <p style={{ color: '#888', fontSize: 17, maxWidth: 420, margin: '0 auto' }}>
            Enter your subscriptions and get an instant audit showing where you&apos;re overspending.
          </p>
        </div>

        {/* ── TEAM CONFIG ── */}
        <div style={{ background: '#111118', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: 24, marginBottom: 12 }}>
          <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 120 }}>
              <label style={{ display: 'block', fontSize: 11, color: '#555', fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
                Team Size
              </label>
              <input
                type="number" min={1} value={input.teamSize}
                onChange={(e) => setTeamSize(Math.max(1, parseInt(e.target.value) || 1))}
                style={{ ...inputStyle, padding: '10px 12px', fontSize: 14 }}
              />
            </div>
            <div style={{ flex: 2, minWidth: 200 }}>
              <label style={{ display: 'block', fontSize: 11, color: '#555', fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
                Primary Use Case
              </label>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {USE_CASES.map((uc) => (
                  <button key={uc.id} onClick={() => setUseCase(uc.id)}
                    style={{
                      padding: '8px 14px', borderRadius: 8, fontSize: 13,
                      fontWeight: 500, cursor: 'pointer', border: 'none',
                      background: input.useCase === uc.id ? '#6366f1' : 'rgba(255,255,255,0.05)',
                      color: input.useCase === uc.id ? 'white' : '#888',
                    }}>
                    {uc.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── TOOL SELECTOR + CONFIG ── */}
        <div style={{ background: '#111118', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: 24, marginBottom: 12 }}>
          <label style={{ display: 'block', fontSize: 11, color: '#555', fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>
            Select AI Tools You Pay For
          </label>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8, marginBottom: 20 }}>
            {ALL_TOOLS.map((toolId) => {
              const active = input.tools.some((t) => t.toolId === toolId);
              return (
                <button key={toolId}
                  onClick={() => active ? removeTool(toolId) : addTool(toolId)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '10px 12px', borderRadius: 10, fontSize: 12,
                    fontWeight: 500, cursor: 'pointer',
                    border: active ? '1px solid rgba(99,102,241,0.5)' : '1px solid rgba(255,255,255,0.08)',
                    background: active ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.03)',
                    color: active ? '#a5b4fc' : '#666',
                  }}>
                  <span>{TOOL_ICONS[toolId]}</span>
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {TOOL_NAMES[toolId]}
                  </span>
                </button>
              );
            })}
          </div>

          {input.tools.length > 0 && (
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 16 }}>
              <div style={{
                display: 'grid', gridTemplateColumns: '2fr 2fr 1fr 1.5fr',
                gap: 8, marginBottom: 10,
                fontSize: 10, color: '#444', fontFamily: 'monospace',
                textTransform: 'uppercase', letterSpacing: 1,
              }}>
                <span>Tool</span><span>Plan</span><span>Seats</span><span>$/mo</span>
              </div>

              {input.tools.map((tool) => {
                const plans = PRICING[tool.toolId] || [];
                const currentPlan = plans.find((p) => p.planId === tool.plan);
                const isUsageBased = currentPlan?.isUsageBased ?? false;

                return (
                  <div key={tool.toolId} style={{
                    display: 'grid', gridTemplateColumns: '2fr 2fr 1fr 1.5fr',
                    gap: 8, alignItems: 'center', marginBottom: 10,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#ccc' }}>
                      <span>{TOOL_ICONS[tool.toolId]}</span>
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {TOOL_NAMES[tool.toolId]}
                      </span>
                    </div>

                    <select
                      value={tool.plan}
                      onChange={(e) => {
                        const plan = plans.find((p) => p.planId === e.target.value);
                        const newSpend = plan?.isUsageBased
                          ? tool.monthlySpend
                          : (plan?.pricePerSeat || 0) * tool.seats;
                        updateTool(tool.toolId, { plan: e.target.value, monthlySpend: newSpend });
                      }}
                      style={{ ...inputStyle, appearance: 'none' as const }}>
                      {plans.map((p) => (
                        <option key={p.planId} value={p.planId} style={{ background: '#1a1a25' }}>
                          {p.label}
                          {p.pricePerSeat > 0 ? ` — $${p.pricePerSeat}/seat` : p.isUsageBased ? ' — variable' : ' — Free'}
                        </option>
                      ))}
                    </select>

                    <input
                      type="number" min={1} value={tool.seats}
                      disabled={isUsageBased}
                      onChange={(e) => {
                        const seats = Math.max(1, parseInt(e.target.value) || 1);
                        const plan = plans.find((p) => p.planId === tool.plan);
                        updateTool(tool.toolId, {
                          seats,
                          monthlySpend: plan?.isUsageBased ? tool.monthlySpend : (plan?.pricePerSeat || 0) * seats,
                        });
                      }}
                      style={{
                        ...inputStyle, textAlign: 'center',
                        opacity: isUsageBased ? 0.35 : 1,
                        cursor: isUsageBased ? 'not-allowed' : 'text',
                      }}
                    />

                    {isUsageBased ? (
                      <div style={{ position: 'relative' }}>
                        <span style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', color: '#6366f1', fontSize: 12 }}>$</span>
                        <input
                          type="number" min={0}
                          value={tool.monthlySpend || ''}
                          placeholder="0"
                          onChange={(e) => updateTool(tool.toolId, { monthlySpend: parseFloat(e.target.value) || 0 })}
                          style={{
                            ...inputStyle, paddingLeft: 20,
                            background: 'rgba(99,102,241,0.06)',
                            border: '1px solid rgba(99,102,241,0.2)',
                            color: '#a5b4fc',
                          }}
                        />
                      </div>
                    ) : (
                      <div style={{ position: 'relative' }}>
                        <span style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', color: '#555', fontSize: 12 }}>$</span>
                        <input
                          type="number" min={0} value={tool.monthlySpend}
                          onChange={(e) => updateTool(tool.toolId, { monthlySpend: parseFloat(e.target.value) || 0 })}
                          style={{ ...inputStyle, paddingLeft: 20 }}
                        />
                      </div>
                    )}
                  </div>
                );
              })}

              {hasUsageBased && (
                <div style={{
                  marginTop: 8, paddingTop: 10,
                  borderTop: '1px solid rgba(255,255,255,0.04)',
                  fontSize: 11, color: '#555', fontFamily: 'monospace',
                  display: 'flex', alignItems: 'center', gap: 6,
                }}>
                  <span style={{ color: '#6366f1' }}>💡</span>
                  <span>
                    For usage-based APIs, enter your <strong style={{ color: '#777' }}>actual last month&apos;s bill</strong> from your provider dashboard.
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── EMAIL ── */}
        <div style={{ background: '#111118', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: 24, marginBottom: 12 }}>
          <label style={{ display: 'block', fontSize: 11, color: '#555', fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
            Email — for pricing-change alerts
          </label>
          <input
            type="email"
            placeholder="you@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ ...inputStyle, padding: '10px 12px', fontSize: 14 }}
          />
          <p style={{ fontSize: 11, color: '#444', marginTop: 8, fontFamily: 'monospace' }}>
            We&apos;ll notify you when AI tool pricing changes affect your audit. No spam.
          </p>
        </div>

        {/* Honeypot */}
        <input
          type="text" name="website" value={honeypot}
          onChange={(e) => setHoneypot(e.target.value)}
          style={{ display: 'none' }} tabIndex={-1} autoComplete="off"
        />

        {/* ── TOTAL + SUBMIT ── */}
        {input.tools.length > 0 && (
          <p style={{ textAlign: 'center', fontSize: 13, color: '#555', marginBottom: 8, fontFamily: 'monospace' }}>
            Current total:{' '}
            <strong style={{ color: 'white' }}>{formatCurrency(totalSpend)}/mo</strong>
            {hasUsageBased && (
              <span style={{ color: '#444', fontSize: 11 }}> + variable API costs</span>
            )}
          </p>
        )}

        {error && (
          <div style={{
            background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
            borderRadius: 10, padding: 12, color: '#fca5a5',
            fontSize: 14, textAlign: 'center', marginBottom: 12,
          }}>
            {error}
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={loading || !input.tools.length}
          style={{
            width: '100%',
            background: loading || !input.tools.length ? '#1f2937' : '#6366f1',
            color: loading || !input.tools.length ? '#555' : 'white',
            border: 'none', padding: '16px', borderRadius: 14,
            fontSize: 16, fontWeight: 600,
            cursor: loading || !input.tools.length ? 'not-allowed' : 'pointer',
            transition: 'background 0.15s',
          }}>
          {loading ? 'Analyzing your stack...' : 'Run My AI Spend Audit →'}
        </button>

        <p style={{ textAlign: 'center', fontSize: 12, color: '#333', marginTop: 10 }}>
          Free. No account needed. Results in 5 seconds.
        </p>
      </div>
    </div>
  );
}
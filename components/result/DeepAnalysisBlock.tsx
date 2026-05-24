// components/result/DeepAnalysisBlock.tsx
// Shows the 3-layer AI analysis per tool
// Loads async — shows skeleton while fetching, never blocks page render

'use client';

import { useEffect, useState } from 'react';
import { AuditResult, AuditInput } from '@/lib/audit/types';

interface ToolDeepAnalysis {
  toolId: string;
  toolName: string;
  problem: string;
  planOptimization: string;
  alternativeOption: string | null;
  creditsInsight: string | null;
  reason: string;
}

interface DeepAuditAnalysis {
  perTool: ToolDeepAnalysis[];
  finalSummary: string;
  biggestWaste: string;
  isOverbuilt: boolean;
  generatedAt: string;
}

const TOOL_ICONS: Record<string, string> = {
  cursor: '🖱️', 'github-copilot': '🐙', claude: '🔮', chatgpt: '💬',
  'anthropic-api': '🧠', 'openai-api': '🤖', gemini: '♊', windsurf: '🏄',
};

function SkeletonRow() {
  return (
    <div style={{
      background: '#111118', border: '1px solid rgba(255,255,255,0.06)',
      borderRadius: 12, padding: 20, marginBottom: 10,
      animation: 'pulse 1.5s ease-in-out infinite',
    }}>
      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>
      <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
        <div style={{ width: 28, height: 28, background: 'rgba(255,255,255,0.08)', borderRadius: '50%' }} />
        <div style={{ width: 120, height: 20, background: 'rgba(255,255,255,0.08)', borderRadius: 4 }} />
      </div>
      <div style={{ width: '90%', height: 14, background: 'rgba(255,255,255,0.06)', borderRadius: 4, marginBottom: 8 }} />
      <div style={{ width: '70%', height: 14, background: 'rgba(255,255,255,0.06)', borderRadius: 4 }} />
    </div>
  );
}

function AnalysisTag({
  label, value, color,
}: { label: string; value: string; color: string }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{
        fontSize: 10, fontFamily: 'monospace', textTransform: 'uppercase',
        letterSpacing: 1, color: '#444', marginBottom: 4,
      }}>
        {label}
      </div>
      <div style={{ fontSize: 13, color, lineHeight: 1.6 }}>
        {value}
      </div>
    </div>
  );
}

function ToolAnalysisCard({ analysis }: { analysis: ToolDeepAnalysis }) {
  const [expanded, setExpanded] = useState(false);
  const hasExtras = analysis.alternativeOption || analysis.creditsInsight;

  return (
    <div style={{
      background: '#111118',
      border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: 14, padding: '16px 18px', marginBottom: 10,
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 18 }}>{TOOL_ICONS[analysis.toolId] || '🔧'}</span>
          <span style={{ fontWeight: 700, color: 'white', fontSize: 14 }}>{analysis.toolName}</span>
        </div>
        {hasExtras && (
          <button
            onClick={() => setExpanded(!expanded)}
            style={{
              background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)',
              borderRadius: 6, padding: '4px 10px', fontSize: 11,
              color: '#a5b4fc', cursor: 'pointer', fontFamily: 'monospace',
            }}
          >
            {expanded ? '▲ Less' : '▼ Deep Analysis'}
          </button>
        )}
      </div>

      <AnalysisTag
        label="Problem"
        value={analysis.problem}
        color="#fca5a5"
      />

      <AnalysisTag
        label="Plan Optimization"
        value={analysis.planOptimization}
        color={analysis.planOptimization.toLowerCase().includes('appropriate') ? '#6ee7b7' : '#fde68a'}
      />

      {expanded && (
        <>
          {analysis.alternativeOption && (
            <AnalysisTag
              label="Alternative Option"
              value={analysis.alternativeOption}
              color="#7dd3fc"
            />
          )}
          {analysis.creditsInsight && (
            <div style={{
              background: 'rgba(124,58,237,0.08)',
              border: '1px solid rgba(124,58,237,0.15)',
              borderRadius: 8, padding: '10px 12px', marginBottom: 10,
            }}>
              <div style={{
                fontSize: 10, fontFamily: 'monospace', textTransform: 'uppercase',
                letterSpacing: 1, color: '#a78bfa', marginBottom: 4,
              }}>
                💰 Credits Insight
              </div>
              <div style={{ fontSize: 13, color: '#c4b5fd', lineHeight: 1.6 }}>
                {analysis.creditsInsight}
              </div>
            </div>
          )}
        </>
      )}

      <div style={{
        fontSize: 12, color: '#555', borderTop: '1px solid rgba(255,255,255,0.04)',
        paddingTop: 8, marginTop: 4, lineHeight: 1.6,
        fontStyle: 'italic',
      }}>
        {analysis.reason}
      </div>
    </div>
  );
}

interface Props {
  result: AuditResult;
  input: AuditInput;
}

export default function DeepAnalysisBlock({ result, input }: Props) {
  const [analysis, setAnalysis] = useState<DeepAuditAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    async function fetchAnalysis() {
      try {
        const res = await fetch('/api/ai-analysis', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ result, input }),
        });
        if (!res.ok) throw new Error('Failed');
        const data = await res.json();
        setAnalysis(data);
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    }
    fetchAnalysis();
  }, [input, result]);

  return (
    <div style={{ marginBottom: 16 }}>
      {/* Section header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14,
      }}>
        <div style={{
          fontSize: 11, color: '#555', fontFamily: 'monospace',
          textTransform: 'uppercase', letterSpacing: 1,
        }}>
          Deep Analysis
        </div>
        <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.05)' }} />
        {loading && (
          <div style={{ fontSize: 11, color: '#444', fontFamily: 'monospace' }}>
            ⚡ AI analyzing...
          </div>
        )}
        {analysis && (
          <div style={{ fontSize: 11, color: '#444', fontFamily: 'monospace' }}>
            claude-sonnet
          </div>
        )}
      </div>

      {/* Final summary */}
      {analysis && (
        <div style={{
          background: '#111118',
          border: `1px solid ${analysis.isOverbuilt ? 'rgba(239,68,68,0.2)' : 'rgba(99,102,241,0.2)'}`,
          borderRadius: 14, padding: '16px 18px', marginBottom: 14,
        }}>
          <div style={{ display: 'flex', gap: 10, marginBottom: 10, flexWrap: 'wrap' }}>
            <div style={{
              fontSize: 11, background: 'rgba(99,102,241,0.1)',
              border: '1px solid rgba(99,102,241,0.2)', borderRadius: 6,
              padding: '3px 10px', color: '#a5b4fc', fontFamily: 'monospace',
            }}>
              Biggest waste: {analysis.biggestWaste}
            </div>
            <div style={{
              fontSize: 11,
              background: analysis.isOverbuilt ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)',
              border: `1px solid ${analysis.isOverbuilt ? 'rgba(239,68,68,0.2)' : 'rgba(16,185,129,0.2)'}`,
              borderRadius: 6, padding: '3px 10px',
              color: analysis.isOverbuilt ? '#fca5a5' : '#6ee7b7',
              fontFamily: 'monospace',
            }}>
              {analysis.isOverbuilt ? '⚠️ Stack overbuilt for team size' : '✓ Stack size appropriate'}
            </div>
          </div>
          <p style={{ fontSize: 14, color: '#bbb', lineHeight: 1.75, margin: 0 }}>
            {analysis.finalSummary}
          </p>
        </div>
      )}

      {/* Loading skeletons */}
      {loading && (
        <>
          {result.recommendations.slice(0, 3).map((_, i) => (
            <SkeletonRow key={i} />
          ))}
        </>
      )}

      {/* Error state */}
      {error && (
        <div style={{
          background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: 12, padding: '14px 18px',
          fontSize: 13, color: '#555', textAlign: 'center',
        }}>
          Deep analysis unavailable — rule-based recommendations above are still accurate.
        </div>
      )}

      {/* Per-tool analysis cards */}
      {analysis && analysis.perTool.map((toolAnalysis) => (
        <ToolAnalysisCard key={toolAnalysis.toolId} analysis={toolAnalysis} />
      ))}
    </div>
  );
}

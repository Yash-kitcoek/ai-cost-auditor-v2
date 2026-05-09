import { ToolRecommendation } from '@/lib/audit/types';
import { formatCurrency, actionLabel, actionColor, savingsBadgeColor } from '@/lib/utils/format';

const TOOL_ICONS: Record<string, string> = {
  cursor: '🖱️', 'github-copilot': '🐙', claude: '🔮', chatgpt: '💬',
  'anthropic-api': '🧠', 'openai-api': '🤖', gemini: '♊', windsurf: '🏄',
};

export default function RecommendationCard({ rec }: { rec: ToolRecommendation }) {
  const color = savingsBadgeColor(rec.savings);
  const hasAction = rec.action !== 'keep';

  return (
    <div style={{
      background: '#111118',
      border: `1px solid ${hasAction ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.06)'}`,
      borderRadius: 16, padding: 20, marginBottom: 10,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
        {/* Left */}
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <span style={{ fontSize: 18 }}>{TOOL_ICONS[rec.toolId] || '🔧'}</span>
            <span style={{ fontWeight: 700, color: 'white', fontSize: 15 }}>{rec.toolName}</span>
            <span style={{ fontSize: 11, color: '#555', fontFamily: 'monospace', background: 'rgba(255,255,255,0.05)', padding: '2px 8px', borderRadius: 4 }}>
              {rec.currentPlan}
            </span>
          </div>
          <p style={{ fontSize: 13, color: '#888', margin: '0 0 8px', lineHeight: 1.65 }}>{rec.reason}</p>
          {rec.recommendedPlan && (
            <div style={{ fontSize: 12, color: '#555', display: 'flex', alignItems: 'center', gap: 6 }}>
              <span>→</span>
              <span>Downgrade to <strong style={{ color: '#a5b4fc' }}>{rec.recommendedPlan}</strong></span>
              <span style={{ color: '#333' }}>·</span>
              <span style={{ color: '#555' }}>{formatCurrency(rec.recommendedSpend)}/mo</span>
            </div>
          )}
          {rec.recommendedTool && (
            <div style={{ fontSize: 12, color: '#555', display: 'flex', alignItems: 'center', gap: 6 }}>
              <span>→</span>
              <span>Switch to <strong style={{ color: '#7dd3fc' }}>{rec.recommendedTool}</strong></span>
              <span style={{ color: '#333' }}>·</span>
              <span style={{ color: '#555' }}>{formatCurrency(rec.recommendedSpend)}/mo</span>
            </div>
          )}
        </div>
        {/* Right */}
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{
            fontSize: 12, fontWeight: 700, padding: '4px 12px', borderRadius: 6,
            border: `1px solid ${color}33`, color, marginBottom: 6, whiteSpace: 'nowrap',
          }}>
            {rec.savings > 0 ? `−${formatCurrency(rec.savings)}/mo` : '✓ Optimal'}
          </div>
          <div style={{ fontSize: 11, fontFamily: 'monospace', color: actionColor(rec.action) }}>
            {actionLabel(rec.action)}
          </div>
          {rec.savings > 0 && (
            <div style={{ fontSize: 10, color: '#444', fontFamily: 'monospace', marginTop: 4 }}>
              saves {formatCurrency(rec.savings * 12)}/yr
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
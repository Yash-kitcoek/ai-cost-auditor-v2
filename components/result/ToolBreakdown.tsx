import { AuditResult } from '@/lib/audit/types';
import RecommendationCard from './RecommendationCard';

export default function ToolBreakdown({ result }: { result: AuditResult }) {
  const actionOrder = { cancel: 0, switch: 1, downgrade: 2, keep: 3 };
  const sorted = [...result.recommendations].sort(
    (a, b) => (actionOrder[a.action] ?? 9) - (actionOrder[b.action] ?? 9) || b.savings - a.savings
  );

  const savingsRecs = sorted.filter((r) => r.savings > 0);
  const keepRecs = sorted.filter((r) => r.savings === 0);

  return (
    <div>
      <div style={{ fontSize: 11, color: '#555', fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 14 }}>
        Tool Breakdown ({result.recommendations.length} tools)
      </div>

      {savingsRecs.length > 0 && (
        <div style={{ marginBottom: 8 }}>
          <div style={{ fontSize: 11, color: '#f59e0b', fontFamily: 'monospace', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span>⚡</span> Recommendations ({savingsRecs.length})
          </div>
          {savingsRecs.map((rec) => <RecommendationCard key={rec.toolId} rec={rec} />)}
        </div>
      )}

      {keepRecs.length > 0 && (
        <div>
          {savingsRecs.length > 0 && (
            <div style={{ fontSize: 11, color: '#555', fontFamily: 'monospace', margin: '16px 0 8px', display: 'flex', alignItems: 'center', gap: 6 }}>
              <span>✓</span> Already Optimal ({keepRecs.length})
            </div>
          )}
          {keepRecs.map((rec) => <RecommendationCard key={rec.toolId} rec={rec} />)}
        </div>
      )}
    </div>
  );
}
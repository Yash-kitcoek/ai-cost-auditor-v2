import { formatCurrency } from '@/lib/utils/format';

interface Props {
  totalMonthlySavings: number;
  totalAnnualSavings: number;
  totalCurrentSpend: number;
  totalOptimizedSpend: number;
  isAlreadyOptimal: boolean;
}

export default function SavingsHero({
  totalMonthlySavings, totalAnnualSavings,
  totalCurrentSpend, totalOptimizedSpend, isAlreadyOptimal,
}: Props) {
  if (isAlreadyOptimal) {
    return (
      <div style={{
        background: 'rgba(59,130,246,0.05)', border: '1px solid rgba(59,130,246,0.2)',
        borderRadius: 20, padding: 40, textAlign: 'center', marginBottom: 20,
      }}>
        <div style={{ fontSize: 52, marginBottom: 12 }}>✓</div>
        <div style={{ fontSize: 34, fontWeight: 800, color: '#60a5fa', marginBottom: 8 }}>
          You&apos;re Already Optimized
        </div>
        <p style={{ color: '#888', margin: '0 0 12px', fontSize: 15 }}>
          No major savings found — your stack is well-matched to your team size and use case.
        </p>
        <div style={{ color: '#555', fontFamily: 'monospace', fontSize: 13 }}>
          Current spend: {formatCurrency(totalCurrentSpend)}/mo
        </div>
      </div>
    );
  }

  const isHighSavings = totalMonthlySavings > 500;

  return (
    <div style={{
      background: isHighSavings ? 'rgba(16,185,129,0.05)' : 'rgba(245,158,11,0.05)',
      border: `1px solid ${isHighSavings ? 'rgba(16,185,129,0.25)' : 'rgba(245,158,11,0.25)'}`,
      borderRadius: 20, padding: 40, textAlign: 'center', marginBottom: 20,
    }}>
      <div style={{ fontSize: 12, color: '#888', fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 10 }}>
        Potential Monthly Savings
      </div>
      <div style={{ fontSize: 60, fontWeight: 800, color: isHighSavings ? '#34d399' : '#fbbf24', lineHeight: 1, marginBottom: 6 }}>
        {formatCurrency(totalMonthlySavings)}
      </div>
      <div style={{ fontSize: 20, color: isHighSavings ? '#6ee7b7' : '#fde68a', marginBottom: 14, fontWeight: 600 }}>
        {formatCurrency(totalAnnualSavings)} per year
      </div>
      <div style={{ fontSize: 13, color: '#555', fontFamily: 'monospace' }}>
        {formatCurrency(totalCurrentSpend)}/mo today &nbsp;→&nbsp; {formatCurrency(totalOptimizedSpend)}/mo optimized
      </div>
    </div>
  );
}
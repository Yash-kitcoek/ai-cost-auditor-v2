'use client';
import { PRICING } from '@/lib/audit/pricing';
import { ToolId } from '@/lib/audit/types';

interface Props {
  toolId: ToolId;
  value: string;
  onChange: (planId: string, newSpend: number, seats: number) => void;
  seats: number;
}

export default function PlanDropdown({ toolId, value, onChange, seats }: Props) {
  const plans = PRICING[toolId] || [];

  return (
    <select
      value={value}
      onChange={(e) => {
        const plan = plans.find((p) => p.planId === e.target.value);
        onChange(e.target.value, plan ? plan.pricePerSeat * seats : 0, seats);
      }}
      style={{
        width: '100%', background: 'rgba(255,255,255,0.05)',
        border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8,
        padding: '9px 10px', color: 'white', fontSize: 13,
        fontFamily: 'inherit', cursor: 'pointer', outline: 'none',
      }}
    >
      {plans.map((p) => (
        <option key={p.planId} value={p.planId} style={{ background: '#1a1a25' }}>
          {p.label}{p.pricePerSeat > 0 ? ` — $${p.pricePerSeat}/seat` : ' — Free'}
        </option>
      ))}
    </select>
  );
}
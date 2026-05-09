'use client';

interface Props {
  value: number;
  seats: number;
  onChange: (spend: number) => void;
  onSeatsChange: (seats: number, newSpend: number) => void;
  planPricePerSeat: number;
}

export default function SpendInput({ value, seats, onChange, onSeatsChange, planPricePerSeat }: Props) {
  return (
    <div style={{ display: 'flex', gap: 8 }}>
      {/* Seats */}
      <div style={{ flex: 1 }}>
        <input
          type="number" min={1} value={seats}
          onChange={(e) => {
            const s = Math.max(1, parseInt(e.target.value) || 1);
            onSeatsChange(s, planPricePerSeat * s);
          }}
          title="Number of seats"
          style={{
            width: '100%', background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8,
            padding: '9px 8px', color: 'white', fontSize: 13,
            textAlign: 'center', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box',
          }}
        />
      </div>
      {/* Monthly spend */}
      <div style={{ flex: 1.5, position: 'relative' }}>
        <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#555', fontSize: 13 }}>$</span>
        <input
          type="number" min={0} value={value}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
          title="Monthly spend in USD"
          style={{
            width: '100%', background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8,
            padding: '9px 8px 9px 22px', color: 'white', fontSize: 13,
            fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box',
          }}
        />
      </div>
    </div>
  );
}
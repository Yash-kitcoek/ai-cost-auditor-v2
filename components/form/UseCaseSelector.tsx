'use client';
import { UseCase } from '@/lib/audit/types';

const USE_CASES: { id: UseCase; label: string; icon: string; desc: string }[] = [
  { id: 'coding',   label: 'Coding',    icon: '⌨️', desc: 'Code generation, completion, review' },
  { id: 'writing',  label: 'Writing',   icon: '✍️', desc: 'Docs, content, copy' },
  { id: 'data',     label: 'Data',      icon: '📊', desc: 'Analysis, SQL, reports' },
  { id: 'research', label: 'Research',  icon: '🔍', desc: 'Summarization, deep dives' },
  { id: 'mixed',    label: 'Mixed',     icon: '⚡', desc: 'Multiple use cases' },
];

interface Props {
  value: UseCase;
  onChange: (uc: UseCase) => void;
}

export default function UseCaseSelector({ value, onChange }: Props) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 11, color: '#555', fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>
        Primary Use Case
      </label>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {USE_CASES.map((uc) => {
          const active = value === uc.id;
          return (
            <button key={uc.id} onClick={() => onChange(uc.id)}
              title={uc.desc}
              style={{
                display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px',
                borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer',
                border: active ? '1px solid rgba(99,102,241,0.5)' : '1px solid rgba(255,255,255,0.08)',
                background: active ? '#6366f1' : 'rgba(255,255,255,0.04)',
                color: active ? 'white' : '#888', fontFamily: 'inherit',
              }}>
              <span>{uc.icon}</span> {uc.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
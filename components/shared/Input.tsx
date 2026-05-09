import React from 'react';

interface InputProps {
  label?: string;
  type?: 'text' | 'email' | 'number' | 'password';
  value: string | number;
  onChange: (value: string) => void;
  placeholder?: string;
  min?: number;
  max?: number;
  prefix?: string;
  suffix?: string;
  hint?: string;
  error?: string;
  disabled?: boolean;
}

export default function Input({
  label, type = 'text', value, onChange, placeholder,
  min, max, prefix, suffix, hint, error, disabled,
}: InputProps) {
  const inputStyle: React.CSSProperties = {
    width: '100%', background: 'rgba(255,255,255,0.05)',
    border: `1px solid ${error ? 'rgba(239,68,68,0.4)' : 'rgba(255,255,255,0.1)'}`,
    borderRadius: 8, padding: prefix ? '10px 12px 10px 32px' : '10px 12px',
    color: 'white', fontSize: 14, fontFamily: 'inherit', boxSizing: 'border-box' as const,
    outline: 'none', opacity: disabled ? 0.5 : 1,
  };

  return (
    <div style={{ width: '100%' }}>
      {label && (
        <label style={{ display: 'block', fontSize: 11, color: '#555', fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>
          {label}
        </label>
      )}
      <div style={{ position: 'relative' }}>
        {prefix && <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#555', fontSize: 14 }}>{prefix}</span>}
        <input
          type={type} value={value} placeholder={placeholder} min={min} max={max} disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          style={inputStyle}
        />
        {suffix && <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: '#555', fontSize: 13 }}>{suffix}</span>}
      </div>
      {error && <p style={{ margin: '4px 0 0', fontSize: 12, color: '#fca5a5' }}>{error}</p>}
      {hint && !error && <p style={{ margin: '4px 0 0', fontSize: 12, color: '#555' }}>{hint}</p>}
    </div>
  );
}
import React from 'react';

interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  loading?: boolean;
  type?: 'button' | 'submit';
}

export default function Button({
  children, onClick, disabled, variant = 'primary',
  size = 'md', fullWidth, loading, type = 'button',
}: ButtonProps) {
  const base: React.CSSProperties = {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    gap: 8, fontWeight: 600, borderRadius: 12, border: 'none', cursor: disabled || loading ? 'not-allowed' : 'pointer',
    width: fullWidth ? '100%' : undefined, transition: 'all 0.15s ease', fontFamily: 'inherit',
    opacity: disabled || loading ? 0.5 : 1,
  };

  const sizes: Record<string, React.CSSProperties> = {
    sm: { padding: '8px 16px', fontSize: 13 },
    md: { padding: '12px 20px', fontSize: 14 },
    lg: { padding: '16px 28px', fontSize: 16 },
  };

  const variants: Record<string, React.CSSProperties> = {
    primary:   { background: '#6366f1', color: 'white' },
    secondary: { background: 'rgba(255,255,255,0.07)', color: '#ccc', border: '1px solid rgba(255,255,255,0.1)' },
    danger:    { background: 'rgba(239,68,68,0.15)', color: '#fca5a5', border: '1px solid rgba(239,68,68,0.2)' },
    ghost:     { background: 'transparent', color: '#888', border: '1px solid rgba(255,255,255,0.08)' },
  };

  return (
    <button type={type} onClick={onClick} disabled={disabled || loading}
      style={{ ...base, ...sizes[size], ...variants[variant] }}>
      {loading && (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ animation: 'spin 1s linear infinite' }}>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" opacity={0.25} />
          <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      )}
      {children}
    </button>
  );
}
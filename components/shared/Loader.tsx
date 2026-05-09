export default function Loader({ text = 'Loading...' }: { text?: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, padding: 48 }}>
      <div style={{
        width: 40, height: 40, borderRadius: '50%',
        border: '2px solid rgba(99,102,241,0.2)',
        borderTopColor: '#6366f1',
        animation: 'spin 0.8s linear infinite',
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <p style={{ color: '#555', fontSize: 13, fontFamily: 'monospace', margin: 0 }}>{text}</p>
    </div>
  );
}
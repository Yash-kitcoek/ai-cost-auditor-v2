'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0f', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'sans-serif' }}>
      <div style={{ textAlign: 'center', maxWidth: 500, padding: 24 }}>
        <h1 style={{ fontSize: 40, marginBottom: 16 }}>AI Cost Audit</h1>
        <p style={{ color: '#888', marginBottom: 32 }}>
          Find out where you are overpaying for AI tools.
        </p>
        <button
  onClick={() => alert('Coming soon!')}
  style={{ background: '#6366f1', color: 'white' }}
>
  Start Free Audit →
</button>
      </div>
    </div>
  );
}
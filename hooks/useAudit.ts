'use client';
import { useState } from 'react';
import { AuditInput, AuditResult } from '@/lib/audit/types';

interface AuditResponse {
  id: string;
  result: AuditResult;
}

export function useAudit() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [response, setResponse] = useState<AuditResponse | null>(null);

  async function runAudit(input: AuditInput, honeypot = ''): Promise<AuditResponse | null> {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input, honeypot }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Audit failed');
      setResponse(data);
      return data;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Something went wrong.';
      setError(msg);
      return null;
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setResponse(null);
    setError('');
  }

  return { runAudit, loading, error, response, reset };
}
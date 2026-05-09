import { NextRequest, NextResponse } from 'next/server';
import { runAudit } from '@/lib/audit/engine';
import { generateAISummary } from '@/lib/ai/claude';
import { saveAudit } from '@/lib/db/supabase';
import { AuditInput } from '@/lib/audit/types';
import { nanoid } from 'nanoid';

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + 3600_000 });
    return false;
  }
  if (entry.count >= 10) return true;
  entry.count++;
  return false;
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  if (isRateLimited(ip)) {
    return NextResponse.json({ error: 'Too many requests.' }, { status: 429 });
  }

  let body: { input: AuditInput; honeypot?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  if (body.honeypot) {
    return NextResponse.json({ error: 'Bot detected' }, { status: 400 });
  }

  if (!body.input?.tools?.length) {
    return NextResponse.json({ error: 'Add at least one tool.' }, { status: 400 });
  }

  const result = runAudit(body.input);
  result.summary = await generateAISummary(result);

  const id = nanoid(10);
  await saveAudit({ id, input: body.input, result, createdAt: new Date().toISOString() });

  return NextResponse.json({ id, result });
}
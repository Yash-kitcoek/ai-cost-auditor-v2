import { NextRequest, NextResponse } from 'next/server';
import { runAudit } from '@/lib/audit/engine';
import { generateAISummary } from '@/lib/ai/claude';
import { saveAudit } from '@/lib/db/supabase';
import { AuditInput } from '@/lib/audit/types';
import { nanoid } from 'nanoid';

// Simple in-memory rate limiter (per IP, 10 audits/hour)
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
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';

  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { status: 429 }
    );
  }

  let body: { input: AuditInput; honeypot?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  // Honeypot check
  if (body.honeypot) {
    return NextResponse.json({ error: 'Bot detected' }, { status: 400 });
  }

  const { input } = body;

  if (!input || !Array.isArray(input.tools) || input.tools.length === 0) {
    return NextResponse.json(
      { error: 'At least one tool is required.' },
      { status: 400 }
    );
  }

  if (input.tools.length > 20) {
    return NextResponse.json({ error: 'Too many tools.' }, { status: 400 });
  }

  // Run audit (pure sync logic)
  const result = runAudit(input);

  // Generate AI summary (with fallback)
  const summary = await generateAISummary(result);
  result.summary = summary;

  // Persist audit
  const id = nanoid(10);
  const savedAudit = {
    id,
    input,
    result,
    createdAt: new Date().toISOString(),
  };
  await saveAudit(savedAudit);

  return NextResponse.json({ id, result });
}
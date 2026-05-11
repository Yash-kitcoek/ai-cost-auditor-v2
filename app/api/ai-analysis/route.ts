// app/api/ai-analysis/route.ts
// Separate endpoint for deep AI analysis
// Called async from result page — doesn't block the main audit response
// Falls back gracefully if Anthropic API is unavailable

import { NextRequest, NextResponse } from 'next/server';
import { generateDeepAnalysis } from '@/lib/ai/deepAnalysis';
import { AuditResult, AuditInput } from '@/lib/audit/types';
export const dynamic = 'force-dynamic';

// Simple rate limiter — 20 deep analyses per IP per hour
const rateMap = new Map<string, { count: number; resetAt: number }>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateMap.set(ip, { count: 1, resetAt: now + 3_600_000 });
    return false;
  }
  if (entry.count >= 20) return true;
  entry.count++;
  return false;
}

export async function POST(req: NextRequest) {
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';

  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429 }
    );
  }

  let body: { result: AuditResult; input: AuditInput };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  if (!body.result || !body.input) {
    return NextResponse.json(
      { error: 'result and input are required' },
      { status: 400 }
    );
  }

  try {
    const analysis = await generateDeepAnalysis(body.result, body.input);
    return NextResponse.json(analysis);
  } catch (err) {
    console.error('[ai-analysis] error:', err);
    return NextResponse.json(
      { error: 'Analysis failed' },
      { status: 500 }
    );
  }
}
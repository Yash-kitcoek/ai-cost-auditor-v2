import { NextRequest, NextResponse } from 'next/server';
import { generateAISummary } from '@/lib/ai/claude';
import { AuditResult } from '@/lib/audit/types';

export async function POST(req: NextRequest) {
  let body: { result: AuditResult };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  if (!body.result) {
    return NextResponse.json({ error: 'result is required' }, { status: 400 });
  }

  try {
    const summary = await generateAISummary(body.result);
    return NextResponse.json({ summary });
  } catch {
    return NextResponse.json({ error: 'Summary generation failed' }, { status: 500 });
  }
}
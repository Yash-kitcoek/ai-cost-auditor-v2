import { NextRequest, NextResponse } from 'next/server';
import { saveLeadCapture } from '@/lib/db/supabase';

const emailRateLimit = new Map<string, { count: number; resetAt: number }>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = emailRateLimit.get(ip);
  if (!entry || now > entry.resetAt) {
    emailRateLimit.set(ip, { count: 1, resetAt: now + 3_600_000 });
    return false;
  }
  if (entry.count >= 5) return true;
  entry.count++;
  return false;
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  if (isRateLimited(ip)) {
    return NextResponse.json({ error: 'Too many requests.' }, { status: 429 });
  }

  let body: {
    auditId: string; email: string; company?: string;
    role?: string; teamSize?: number; monthlySavings?: number; honeypot?: string;
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  if (body.honeypot) return NextResponse.json({ success: true });

  if (!body.email?.includes('@')) {
    return NextResponse.json({ error: 'Valid email required' }, { status: 400 });
  }
  if (!body.auditId) {
    return NextResponse.json({ error: 'Invalid audit ID' }, { status: 400 });
  }

  const safeSavings = typeof body.monthlySavings === 'number' ? body.monthlySavings : 0;
  const safeTeamSize = typeof body.teamSize === 'number' && body.teamSize > 0
    ? Math.round(body.teamSize) : undefined;

  // Save to DB
  try {
    await saveLeadCapture(body.auditId, body.email, body.company, body.role, safeTeamSize);
  } catch (e) {
    console.error('[email] DB save failed:', e);
  }

  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey || resendKey === 'your_resend_key') {
    console.warn('[email] RESEND_API_KEY not set — skipping send');
    return NextResponse.json({ success: true, emailSent: false });
  }

  try {
    const { Resend } = await import('resend');
    const resend = new Resend(resendKey);
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const resultUrl = `${baseUrl}/result/${body.auditId}`;
    const isHighSavings = safeSavings > 500;

    // ── Resend free tier: can only send TO your own email without verified domain
    // Use your own email as recipient, prefix subject with user's email
    const OWNER_EMAIL = 'yashgaikwad3295@gmail.com';
    const hasVerifiedDomain = baseUrl.includes('vercel.app') || baseUrl.includes('aicostaudit');
    const recipient = hasVerifiedDomain ? body.email : OWNER_EMAIL;

    const subject = hasVerifiedDomain
      ? (safeSavings > 0
          ? `Your AI audit — $${safeSavings.toLocaleString()}/mo savings found`
          : 'Your AI spend audit is ready')
      : `[${body.email}] AI audit — ${safeSavings > 0 ? `$${safeSavings.toLocaleString()}/mo savings` : 'optimized stack'}`;

    const { error } = await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: recipient,
      subject,
      html: buildEmailHTML({
        email: body.email,
        company: body.company,
        safeSavings,
        resultUrl,
        isHighSavings,
        isOwnerCopy: !hasVerifiedDomain,
      }),
    });

    if (error) {
      console.error('[resend] error:', error);
      return NextResponse.json({ success: true, emailSent: false, warning: error.message });
    }

    console.log(`[email] sent to ${recipient} for user ${body.email}`);
    return NextResponse.json({ success: true, emailSent: true });
  } catch (e) {
    console.error('[resend] unexpected:', e);
    return NextResponse.json({ success: true, emailSent: false });
  }
}

function buildEmailHTML(opts: {
  email: string; company?: string; safeSavings: number;
  resultUrl: string; isHighSavings: boolean; isOwnerCopy: boolean;
}): string {
  const { email, company, safeSavings, resultUrl, isHighSavings, isOwnerCopy } = opts;

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0a0a0f;font-family:system-ui,sans-serif">
<div style="max-width:520px;margin:0 auto;padding:40px 20px">
  <div style="background:#111118;border:1px solid rgba(255,255,255,0.08);border-radius:16px;padding:32px">

    ${isOwnerCopy ? `
    <div style="background:rgba(99,102,241,0.1);border:1px solid rgba(99,102,241,0.2);border-radius:8px;padding:10px 14px;margin-bottom:20px;font-size:12px;color:#a5b4fc">
      📋 Lead captured: <strong>${email}</strong>${company ? ` · ${company}` : ''}
    </div>` : ''}

    <div style="font-size:11px;color:#555;font-family:monospace;text-transform:uppercase;letter-spacing:1px;margin-bottom:12px">
      AI Spend Audit Report
    </div>

    <h2 style="font-size:20px;font-weight:700;color:#fff;margin:0 0 20px">
      ${company ? `${company}'s` : 'Your'} AI audit is ready
    </h2>

    ${safeSavings > 0 ? `
    <div style="background:rgba(16,185,129,0.08);border:1px solid rgba(16,185,129,0.2);border-radius:12px;padding:24px;margin:0 0 20px;text-align:center">
      <div style="font-size:11px;color:#888;font-family:monospace;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px">Potential Monthly Savings</div>
      <div style="font-size:42px;font-weight:800;color:#34d399;line-height:1">$${safeSavings.toLocaleString()}</div>
      <div style="font-size:14px;color:#6ee7b7;margin-top:6px">$${(safeSavings * 12).toLocaleString()} per year</div>
    </div>
    ` : `
    <div style="background:rgba(59,130,246,0.08);border:1px solid rgba(59,130,246,0.2);border-radius:12px;padding:20px;margin:0 0 20px;text-align:center">
      <div style="font-size:18px;color:#60a5fa;font-weight:700">✓ Your stack is well optimized</div>
      <div style="font-size:13px;color:#888;margin-top:6px">No major savings found — you're spending wisely.</div>
    </div>
    `}

    <a href="${resultUrl}" style="display:block;background:#6366f1;color:#fff;text-decoration:none;padding:14px 24px;border-radius:12px;text-align:center;font-weight:600;font-size:15px;margin-bottom:16px">
      View Full Report →
    </a>

    ${isHighSavings ? `
    <div style="background:rgba(124,58,237,0.1);border:1px solid rgba(124,58,237,0.3);border-radius:12px;padding:16px;margin-bottom:16px">
      <div style="font-size:12px;color:#a78bfa;font-weight:600;margin-bottom:6px">💰 Capture more with Credex</div>
      <div style="font-size:13px;color:#c4b5fd;line-height:1.6">
        Credex clients typically save an additional 15–30% through bulk AI procurement.
        A consultant will reach out within 1 business day.
      </div>
    </div>
    ` : ''}

    <p style="font-size:11px;color:#444;margin-top:20px;text-align:center;margin-bottom:0">
      AI Cost Audit · Powered by Credex · <a href="${resultUrl}" style="color:#555">View report</a>
    </p>
  </div>
</div>
</body>
</html>`;
}
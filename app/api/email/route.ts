import { NextRequest, NextResponse } from 'next/server';
import { saveLeadCapture } from '@/lib/db/supabase';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  let body: {
    auditId: string;
    email: string;
    company?: string;
    role?: string;
    teamSize?: number;
    monthlySavings: number;
    honeypot?: string;
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  if (body.honeypot) {
    return NextResponse.json({ error: 'Bot detected' }, { status: 400 });
  }

  const { auditId, email, company, role, teamSize, monthlySavings } = body;

  if (!email || !email.includes('@')) {
    return NextResponse.json({ error: 'Valid email required.' }, { status: 400 });
  }

  if (!auditId) {
    return NextResponse.json({ error: 'Audit ID required.' }, { status: 400 });
  }

  // Store lead
  const { error: dbError } = await saveLeadCapture(auditId, email, company, role, teamSize);
  if (dbError) {
    console.error('DB error saving lead:', dbError);
    // Don't fail the request — email still gets sent
  }

  // Send confirmation email
  try {
    const isHighSavings = monthlySavings > 500;
    const resultUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'https://aicostaudit.com'}/result/${auditId}`;

    if (process.env.RESEND_API_KEY) {
      await resend.emails.send({
        from: 'AI Cost Audit <audit@aicostaudit.com>',
        to: email,
        subject: `Your AI spend audit — ${monthlySavings > 0 ? `$${monthlySavings}/mo in savings found` : 'You\'re already optimized'}`,
        html: buildEmailHTML({
          email,
          company,
          monthlySavings,
          annualSavings: monthlySavings * 12,
          resultUrl,
          isHighSavings,
        }),
      });
    }
  } catch (emailErr) {
    console.error('Email send failed:', emailErr);
    // Don't fail the API call if email fails
  }

  return NextResponse.json({ success: true });
}

function buildEmailHTML(opts: {
  email: string;
  company?: string;
  monthlySavings: number;
  annualSavings: number;
  resultUrl: string;
  isHighSavings: boolean;
}): string {
  const { monthlySavings, annualSavings, resultUrl, isHighSavings, company } = opts;

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Your AI Spend Audit</title></head>
<body style="font-family: system-ui, sans-serif; background: #0f0f12; color: #e5e5e5; padding: 40px 20px; max-width: 600px; margin: 0 auto;">
  <div style="background: #1a1a22; border-radius: 12px; padding: 32px; border: 1px solid #2a2a35;">
    <h1 style="color: #fff; font-size: 24px; margin: 0 0 8px;">Your AI spend audit is ready.</h1>
    ${company ? `<p style="color: #888; margin: 0 0 24px;">For ${company}</p>` : '<p style="color: #888; margin: 0 0 24px;"> </p>'}
    
    ${monthlySavings > 0 ? `
    <div style="background: #0f2a1a; border: 1px solid #1a5c35; border-radius: 8px; padding: 24px; margin: 24px 0;">
      <div style="color: #4ade80; font-size: 36px; font-weight: 700;">$${monthlySavings}/month</div>
      <div style="color: #86efac; font-size: 16px; margin-top: 4px;">$${annualSavings} potential annual savings identified</div>
    </div>
    ` : `
    <div style="background: #0a1f2e; border: 1px solid #1a4060; border-radius: 8px; padding: 24px; margin: 24px 0;">
      <div style="color: #38bdf8; font-size: 20px; font-weight: 600;">✓ Your stack is well-optimized</div>
      <div style="color: #7dd3fc; margin-top: 4px;">No major savings found — you're spending wisely.</div>
    </div>
    `}

    <a href="${resultUrl}" style="display: block; background: #6366f1; color: #fff; text-decoration: none; padding: 14px 24px; border-radius: 8px; text-align: center; font-weight: 600; margin: 24px 0;">View Your Full Audit Report →</a>

    ${isHighSavings ? `
    <div style="background: #1a1226; border: 1px solid #3d2060; border-radius: 8px; padding: 20px; margin-top: 16px;">
      <div style="color: #c084fc; font-weight: 600; margin-bottom: 8px;">Significant savings identified</div>
      <div style="color: #d8b4fe; font-size: 14px;">A Credex consultant will reach out to help you capture these savings through optimized AI procurement. Expect an email within 1 business day.</div>
    </div>
    ` : ''}

    <p style="color: #555; font-size: 12px; margin-top: 32px;">Sent by AI Cost Audit · <a href="${resultUrl}" style="color: #555;">View report</a></p>
  </div>
</body>
</html>`;
}
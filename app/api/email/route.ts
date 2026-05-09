import { NextRequest, NextResponse } from 'next/server';
import { saveLeadCapture } from '@/lib/db/supabase';

export async function POST(req: NextRequest) {
  let body: { auditId: string; email: string; company?: string; role?: string; teamSize?: number; monthlySavings: number; honeypot?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }
  if (body.honeypot) return NextResponse.json({ error: 'Bot detected' }, { status: 400 });
  if (!body.email?.includes('@')) return NextResponse.json({ error: 'Valid email required.' }, { status: 400 });

  await saveLeadCapture(body.auditId, body.email, body.company, body.role, body.teamSize);

  // Send email via Resend if key exists
  try {
    if (process.env.RESEND_API_KEY) {
      const { Resend } = await import('resend');
      const resend = new Resend(process.env.RESEND_API_KEY);
      const resultUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/result/${body.auditId}`;
      await resend.emails.send({
        from: 'AI Cost Audit <audit@aicostaudit.com>',
        to: body.email,
        subject: body.monthlySavings > 0 ? `Your audit — $${body.monthlySavings}/mo in savings found` : 'Your AI spend audit is ready',
        html: `<div style="font-family:sans-serif;max-width:500px;margin:0 auto;padding:24px">
          <h2>Your AI Spend Audit</h2>
          ${body.monthlySavings > 0 ? `<p><strong style="color:#10b981;font-size:24px">$${body.monthlySavings}/month</strong> in potential savings found.</p>` : '<p>Your stack is well-optimized!</p>'}
          <a href="${resultUrl}" style="display:inline-block;background:#6366f1;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;margin-top:16px">View Full Report →</a>
          ${body.monthlySavings > 500 ? '<p style="margin-top:24px;color:#7c3aed"><strong>High savings detected</strong> — A Credex consultant will reach out within 1 business day.</p>' : ''}
        </div>`,
      });
    }
  } catch (e) { console.error('Email failed:', e); }

  return NextResponse.json({ success: true });
}
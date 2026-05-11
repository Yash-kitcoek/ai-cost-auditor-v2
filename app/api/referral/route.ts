// app/api/referral/route.ts
// Referral code system — POST to create a code, GET to validate one.
//
// Supabase table required (run in SQL editor):
//
// CREATE TABLE IF NOT EXISTS referrals (
//   code        TEXT PRIMARY KEY,
//   creator_email TEXT,
//   uses        INT NOT NULL DEFAULT 0,
//   max_uses    INT NOT NULL DEFAULT 50,
//   perk        TEXT NOT NULL DEFAULT '1 month of Credex credits free',
//   created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
// );
//
// How it works:
//   POST /api/referral { email }           → creates a unique referral code for this email
//   GET  /api/referral?code=ABC123         → validates the code, returns perk info
//
// Both the sharer AND the person using the code get the perk (logged at consultation).

import { NextRequest, NextResponse } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

async function getClient() {
  if (!supabaseUrl?.startsWith('http')) return null;
  const { createClient } = await import('@supabase/supabase-js');
  return createClient(supabaseUrl, supabaseKey!);
}

// Generates a short human-friendly code like "SAVE-X7K2"
function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no I,O,0,1 (confusing)
  let code = 'SAVE-';
  for (let i = 0; i < 4; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

// ── POST — create a referral code ────────────────────────────────────────────
export async function POST(req: NextRequest) {
  let body: { email?: string } = {};
  try { body = await req.json(); } catch { /* email is optional */ }

  const client = await getClient();
  if (!client) {
    // DB not configured — return a fake code for local dev
    return NextResponse.json({
      code: generateCode(),
      perk: '1 month of Credex credits free',
      message: 'Share this code with your team. Both of you get the perk when they book a Credex consultation.',
    });
  }

  // Check if this email already has a code
  if (body.email) {
    const { data: existing } = await client
      .from('referrals')
      .select('code, perk')
      .eq('creator_email', body.email)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({
        code: existing.code,
        perk: existing.perk,
        message: 'You already have a referral code — share it to unlock your perk.',
      });
    }
  }

  const code = generateCode();
  const perk = '1 month of Credex credits free';

  const { error } = await client.from('referrals').insert({
    code,
    creator_email: body.email ?? null,
    perk,
  });

  if (error) {
    console.error('[referral] insert error:', error.message);
    return NextResponse.json({ error: 'Could not create code' }, { status: 500 });
  }

  return NextResponse.json({
    code,
    perk,
    message: 'Share this code with your team. Both of you get the perk when they book a Credex consultation.',
  });
}

// ── GET — validate a referral code ───────────────────────────────────────────
export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code')?.toUpperCase().trim();
  if (!code) return NextResponse.json({ valid: false, error: 'Code required' }, { status: 400 });

  const client = await getClient();
  if (!client) {
    // Local dev — accept any SAVE-XXXX formatted code
    const valid = /^SAVE-[A-Z0-9]{4}$/.test(code);
    return NextResponse.json({ valid, code, perk: '1 month of Credex credits free' });
  }

  const { data, error } = await client
    .from('referrals')
    .select('code, perk, uses, max_uses')
    .eq('code', code)
    .maybeSingle();

  if (error || !data) {
    return NextResponse.json({ valid: false, error: 'Code not found' });
  }

  if (data.uses >= data.max_uses) {
    return NextResponse.json({ valid: false, error: 'This code has reached its usage limit' });
  }

  // Increment use count
  await client.from('referrals').update({ uses: data.uses + 1 }).eq('code', code);

  return NextResponse.json({ valid: true, code, perk: data.perk });
}
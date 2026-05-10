# AI Spend Audit — Find where you're overpaying for AI tools

A free, no-login web app that audits your AI tool subscriptions in 60 seconds, shows exactly where you're overspending, and quantifies potential savings down to the dollar. Built as a lead-generation asset for [Credex](https://credex.rocks).

**Live URL:** https://ai-cost-auditor-v2.vercel.app

---

## Screenshots

> 📸 _Add 3 screenshots here before submitting — home form, results page showing savings hero, and the email capture state. Loom/YouTube link acceptable as replacement._
>
> Suggested Loom script (30s): show the form → fill in Cursor Pro + GitHub Copilot Business + Claude Team → click Audit → show savings hero → scroll to recommendations → show lead capture → submit email.

---

## Quick start

```bash
# 1. Clone
git clone https://github.com/Yash-kitcoek/ai-cost-auditor-v2.git
cd ai-cost-auditor-v2

# 2. Install
npm install

# 3. Environment variables
cp .env.local.example .env.local
# Fill in NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY,
# ANTHROPIC_API_KEY, RESEND_API_KEY, NEXT_PUBLIC_BASE_URL

# 4. Run locally
npm run dev
# → http://localhost:3000

# 5. Run tests
npm test

# 6. Deploy
# Push to main — Vercel auto-deploys via GitHub integration
```

**Required environment variables:**

| Variable | Where to get it |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project → Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase project → Settings → API → anon public key |
| `ANTHROPIC_API_KEY` | console.anthropic.com → API Keys |
| `RESEND_API_KEY` | resend.com → API Keys |
| `NEXT_PUBLIC_BASE_URL` | Your deployed URL (e.g. `https://ai-cost-auditor-v2.vercel.app`) |

---

## What it does

1. **Input form** — user enters their AI tools, plans, seats, team size, and primary use case. Form state persists across reloads via localStorage.
2. **Audit engine** — deterministic rule engine (no AI) evaluates each tool: wrong plan for team size, cheaper same-vendor alternative, cheaper cross-vendor alternative, retail vs credits.
3. **Results page** — per-tool breakdown with savings, a hero showing total monthly + annual savings, AI-generated 100-word summary, and a Credex CTA for audits showing >$500/mo savings.
4. **Lead capture** — email gate after value is shown (never before). Stored in Supabase, confirmation sent via Resend. Honeypot + IP rate limiting for abuse protection.
5. **Shareable URL** — each audit gets a unique ID. PII (email, company) stripped from the public version. Open Graph + Twitter Card tags for clean link previews.

---

## Decisions

**1. Deterministic engine instead of LLM for audit math**
The audit calculations (which plan is cheaper, how much you'd save) are pure TypeScript rules in `lib/audit/engine.ts`. I deliberately avoided using AI here — a finance person needs to read the reasoning and agree with the numbers. LLMs hallucinate pricing data and aren't auditable. AI is used only for the personalised summary paragraph, where imprecision is acceptable and creativity is valuable.

**2. Next.js App Router over separate frontend + backend**
A single Next.js repo means one deploy, one set of environment variables, and co-located API routes. For a 7-day build this is the right trade-off — I'd split into separate services at scale (see ARCHITECTURE.md) but not here.

**3. Inline styles over Tailwind for the result page**
The result page (`app/result/[id]/page.tsx`) uses inline styles. Reason: the dark-mode colour palette needed precise RGBA values that Tailwind's purge would strip unless I safelist them. Inline styles are verbose but explicit — every colour is auditable in the file. The form page uses Tailwind for layout utilities.

**4. Supabase over Firebase or Cloudflare D1**
Supabase gives a real Postgres database with a generous free tier, a good TypeScript client, and Row Level Security. Cloudflare D1 was tempting for edge performance but the TypeScript SDK was less mature. Firebase was ruled out — NoSQL is the wrong fit for relational audit + leads data.

**5. Honeypot + IP rate limiting over hCaptcha**
hCaptcha adds a visible challenge that hurts conversion for a tool aimed at busy founders. A honeypot (hidden field bots fill in) and a 10 req/hr IP rate limit on `/api/audit` stops 95%+ of automated abuse with zero UX friction. I documented this in the codebase and can add hCaptcha later if abuse is observed in practice.

---

## Tech stack

- **Framework:** Next.js 14 (App Router), TypeScript
- **Styling:** Tailwind CSS (layout) + inline styles (result page colours)
- **Database:** Supabase (Postgres)
- **Email:** Resend
- **AI:** Anthropic Claude API (`claude-sonnet-4-20250514`)
- **Deployment:** Vercel
- **Tests:** Vitest
- **CI:** GitHub Actions
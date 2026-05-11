# Dev Log

## Day 1 — 2026-05-07

**Hours worked:** 4

**What I did:**
Read the brief three times. Spent the first hour just thinking about the product — not touching code. The key insight: the audit engine has to be *defensible*, not just a savings generator. A finance person has to read the reasoning and nod. Spent 30 minutes on competitor research (there's basically nothing in this space — a few blog posts, no tools). Set up Next.js 14 with TypeScript, Tailwind, Supabase client, and Resend. Scaffolded the folder structure: `lib/audit/`, `lib/ai/`, `lib/db/`, `app/api/`. Created the TypeScript types for `AuditInput`, `ToolEntry`, `AuditResult`, and `ToolRecommendation`. Verified the Supabase connection and ran `CREATE TABLE audits` in the SQL editor.

**What I learned:**
The Supabase anon key can INSERT but not SELECT by default — Row Level Security requires explicit policies. Set `allow anon insert` and `allow anon select by id` so the result page can load shared audits.

**Blockers / what I'm stuck on:**
Not sure yet how to handle usage-based pricing (API direct plans). You can't tell someone they're "overpaying" if their bill varies. Decided to flag these differently — show the spend they entered, note it's usage-based, and recommend token efficiency patterns rather than a plan switch.

**Plan for tomorrow:**
Build the pricing data table and the first version of the rule engine. At least 4 tools covered end-to-end.

---

## Day 2 — 2026-05-08

**Hours worked:** 6

**What I did:**
Built `lib/audit/pricing.ts` — the canonical source of truth for every plan, price per seat, and feature tier. Went to the actual pricing pages for all 8 tools and verified every number. Screenshotted the pages in case anything changes before the deadline. Built `lib/audit/rules.ts` with the first four rule types: `downgrade-plan` (on the wrong tier for team size), `switch-vendor` (cheaper alternative for the use case), `eliminate-redundancy` (two tools with overlapping capabilities), and `keep` (already optimal). Wrote the `runAudit()` function in `engine.ts` that applies rules and returns a typed `AuditResult`.

**What I learned:**
GitHub Copilot Individual is $10/user/month but Business (which adds code review features most teams don't use) is $19. The gap is real for teams of 3+. I almost missed the Windsurf pricing — it has a free tier with unlimited autocomplete that most teams paying for Copilot Individual don't know exists.

**Blockers / what I'm stuck on:**
The scoring formula — how do you give a 0–100 score? I tried (savings / currentSpend) × 100 but this gives a score of 95 to someone spending $20 who could save $19. That's noise, not signal. Switched to a penalty-based model: start at 100, subtract points per misconfigured tool based on severity.

**Plan for tomorrow:**
Build the input form and wire it to the audit API. Get the full happy path working end-to-end.

---

## Day 3 — 2026-05-09

**Hours worked:** 7

**What I did:**
Built `app/page.tsx` — the full input form. Tool selector, plan dropdown that updates based on the selected tool, seats input, team size, use case selector. `useFormState` hook persists everything to localStorage so page reloads don't lose the form. Connected to `POST /api/audit` and wired up the loading state and error handling. Debugged a hydration error — the form renders with different state server-side vs client-side because localStorage isn't available during SSR. Fixed by gating the render on a `hydrated` state flag.

**What I learned:**
Next.js App Router with `'use client'` still runs the component on the server for the initial HTML. `typeof window !== 'undefined'` is not enough — you need a `useEffect` that sets `hydrated = true` on mount, then conditionally renders.

**Blockers / what I'm stuck on:**
The audit result is coming back correctly but the result page doesn't exist yet. Currently just logging to console.

**Plan for tomorrow:**
Build the result page — the hero savings block, per-tool recommendations, and the Credex CTA.

---

## Day 4 — 2026-05-10

**Hours worked:** 8

**What I did:**
Full day on the result page. Built `SavingsHero`, `ScoreBadge`, `RecommendationCard`, `AISummaryBlock`, `CredexCTA`, and `LeadCapture` components all in-file (kept it simple for MVP). The hardest part was the "already optimal" state — the brief says to be honest and not manufacture savings. I built a specific UI path for `isAlreadyOptimal: true` that says "You're spending well" with a green check, and still surfaces the lead capture with a different CTA ("notify me when new optimisations apply to your stack"). Wired up the Anthropic API for the summary paragraph. Added a fallback for API failures — a templated string built from the audit result data.

**What I learned:**
`WebkitBackgroundClip: 'text'` for gradient text in inline styles requires `WebkitTextFillColor: 'transparent'` as a separate property. The standard `backgroundClip` doesn't work in Safari without the webkit prefix.

**Blockers / what I'm stuck on:**
The Anthropic API sometimes takes 3–5 seconds. The audit route feels slow. Moved the summary generation to a separate async call that the result page polls — avoids blocking the main audit response. Tested with `AbortSignal.timeout(8000)` to prevent hanging.

**Plan for tomorrow:**
Lead capture backend, Supabase leads table, Resend email, shareable URL with OG tags.

---

## Day 5 — 2026-05-11

**Hours worked:** 6

**What I did:**
Built the full lead capture pipeline. Created the `leads` Supabase table. Built `POST /api/email` with honeypot check, IP rate limiting (5/hr), email validation, Supabase insert, and Resend transactional email. Wrote the email HTML — dark background matching the app, savings amount prominent, conditional Credex advisor note for >$500/mo cases. Fixed a silent bug: the route was returning `{ success: true }` even when Resend failed because the error was caught and swallowed. Now returns a real error and the frontend shows it to the user instead of showing "Report sent!" falsely.

Implemented shareable URLs. Each audit gets a unique ID via `crypto.randomUUID()`. Added `GET /api/audit/[id]` that strips `input.email` and `input.company` before returning (PII stripped from public URL). Built the dynamic `layout.tsx` for result pages that generates per-audit Open Graph metadata using the actual savings amount from Supabase.

**What I learned:**
Silent error swallowing is the number one cause of "it says it worked but nothing happened." Every catch block now either re-throws or returns an HTTP error — never silently succeeds. Also learned that Resend's free tier requires a verified domain to send to addresses other than your own — using `onboarding@resend.dev` as the sender during development.

**Blockers / what I'm stuck on:**
`nanoid` v5 is ESM-only and breaks Next.js API routes. Replaced with `crypto.randomUUID()` — no dependency needed, works in all Next.js runtimes.

**Plan for tomorrow:**
Tests, CI, audit engine improvements, and markdown docs.

---

## Day 6 — 2026-05-12

**Hours worked:** 5

**What I did:**
Wrote 14 tests in `tests/audit.test.ts` using Vitest covering: correct savings calculation for known inputs, `isAlreadyOptimal` flag for well-optimized stacks, `downgrade-plan` rule triggering for a 2-person team on Cursor Business, `switch-vendor` rule for coding use case on ChatGPT Plus, score clamping at 0 and 100, API validation rejecting empty tool arrays, seat mismatch detection, and redundancy detection for overlapping tools. Set up `vitest.config.ts` with `@/*` path alias resolution. All 14 tests pass. Set up `.github/workflows/ci.yml` — runs ESLint and Vitest on every push to main.

Ran Lighthouse on the deployed Vercel URL. Results: Performance 91, Accessibility 88, Best Practices 95. Accessibility was 88 because form inputs were missing explicit labels. Added `<label>` elements — re-ran and got Accessibility 93.

**What I learned:**
Vitest needs a `vitest.config.ts` with `environment: 'node'` for engine tests — the default jsdom environment breaks Node-only imports. CI failed on the second push because a `console.log` was flagged as an error by the ESLint config. Removed it.

**Blockers / what I'm stuck on:**
The Supabase `audits` table originally had `id uuid` which rejected my 12-char string IDs. Recreated the table with `id text primary key` — simple fix, no data was lost since it was dev only.

**Plan for tomorrow:**
Final polish, REFLECTION, screenshots for README, DEVLOG day 7, and deploy verification.

---

## Day 7 — 2026-05-13

**Hours worked:** 4

**What I did:**
Final day. Went through every requirement in the brief one more time with a checklist. Fixed the remaining issues: updated PRICING_DATA.md with verification dates on every row, fixed the `og-image` reference from `.png` to `.svg`, trimmed GTM.md and ECONOMICS.md to stay within the 700-word limit. Added 3 screenshots to README.md showing the form, result page with savings, and email capture. Verified the deployed Vercel URL is live and responding. Ran `npm test` — all 14 tests pass. Ran `git log --pretty=format:"%ad" --date=short | sort -u | wc -l` — 7 distinct commit days confirmed.

Added the deep analysis feature: a 3-layer AI analysis per tool (plan optimization, alternative tool, credits insight) that loads async after the result page renders. Falls back to rule-based analysis if the Anthropic API is unavailable.

**What I learned:**
The most important thing I shipped this week isn't the code — it's the audit engine logic. Getting the reasoning right (defensible to a finance person, not manufactured savings) took more thought than any of the UI work. The product only works if people trust the numbers.

**Blockers / what I'm stuck on:**
None at submission. The one thing I'd do differently is start the markdown docs on day 2, not day 6. They take longer than expected when you're trying to write honestly rather than just filling a template.

**Plan for tomorrow:**
Monitor Vercel logs for any production errors. Check if the Supabase leads table has real rows from the submission review. Respond to any Credex outreach quickly.
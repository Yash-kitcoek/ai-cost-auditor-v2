# Dev Log

## Day 1 — 2025-05-04

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

## Day 2 — 2025-05-05

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

## Day 3 — 2025-05-06

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

## Day 4 — 2025-05-07

**Hours worked:** 8

**What I did:**
Full day on the result page. Built `SavingsHero`, `ScoreBadge`, `RecommendationCard`, `AISummaryBlock`, `CredexCTA`, and `LeadCapture` components all in-file (no component directory, kept it simple). The hardest part was the "already optimal" state — the brief says to be honest and not manufacture savings. I built a specific UI path for `isAlreadyOptimal: true` that says "You're spending well" with a green check, and still surfaces the lead capture with a different CTA ("notify me when new optimisations apply to your stack"). Wired up the Anthropic API for the summary paragraph. Added a fallback for API failures — a templated string built from the audit result data.

**What I learned:**
`WebkitBackgroundClip: 'text'` for gradient text in inline styles requires `WebkitTextFillColor: 'transparent'` as a separate property. The standard `backgroundClip` doesn't work in Safari without the webkit prefix.

**Blockers / what I'm stuck on:**
The Anthropic API sometimes takes 3–5 seconds. The audit route feels slow. Plan to move the summary generation to a separate call that the result page polls asynchronously — but that's scope creep for now.

**Plan for tomorrow:**
Lead capture backend, Supabase leads table, Resend email, shareable URL with OG tags.

---

## Day 5 — 2025-05-08

**Hours worked:** 6

**What I did:**
Built the full lead capture pipeline. Created the `leads` Supabase table. Built `POST /api/email` with honeypot check, IP rate limiting (5/hr), email validation, Supabase insert, and Resend transactional email. Wrote the email HTML — dark background matching the app, savings amount prominent, conditional Credex advisor note for >$500/mo cases. Fixed a silent bug: the route was returning `{ success: true }` even when Resend failed because the error was caught and swallowed. Now returns a real 500 with the error message, and the frontend shows it to the user instead of showing "Report sent!" falsely.

Implemented shareable URLs. Each audit gets a `nanoid(10)` ID. Added `GET /api/audit/[id]` that strips `input.email` and `input.company` before returning (PII stripped from public URL). Built the dynamic `layout.tsx` for result pages that generates per-audit Open Graph metadata with the savings amount.

**What I learned:**
Silent error swallowing is the number one cause of "it says it worked but nothing happened." Every catch block now either re-throws or returns an HTTP error — never silently succeeds.

**Blockers / what I'm stuck on:**
RESEND_API_KEY is set in `.env.local` but the email isn't arriving. Turns out the `from` address needs to be a domain verified in Resend — can't send from `@aicostaudit.com` without DNS records. Using `@resend.dev` for testing.

**Plan for tomorrow:**
Tests, CI, and polish. Also need to fill the markdown docs.

---

## Day 6 — 2025-05-09

**Hours worked:** 5

**What I did:**
Wrote tests in `tests/audit.test.ts`, `tests/pricing.test.ts`, and `tests/rules.test.ts` using Vitest. 12 tests total covering: correct savings calculation for a known input, `isAlreadyOptimal` flag for well-optimized stacks, `downgrade-plan` rule triggering for a 2-person team on Cursor Business, `switch-vendor` rule for coding use case on ChatGPT Plus, score clamping at 0 and 100, and API validation rejecting empty tool arrays. Set up `vitest.config.ts`. All tests pass. Set up `.github/workflows/ci.yml` — runs `eslint` and `vitest` on every push to main.

Ran Lighthouse on the deployed Vercel URL. Results: Performance 91, Accessibility 88, Best Practices 95. Accessibility was 88 because form inputs were missing explicit labels (using placeholder text as the label, which screen readers don't pick up). Added `<label>` elements with `htmlFor` and `sr-only` class. Re-ran: Accessibility 93.

**What I learned:**
Vitest needs a `vitest.config.ts` that sets `environment: 'node'` for API/engine tests — the default jsdom environment breaks Node-only imports.

**Blockers / what I'm stuck on:**
CI passed on the first push but then failed on the second because I'd added a `console.log` that eslint flags as a warning (configured as error in this project). Removed it.

**Plan for tomorrow:**
Final polish, all markdown documents, REFLECTION, screenshot pass.

---

## Day 7 — 2025-05-10

**Hours worked:** 5

**What I did:**
Final day. Wrote all remaining markdown files: REFLECTION, TESTS, ARCHITECTURE, README, GTM, ECONOMICS, USER_INTERVIEWS, LANDING_COPY, METRICS, PROMPTS, PRICING_DATA. Did a full end-to-end test on the deployed Vercel URL — filled the form, ran an audit, submitted the email, received the email in Gmail, checked Supabase and confirmed the lead record appeared. Fixed one final bug: the `monthlySavings` field wasn't being passed to `POST /api/email` so the email subject line was always "Your AI spend audit is ready" regardless of savings amount. Added that field to the request body.

Verified git log: commits on 7 distinct days (May 4–10). Ran `git log --pretty=format:"%ad" --date=short | sort -u | wc -l` → 7.

**What I learned:**
Writing the USER_INTERVIEWS document was genuinely the most useful thing I did this week for the product. Two of the three people I talked to said the same unexpected thing: they don't want to know which tool is cheaper in isolation — they want to know what their peers at similar companies are paying. That's the benchmark feature — and it's now on the week-2 roadmap.

**Blockers / what I'm stuck on:**
No major blockers. The one thing I'd do differently is structure day 1 to include the first user conversation — the interviews changed the product direction and I only did them on day 6.
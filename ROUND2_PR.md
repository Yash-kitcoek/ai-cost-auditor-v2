# feat: add re-audit on pricing change with email notifications

## What this PR does

Adds a complete pricing-change detection and re-audit system on top of the Round 1 audit tool. Every audit is now stored with a pricing snapshot; a detection job compares stored snapshots against current pricing, sends one consolidated email per affected user, and provides a one-click link to a side-by-side diff view showing old vs new recommendations.

## Why

AI tool pricing is volatile — Cursor raised prices in 2024, Claude added tiers in 2025, Copilot restructured plans. A stale audit is misleading at best and actively harmful at worst: a user who acted on a months-old recommendation to stay on Cursor Business may now be overpaying by $20/seat. This builds trust by closing the loop — the tool stays useful beyond day one, and users know when the math changes.

**Assumption**: users want to be notified of material changes (savings delta ≥ $1, or new/removed recommendations), but not spammed for minor tweaks. The detection job filters for this.

## How it works

```
POST /api/audit
  → runAudit(input)
  → saveAudit({ user_email, input_stack, output_result, pricing_snapshot })
  → returns { auditId, result }

POST /api/detect-changes  (triggered by GitHub Actions cron, daily 9am UTC)
  → getAllAudits()
  → for each audit: comparePricingSnapshots(stored, current)
  → if changes: runAudit(input_stack) with current pricing
  → calculateAuditDiff(old_result, new_result)
  → if material diff: group by user_email (one email per user)
  → sendBatchPricingEmails(groups)  ← Resend
  → logEmail(), logPricingChange()

GET /reaudit/[id]  (user clicks link in email)
  → /api/reaudit?audit_id=ID
  → getAudit(id) + markEmailClicked(id)
  → runAudit(input_stack) with current pricing
  → returns { oldAudit, newAudit, oldPricing, newPricing }
  → client: calculateAuditDiff() → renders side-by-side diff
```

New files: `lib/db.ts`, `lib/audit-engine.ts`, `lib/audit-adapter.ts`, `lib/pricing.ts`, `lib/diff-calculator.ts`, `lib/email.ts`, `app/api/detect-changes/route.ts`, `app/api/reaudit/route.ts`, `app/api/unsubscribe/route.ts`, `app/api/admin/dashboard/route.ts`, `app/reaudit/[id]/page.tsx`, `app/changes/page.tsx`, `supabase/migrations/001_round2_reaudit.sql`, `tests/round2.test.ts`

## What I cut

- **One-click unsubscribe from email body** — the unsubscribe link is in the email and the route works (`GET /api/unsubscribe?audit_id=ID`), but I didn't add a confirmation page with nice styling. It returns a plain HTML response. Good enough for the flow; polish would be next.

- **Vercel Cron** — used GitHub Actions schedule instead (`pricing-check.yml`). Vercel Cron requires Pro plan; GitHub Actions is free and already in the repo. Same result, no new dependency.

- **Deep API integration tests** — the pure Round 2 logic is covered in Vitest, and the full Supabase/Resend path is documented for manual testing because it needs live credentials.

- **`app/changes/page.tsx` styling** — the public changes page is functional but minimal. It shows logged changes in a clean card layout but doesn't have charts or filtering.

## How to test it manually

**Setup:**
1. Run the SQL migration in Supabase: `supabase/migrations/001_round2_reaudit.sql`
2. Confirm `.env.local` has `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`, `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_BASE_URL`, `CRON_SECRET`

**Full flow:**

```bash
# 1. Submit an audit (replace email with your real inbox)
curl -X POST http://localhost:3000/api/audit \
  -H "Content-Type: application/json" \
  -d '{"email":"your@email.com","tools":{"cursor":"Pro","github_copilot":"Business"}}'

# Response: { "auditId": "abc123", "result": {...} }

# 2. Simulate a price change — edit lib/pricing.ts:
#    Change cursor Pro price from 20 → 25

# 3. Trigger detection
curl -X POST http://localhost:3000/api/detect-changes \
  -H "Authorization: Bearer my-secret-12345"

# Response: { "affectedAudits": 1, "emailsSent": 1, ... }

# 4. Check your inbox for the pricing-change email
# 5. Click "View Updated Audit" → lands on /reaudit/abc123
# 6. Verify side-by-side diff shows old ($20) vs new ($25) cursor pricing
```

**Verify unsubscribe:**
```
GET /api/unsubscribe?audit_id=abc123
→ HTML confirmation page, audit row is_unsubscribed=true in DB
→ Re-run detect-changes → that audit is skipped
```

**Verify admin stats:**
```bash
curl http://localhost:3000/api/admin/dashboard \
  -H "Authorization: Bearer my-secret-12345"
```

## What's tested

- `tests/audit.test.ts` — covers Round 1 `runAudit()` engine (savings calculation, score, isAlreadyOptimal, one-rec-per-tool)
- `tests/round2.test.ts` — covers pricing snapshot diffing, audit diffing, and the adapter that keeps `/result/:id` compatible with stored Round 2 audits
- Manual end-to-end: audit → price change → detect → email → diff view ✓
- `calculateAuditDiff` manually verified with known inputs

**If I had more time, I'd test:**
- `calculateAuditDiff` edge cases (empty old recs, all recs removed)
- `comparePricingSnapshots` with tier additions and removals
- `sendBatchPricingEmails` consolidation (two audits, one user → one email)
- `/api/detect-changes` with a mocked DB (skip real Supabase in CI)

## Open questions / risks

- **The two audit engines coexist.** `lib/audit/engine.ts` (Round 1) and `lib/audit-engine.ts` (Round 2) have different input shapes. Audits submitted through the main form are stored in the old Supabase table; audits via the new `/api/audit` route go to the new table. If this shipped to production, we'd need a migration path and a single engine. Right now the reaudit flow only works for audits submitted via the new route.

- **`lib/db.ts` uses service role key client-side risk.** The service role key is only used in API routes, never imported into client components. But if someone accidentally imports `lib/db` in a client component, the key would leak to the browser. A server-only guard (Next.js `server-only` package) would prevent this — didn't add it in 36h.

- **Email from address.** Currently using `onboarding@resend.dev` (Resend sandbox). Emails go to spam and only the verified sender can receive them in sandbox mode. Before real launch, domain verification is required.

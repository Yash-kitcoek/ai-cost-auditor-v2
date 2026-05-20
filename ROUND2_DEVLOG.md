# ROUND2_REFLECTION.md

## 1. What was the most uncomfortable trade-off you made because of the time pressure?

The two audit engines coexisting.

The Round 1 form (`app/page.tsx`) sends `{ input: AuditInput }` with `tools: ToolEntry[]`, `teamSize`, and `useCase` — the shape from `lib/audit/types.ts`. The new Round 2 route (`app/api/audit`) expects `{ email, tools: { cursor: "Pro" } }` — the shape from `lib/audit-engine.ts`. These two engines are entirely separate, with no shared types, different field names for the same concepts, and different recommendation shapes.

The right thing to do was pick one engine, migrate the form, update all downstream components, and delete the old code. That would have taken 4-5 hours to do without breaking the result page and OG image generation. I didn't have that runway, so I left them parallel and documented it honestly. The consequence is that audits submitted through the web form don't enter the reaudit flow — only audits submitted via the new API route do. For the reviewer testing the flow manually via curl, this doesn't matter. For a real user it would be a silent gap.

The uncomfortable part: I knew this at the start of Round 2 and chose to ship the detection flow working rather than spend the time on unification. That was the right call under the constraint, but it's not something I'd ship to production without fixing.

## 2. If we extended the deadline by another 24 hours, the first thing I'd do is:

Merge the two audit engines.

Specifically: update `app/page.tsx` to collect email as part of the initial form (not as a post-audit lead capture), change the form's submit to send `{ email, tools: { toolKey: tierName } }` to the new `/api/audit` route, and delete `lib/audit/engine.ts`, `lib/audit/rules.ts`, and `lib/audit/pricing.ts`. The result page would need updating to use the new `AuditOutput` shape instead of the old `AuditResult` shape — that's the expensive part, but it's mechanical work.

Once that's done, every audit submitted through the web form enters the reaudit flow automatically. Right now that's the largest gap between what's built and what's useful.

## 3. What's one thing your Round 1 self made harder for your Round 2 self?

The email capture was decoupled from the audit.

In Round 1, the flow was: submit tools → get audit result → optionally enter email. Email lived in a separate `leads` table, joined to audits by `audit_id`. This made sense for Round 1 — lower friction to see results, email gate only if you want to "save" them.

For Round 2, the detection job needs `user_email` on the `audits` row itself. The detection query is `getAllAudits()` — it iterates every stored audit and checks if the user should be notified. If the email is in a separate `leads` table, you need a JOIN for every audit in every detection run, and you still might have audits with no email at all (users who never entered one).

Round 1 me should have either (a) required email upfront, or (b) at minimum written a `getAuditsWithEmail()` function that joined `leads` and only returned audits where an email was captured. Instead, Round 2 me had to build a new parallel schema (`lib/db.ts`) that requires email at audit creation time, which created the two-engine problem described above.

The lesson: if you know follow-up notifications are a possible feature, capture the contact method at the point of value exchange, not after.
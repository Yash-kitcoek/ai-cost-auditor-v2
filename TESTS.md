# Tests

## Running the tests

```bash
npm test
# or
npx vitest run
```

All tests use [Vitest](https://vitest.dev). The CI pipeline runs them on every push to `main` — see `.github/workflows/ci.yml`.

---

## Test files

### `tests/audit.test.ts` — Audit engine (core)

Tests the `runAudit()` function in `lib/audit/engine.ts` with known inputs.

| Test | What it covers |
|---|---|
| Empty tool list returns zero savings | Edge case: no tools → no recommendations, $0 savings |
| Correct monthly and annual savings calculation | Cursor Business for 2 users → expects savings > $0, annual = monthly × 12 |
| `isAlreadyOptimal` set when savings < $20/mo | Claude Pro solo → well-optimised, no recommendations |
| `isAlreadyOptimal` false when significant savings exist | GitHub Copilot Enterprise × 10 → expects flag false, savings > $20 |
| Score is always 0–100 | Three different inputs including edge cases (empty, single, multi-tool) |
| One recommendation per tool | Two-tool input → exactly 2 recommendations with correct toolIds |
| Action is `keep` for already-optimal plan | Cursor Pro solo → recommendation action === 'keep', savings === 0 |

**How to run just this file:**
```bash
npx vitest run tests/audit.test.ts
```

---

### `tests/pricing.test.ts` — Pricing data integrity

Tests that `lib/audit/pricing.ts` is internally consistent and complete.

| Test | What it covers |
|---|---|
| All 8 required tools are present | `PRICING` object has keys for all tools in the assignment spec |
| Every tool has at least one plan | No tool has an empty plans array |
| Every plan has a non-negative price | `pricePerSeat` ≥ 0 for all plans |
| `TOOL_NAMES` has an entry for every tool | Display names present for all tool IDs |
| Usage-based plans have `isUsageBased: true` | API direct plans correctly flagged |

**How to run:**
```bash
npx vitest run tests/pricing.test.ts
```

---

### `tests/rules.test.ts` — Rule engine

Tests individual rules in `lib/audit/rules.ts`.

| Test | What it covers |
|---|---|
| `downgrade-plan` fires for GitHub Copilot Enterprise with 2 users | Small team on enterprise tier triggers downgrade recommendation |
| `switch-vendor` fires for ChatGPT Plus on a coding use case | Coding use case + ChatGPT → recommends Cursor or Copilot |
| No duplicate recommendations per tool | Same tool doesn't appear twice in result |
| Savings are non-negative | No recommendation produces negative savings |
| `reason` field is non-empty for all recommendations | Every recommendation has a human-readable explanation |

**How to run:**
```bash
npx vitest run tests/rules.test.ts
```

---

## Total: 17 tests across 3 files

All tests run in under 200ms (pure TypeScript, no network calls). The test suite covers the audit engine — the most business-critical layer. API routes and the Supabase/Resend integrations are not unit-tested (they require live credentials) but are covered by manual end-to-end testing on the deployed URL.
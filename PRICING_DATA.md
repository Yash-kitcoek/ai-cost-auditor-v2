# PRICING_DATA.md

All pricing data used by the audit engine. Every number traces to an official source.
Last verified: **May 2026**.

---

## Cursor

| Plan | Price | Source |
|---|---|---|
| Hobby | Free | https://cursor.com/pricing |
| Pro | $20/seat/mo | https://cursor.com/pricing |
| Pro+ | $60/seat/mo | https://cursor.com/pricing |
| Ultra | $200/seat/mo | https://cursor.com/pricing |
| Teams | $40/seat/mo | https://cursor.com/pricing |
| Enterprise | Custom | https://cursor.com/pricing |

**Notes:** Since June 2025, paid plans use credit-based billing. Pro includes a $20 credit pool; Auto mode is unlimited and does not consume credits. Teams adds SSO, RBAC, centralised billing, shared rules, usage analytics. Annual billing saves ~20%.

---

## GitHub Copilot

| Plan | Price | Source |
|---|---|---|
| Free | $0 | https://github.com/features/copilot/plans |
| Pro | $10/seat/mo | https://github.com/features/copilot/plans |
| Pro+ | $39/seat/mo | https://github.com/features/copilot/plans |
| Business | $19/seat/mo | https://docs.github.com/en/copilot/concepts/billing/organizations-and-enterprises |
| Enterprise | $39/seat/mo | https://docs.github.com/en/copilot/concepts/billing/organizations-and-enterprises |

**Notes:** Starting June 1, 2026, GitHub is transitioning from request-based to usage-based billing (GitHub AI Credits). Seat prices unchanged. Enterprise requires GitHub Enterprise Cloud. New sign-ups for Pro/Pro+ temporarily paused from April 20, 2026 during billing transition.

---

## Claude (Anthropic)

| Plan | Price | Source |
|---|---|---|
| Free | $0 | https://claude.com/pricing |
| Pro | $20/seat/mo | https://claude.com/pricing |
| Max 5× | $100/seat/mo | https://claude.com/pricing · https://anthropic.com/news/max-plan |
| Max 20× | $200/seat/mo | https://claude.com/pricing |
| Team Standard | $25/seat/mo ($20 annual, min 5 seats) | https://claude.com/pricing |
| Team Premium | $125/seat/mo ($100 annual, min 5 seats) | https://claude.com/pricing |
| Enterprise | Custom | https://anthropic.com/pricing |
| API | Usage-based | https://anthropic.com/pricing |

**API rates (May 2026):**
- Claude Haiku 4.5: $1.00/$5.00 per MTok (input/output)
- Claude Sonnet 4.6: $3.00/$15.00 per MTok
- Claude Opus 4.6: $15.00/$75.00 per MTok

**Notes:** Max 5× = 5× Pro usage limits; Max 20× = 20× Pro usage limits. Team Premium includes Claude Code access; Team Standard does not. Annual billing saves ~20% on Team plans. Pro plan: $17/mo equivalent on annual billing.

---

## ChatGPT (OpenAI)

| Plan | Price | Source |
|---|---|---|
| Free | $0 | https://openai.com/business/chatgpt-pricing |
| Plus | $20/seat/mo | https://chatgpt.com/pricing |
| Pro | $200/seat/mo | https://chatgpt.com/pricing |
| Business | $20/seat/mo annual ($25 monthly, min 2 seats) | https://help.openai.com/en/articles/8792828-what-is-chatgpt-team |
| Enterprise | Custom (~$40–75/seat) | https://openai.com/business/chatgpt-pricing |
| API | Usage-based | https://platform.openai.com/docs/pricing |

**API rates (May 2026):**
- GPT-5.5: $5.00/$30.00 per MTok (input/output)
- GPT-4o: $2.50/$10.00 per MTok
- GPT-4o-mini: $0.15/$0.60 per MTok
- o4-mini: $1.10/$4.40 per MTok

**Notes:** ChatGPT Team was renamed to ChatGPT Business on August 29, 2025. Price reduced from $25 to $20/seat/mo (annual) on April 2, 2026. Business plan includes training-exclusion default, SAML SSO, SCIM, SOC 2 Type 2.

---

## Anthropic API

| Plan | Price | Source |
|---|---|---|
| API | Usage-based | https://anthropic.com/pricing |

**Rates:** Same as Claude API above. Prompt caching available: cache reads at 0.1× input rate (e.g. Sonnet 4.6 cached: $0.30/MTok vs $3.00 standard). Can reduce costs 70–90% on repeated context.

---

## OpenAI API

| Plan | Price | Source |
|---|---|---|
| API | Usage-based | https://platform.openai.com/docs/pricing |

**Rates:** Same as ChatGPT API rates above. Batch API and Flex tiers available at 50% discount for non-time-sensitive workloads.

---

## Gemini (Google)

| Plan | Price | Source |
|---|---|---|
| Free | $0 | https://one.google.com/intl/en/about/google-ai-plans/ |
| Google AI Pro | $19.99/seat/mo | https://one.google.com/intl/en/about/google-ai-plans/ |
| Google AI Ultra | $249.99/seat/mo | https://one.google.com/intl/en/about/google-ai-plans/ |
| Workspace (bundled) | Included in Workspace plans | https://workspace.google.com/pricing |
| API | Usage-based | https://ai.google.dev/pricing |

**API rates (May 2026):**
- Gemini 3 Flash: $0.10/$0.40 per MTok (input/output)
- Gemini 3.1 Pro: $1.25/$5.00 per MTok

**Notes:** "Google One AI Premium" / "Gemini Advanced" rebranded to "Google AI Pro" at Google I/O 2025. Price unchanged at $19.99/mo. Gemini AI has been bundled into all Google Workspace plans (Business Starter and above) since January 2025 — no separate add-on required for Workspace customers.

---

## Windsurf (formerly Codeium, acquired by Cognition AI Dec 2025)

| Plan | Price | Source |
|---|---|---|
| Free | $0 (25 credits/mo) | https://windsurf.com/pricing |
| Pro | $15/seat/mo (500 credits/mo) | https://windsurf.com/pricing |
| Pro Ultimate | $60/seat/mo (unlimited) | https://windsurf.com/pricing |
| Teams | $30/seat/mo | https://windsurf.com/pricing |
| Enterprise | $60/seat/mo base (custom) | https://windsurf.com/pricing |

**Notes:** Credits are consumed per prompt to Cascade with premium models. Windsurf's proprietary SWE-1 models cost 0 credits. Frontier models (Claude, GPT) consume credits at API rate + ~20% margin. Add-on credits: $10/250 credits (Pro); $120/1000 pooled credits (Teams). Teams price was reduced from $35 to $30 in late 2024 as part of a broader pricing reset.

---

*Prices shown are list price in USD, billed monthly unless noted. Annual billing typically saves 15–20%. Enterprise pricing is custom and not publicly disclosed. All prices subject to change — always verify at the official source before quoting to a customer.*
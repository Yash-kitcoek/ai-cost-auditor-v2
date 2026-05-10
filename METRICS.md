# Metrics

## North Star Metric
**Qualified leads generated per week** — defined as email captures from audits 
showing >$100/month in savings.

This is the right North Star because the tool exists to generate leads for Credex. 
DAU is wrong (people use this once, not daily). Total audits is vanity without 
qualification. A qualified lead is someone who has already seen their savings number 
and chosen to share their email — the highest-intent signal available.

## 3 Input Metrics That Drive the North Star

**1. Audit completion rate** (visitors → audit submitted)
Target: >30%. Currently tracking via: audit POST requests / page loads.
If this drops below 20%, the form is too complex or the value prop isn't clear enough 
on the landing page.

**2. Email capture rate** (audits completed → email submitted)
Target: >15% overall, >35% for audits showing >$500/mo savings.
This is split because high-savings users have much stronger motivation to capture 
the report. If overall capture rate is low but high-savings capture is strong, the 
issue is the low-savings flow, not the product.

**3. Savings-found rate** (audits with >$0 savings / total audits)
Target: >60% of audits should surface at least some savings.
If this is too low, the audit engine rules need expanding. If too high (>90%), 
we may be manufacturing savings — which destroys trust and word-of-mouth.

## What to Instrument First

1. `audit_completed` event — fired when POST /api/audit returns 200. 
   Properties: total_spend, savings_found, tools_count, use_case, team_size.
2. `email_captured` event — fired on successful POST /api/email. 
   Properties: audit_id, savings_amount, is_high_savings.
3. `result_shared` event — fired when "Copy Link" is clicked. 
   Properties: audit_id, savings_amount.

These three events give you the full funnel: landing → audit → capture → viral loop.

## Pivot Trigger

If after 500 audits, email capture rate is below 8% AND average savings found 
is below $50/audit, the product has a product-market fit problem, not a distribution 
problem. At that point, pivot the audit engine to focus on API cost optimization 
(token usage analysis) rather than subscription plan comparison — that's where 
the real money is for technical teams.

The number: **8% capture rate on 500 audits = 40 leads**. 
If we can't get 40 leads from 500 audits, the value proposition isn't landing.
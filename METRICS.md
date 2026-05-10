# Metrics

## North Star metric

**Audits completed per week.**

Not visitors (too many don't convert to audits — low signal). Not email captures (a lagging metric — it only goes up after value is proven). Not revenue (too indirect for a free lead-gen tool at this stage). Audits completed is the moment value is delivered. If audits per week is growing, everything downstream — email captures, Credex consultations, credit purchases — grows with it.

---

## Three input metrics that drive the North Star

**1. Landing page → audit start rate** (target: >35%)
The share of visitors who add at least one tool to the form. If this is low, the headline or the form is wrong — visitors aren't understanding or trusting the value proposition fast enough. Instrumented as: `addTool` event fired ÷ page views.

**2. Audit start → completion rate** (target: >75%)
The share of users who start the form and actually hit "Run Audit." Drop-off here means the form is too long, confusing, or the plan dropdowns are frustrating. Instrumented as: `auditSubmitted` event ÷ `addTool` events.

**3. Time to first audit** (target: <90 seconds)
If it takes more than 90 seconds to go from landing to seeing results, we're losing people who came on impulse (an HN comment, a tweet, a colleague's Slack message). Instrumented as: median time between `pageView` and `auditResultShown` events.

---

## What I'd instrument first

In order of priority:
1. `page_view` with referrer (so we know which channels are working)
2. `tool_added` (which tool, which plan — tells us what the typical stack looks like)
3. `audit_submitted` (form completion)
4. `audit_result_shown` (including `totalMonthlySavings` — tells us what savings the engine is finding)
5. `email_captured` (with `monthlySavings` to understand the high-value segment)
6. `credex_cta_clicked` (the commercial event)

All of these can be done with Plausible (privacy-first, no cookie banner needed) or PostHog (free tier, good funnel views).

---

## The number that triggers a pivot

If the **audit → email capture rate drops below 10%** after 500 audits, the tool is not showing compelling enough value to earn the email address. This means either:
- The savings numbers are too small to be motivating (the engine is too conservative)
- The result page isn't making the savings feel real (design/copy problem)
- The wrong people are using the tool (distribution problem — wrong channels)

At 10% capture rate, the entire lead-gen funnel needs 2× the traffic to produce the same output. Paid acquisition becomes necessary and unit economics break. The pivot decision: rebuild the engine to be more aggressive with recommendations, or pivot the tool to a different audience where savings are larger (e.g., target enterprise teams where the savings per audit are 10× larger).
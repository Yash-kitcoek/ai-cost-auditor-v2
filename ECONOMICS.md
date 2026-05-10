# Economics

## What a converted lead is worth to Credex

Credex sells discounted AI infrastructure credits at a margin. Assume:
- Average first purchase: $2,000 in credits (conservative — a company spending $3,400/month on AI tools and saving 30% would want to buy credits upfront)
- Credex gross margin on credits: 15–25% (sourced from companies that overforecast)
- Average margin per transaction: **$300–$500**
- Retention: if the customer reorders (reasonable — AI spend is recurring), LTV over 12 months = 3 purchases average = **$900–$1,500 LTV**

For high-savings audits (>$500/mo identified savings), the customer has strong proof their AI spend is optimisable — conversion to a Credex purchase is higher. Call these "hot leads."

**Conservative LTV assumption: $500 per converted lead (first transaction only).**

---

## CAC at each channel

| Channel | Cost | Expected users | Expected email captures (20%) | Expected consultation clicks (10% of captures) | Expected Credex conversions (30% of consultations) | CAC |
|---|---|---|---|---|---|---|
| Hacker News Show HN | $0 | 800 | 160 | 16 | 5 | **$0** |
| Reddit posts | $0 | 200 | 40 | 4 | 1 | **$0** |
| Twitter cold DMs | 2 hrs labour | 50 | 10 | 1 | 0.3 | **~$0 + time** |
| Credex customer email | $0 (existing list) | 300 | 90 | 9 | 3 | **$0** |
| Blogger embed | 3 hrs to find/pitch | 400 | 80 | 8 | 2 | **~$0 + time** |

All channels are $0 paid spend. CAC is functionally **$0** for the first 90 days if distribution is done manually. At scale, if Credex allocates a marketing manager 10 hours/week: CAC ≈ (10 hrs × $80/hr) / (leads from that channel) — highly variable but easily under $100/lead.

---

## Conversion funnel math

```
Landing page visitors                1,000   (100%)
↓ Audit completed                      300   (30% — good for a tool that requires input)
↓ Email captured                        60   (20% of completions — shown after value)
↓ Credex consultation page clicked      12   (20% of email captures — high-savings cases only)
↓ Consultation booked                    4   (30% of CTA clicks)
↓ Credit purchase                        1   (30% of consultations → roughly 1 per 1,000 visitors)
```

**Revenue per 1,000 visitors: ~$500** (1 conversion × $500 avg transaction margin)

This is conservative. Visitors from HN who use the tool and see $2,000+ in annual savings are highly motivated — real-world consultation conversion is likely higher.

---

## What would have to be true for $1M ARR in 18 months

$1M ARR = $83,333/month revenue to Credex from tool-generated leads.

At $500 margin per transaction and 1 transaction per converted lead:
- Need: **167 converted leads/month** (purchases, not just consultations)
- At 30% consultation → purchase rate: need **556 consultations/month**
- At 20% email capture → consultation click rate: need **2,778 email captures/month**
- At 20% audit → email capture rate: need **13,900 audits/month**
- At 30% visitor → audit completion rate: need **46,333 monthly visitors**

**Is 46k monthly visitors achievable in 18 months?**

Yes, if:
1. The tool gets featured in 2–3 newsletters with 50k+ subscribers (TLDR, Pragmatic Engineer, Lenny's). Each gives a spike of 5,000–15,000 visitors and leaves a permanent SEO and link trail.
2. Credex embeds the tool in their existing customer communications. 500 customer companies × 2 employees who audit = 1,000 monthly completions from the base.
3. The embeddable widget is adopted by 10 bloggers who collectively get 100k monthly reads. Widget embed → 5% CTR → 5,000 monthly visits.
4. Organic SEO builds over 12 months for queries like "ai tool spend audit" and "cursor vs copilot cost". Realistic at 10k visits/month by month 12.

Combined: ~46k/month is achievable by month 15–18, not month 6. The $1M ARR target is 18-month realistic.

**The number that triggers a pivot:**
If after 3 months the audit → email capture rate is below 10% (currently projected at 20%), the tool is not showing enough value to earn the email. This means either the audit results are unconvincing (the savings aren't real or aren't displayed compellingly) or the user flow to the email gate is broken. At 10% capture rate, the funnel needs 2× the visitors for the same result — paid acquisition becomes necessary and the unit economics break.

**North Star for the tool:** audits completed per week (not visitors, not email captures — audits, because that's when value is delivered).
# Dev Log

---

## Day 1 — 2026-05-08

**Hours worked:** 5

### What I did:
Started the project by carefully reading the brief and planning the product direction before writing code. The main focus was ensuring the audit engine gives trustworthy and defensible recommendations instead of fake savings estimates.

Researched existing AI SaaS cost optimization tools and found very limited competition in this space.

Initialized the project using:

- Next.js 14
- TypeScript
- Tailwind CSS
- Supabase
- Resend

Created the initial project structure:

```txt
lib/audit/
lib/ai/
lib/db/
app/api/
```

Defined the core TypeScript interfaces:

- `AuditInput`
- `ToolEntry`
- `AuditResult`
- `ToolRecommendation`

Connected Supabase successfully and created the initial `audits` table.

### What I learned:
Supabase Row Level Security blocks reads by default even with anon keys. Added policies for safe public inserts and shared audit result fetching.

### Blockers / what I'm stuck on:
Usage-based API pricing is difficult to optimize fairly because spend fluctuates. Decided to provide efficiency recommendations instead of forced plan-switch suggestions.

### Plan for tomorrow:
Build the pricing datasets and first version of the audit rule engine.

---

## Day 2 — 2026-05-09

**Hours worked:** 6

### What I did:
Built `pricing.ts` containing verified pricing information for all supported AI tools and plans.

Cross-checked pricing directly from official pricing pages and documented verification dates.

Implemented the first version of the audit rule engine in `rules.ts` with support for:

- `downgrade-plan`
- `switch-vendor`
- `eliminate-redundancy`
- `keep`

Created `runAudit()` inside `engine.ts` to process user input and generate structured recommendations with savings calculations.

Started designing the scoring system for stack efficiency.

### What I learned:
Percentage-based scoring creates misleading results for low spenders. Switched to a weighted penalty-based scoring model starting from 100.

### Blockers / what I'm stuck on:
Balancing realistic optimization suggestions without becoming overly aggressive with savings recommendations.

### Plan for tomorrow:
Build the frontend form and connect the audit API end-to-end.

---

## Day 3 — 2026-05-10

**Hours worked:** 7

### What I did:
Built the main audit input form in `app/page.tsx`.

Implemented features including:

- Tool selector
- Dynamic plan dropdown
- Seats and spend inputs
- Team size support
- Primary use-case selector
- Persistent form state using localStorage

Created a custom `useFormState` hook to prevent data loss during refreshes.

Integrated the frontend with `POST /api/audit` and added loading and error handling states.

Debugged a hydration mismatch issue caused by localStorage during SSR.

### What I learned:
Even with `'use client'`, components still render server-side initially in Next.js App Router. Fixed hydration issues using a mounted `hydrated` state.

### Blockers / what I'm stuck on:
Audit results are generated correctly but the result UI still needs to be built.

### Plan for tomorrow:
Build the full result page and recommendation UI.

---

## Day 4 — 2026-05-11

**Hours worked:** 8

### What I did:
Built the complete result page experience including:

- `SavingsHero`
- `ScoreBadge`
- `RecommendationCard`
- `AISummaryBlock`
- `CredexCTA`
- `LeadCapture`

Added a dedicated “already optimized” state to avoid manufacturing fake savings opportunities.

Integrated the Anthropic API for AI-generated audit summaries with a rule-based fallback if the API fails.

Moved summary generation to an async background flow to improve performance.

### What I learned:
Gradient text rendering in Safari requires both:

```js
WebkitBackgroundClip: 'text'
WebkitTextFillColor: 'transparent'
```

### Blockers / what I'm stuck on:
Anthropic response latency occasionally slows the user experience.

### Plan for tomorrow:
Implement lead capture, email delivery, and shareable audit URLs.

---

## Day 5 — 2026-05-12

**Hours worked:** 6

### What I did:
Implemented the complete lead capture and sharing pipeline.

Added:

- `leads` table in Supabase
- `POST /api/email`
- Honeypot spam protection
- Rate limiting
- Email validation
- Resend integration
- Transactional email templates

Built shareable audit URLs using IDs generated with:

```js
crypto.randomUUID()
```

Created public audit endpoint:

```txt
GET /api/audit/[id]
```

Ensured public audit pages strip sensitive information like email and company data.

Added dynamic Open Graph metadata generation for result pages.

### What I learned:
Silent error handling creates misleading UX. Updated API routes to return proper HTTP errors instead of false success responses.

### Blockers / what I'm stuck on:
`nanoid` v5 caused ESM issues in Next.js API routes, so it was replaced with native UUID generation.

### Plan for tomorrow:
Testing, CI setup, Lighthouse improvements, and deployment validation.

---

## Day 6 — 2026-05-13

**Hours worked:** 5

### What I did:
Focused on testing, final polish, deployment readiness, and documentation.

Added 14 Vitest test cases covering:

- Savings calculations
- Rule engine behavior
- Validation logic
- Redundancy detection
- Score clamping
- Optimal stack detection

Configured GitHub Actions CI pipeline for automatic linting and test execution.

Ran Lighthouse audits and improved accessibility by adding explicit labels to form fields.

Fixed Supabase schema issues related to ID types.

Performed final deployment verification on Vercel.

Added the deep analysis feature with:

- Plan optimization insights
- Alternative tool recommendations
- Credits efficiency analysis

Implemented async loading with rule-based fallback if the Anthropic API is unavailable.

Updated:

- `PRICING_DATA.md`
- README screenshots
- OG image references
- GTM and economics documentation

### What I learned:
The most valuable part of the project is the audit engine reasoning itself. Trustworthy recommendations matter more than flashy UI.

### Blockers / what I'm stuck on:
Documentation took longer than expected because writing clear and honest technical explanations requires significant effort.

### Project Status:
✅ Project completed successfully and deployed to production.

### Plan for tomorrow:
Monitor production logs, review incoming leads, and respond quickly to any reviewer or outreach feedback.
Dev Log
Day 1 — 2026-05-08

Hours worked: 5

What I did:
Started the project by deeply reading the brief and defining the product direction before writing code. The main goal was to build an audit engine that gives trustworthy recommendations instead of fake savings numbers. Researched existing AI SaaS cost tools and realized there are very few real competitors in this space.

Initialized the project using Next.js 14, TypeScript, Tailwind CSS, Supabase, and Resend. Created the core project structure including:

lib/audit/
lib/ai/
lib/db/
app/api/

Defined all core TypeScript interfaces including:

AuditInput
ToolEntry
AuditResult
ToolRecommendation

Connected Supabase successfully and created the initial audits table.

What I learned:
Supabase Row Level Security blocks reads by default even with anon keys. Added policies for public inserts and safe shared-result fetching.

Blockers / what I'm stuck on:
Handling usage-based pricing fairly is difficult because costs are variable. Decided not to force recommendations for API billing tools and instead provide efficiency suggestions.

Plan for tomorrow:
Build pricing datasets and the first version of the audit rule engine.

Day 2 — 2026-05-09

Hours worked: 6

What I did:
Built pricing.ts containing verified pricing information for all supported AI tools and plans. Cross-checked pricing directly from official pricing pages and documented verification dates.

Implemented the first version of the audit rule engine in rules.ts with support for:

downgrade-plan
switch-vendor
eliminate-redundancy
keep

Created runAudit() inside engine.ts which processes user input and generates structured recommendations with savings calculations.

Started designing the scoring system for stack efficiency.

What I learned:
Simple percentage-based scoring creates misleading results for low spenders. Switched to a weighted penalty-based scoring model starting from 100.

Blockers / what I'm stuck on:
Finding the right balance between “helpful optimization” and “over-aggressive savings suggestions.”

Plan for tomorrow:
Build the frontend form and connect the audit API end-to-end.

Day 3 — 2026-05-10

Hours worked: 7

What I did:
Built the main audit input form in app/page.tsx.

Features implemented:

Tool selector
Dynamic plan dropdown
Seats and spend inputs
Team size support
Primary use-case selector
Persistent form state using localStorage

Created a custom useFormState hook to prevent data loss during refreshes.

Integrated the frontend with POST /api/audit and implemented loading/error handling states.

Debugged a hydration mismatch issue caused by localStorage during SSR.

What I learned:
Even with 'use client', components still render server-side initially in Next.js App Router. Fixed hydration issues using a mounted hydrated state.

Blockers / what I'm stuck on:
Audit results are generated correctly but no UI exists yet for displaying them.

Plan for tomorrow:
Build the full result page and recommendation UI.

Day 4 — 2026-05-11

Hours worked: 8

What I did:
Built the complete result page experience including:

SavingsHero
ScoreBadge
RecommendationCard
AISummaryBlock
CredexCTA
LeadCapture

Added a dedicated “already optimized” state to avoid manufacturing fake savings opportunities.

Integrated Anthropic API for AI-generated audit summaries with a rule-based fallback if API generation fails.

Moved AI summary generation to an async background flow to improve response speed.

What I learned:
Gradient text rendering in Safari requires both:

WebkitBackgroundClip: 'text'
WebkitTextFillColor: 'transparent'

Blockers / what I'm stuck on:
Anthropic response latency occasionally slows the user experience.

Plan for tomorrow:
Implement lead capture, email delivery, and shareable audit URLs.

Day 5 — 2026-05-12

Hours worked: 6

What I did:
Implemented the full lead capture and sharing pipeline.

Added:

leads table in Supabase
POST /api/email
Honeypot spam protection
Rate limiting
Email validation
Resend integration
Transactional email templates

Built shareable audit URLs using unique IDs generated with crypto.randomUUID().

Created public audit fetching endpoint:

GET /api/audit/[id]

Ensured public audit pages strip sensitive fields like email and company data.

Added dynamic Open Graph metadata generation for result pages.

What I learned:
Silent error handling creates misleading UX. Updated all API routes to return proper HTTP errors instead of fake success responses.

Blockers / what I'm stuck on:
nanoid v5 caused ESM issues in Next.js API routes, so I replaced it with native UUID generation.

Plan for tomorrow:
Testing, CI setup, Lighthouse improvements, and deployment validation.

Day 6 — 2026-05-13

Hours worked: 5

What I did:
Focused entirely on testing, polish, and deployment readiness.

Added 14 Vitest test cases covering:

Savings calculations
Rule engine behavior
Validation logic
Redundancy detection
Score clamping
Optimal stack detection

Configured GitHub Actions CI pipeline for automatic linting and test execution.

Ran Lighthouse audits and improved accessibility by adding explicit labels to all form fields.

Fixed Supabase schema issues related to ID types.

Performed final deployment verification on Vercel.

What I learned:
Good audit logic matters more than flashy UI. The product becomes valuable only if users trust the reasoning behind every recommendation.

Blockers / what I'm stuck on:
Documentation took significantly longer than expected. Writing honest technical documentation is harder than filling templates.

Project Status:
✅ Project completed and deployed successfully.
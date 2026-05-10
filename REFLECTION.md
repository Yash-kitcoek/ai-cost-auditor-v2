# Reflection

## 1. The hardest bug — and how I debugged it

The hardest bug was the "Report sent!" false positive: the UI showed the success state even when no email was actually delivered and no lead was saved to the database.

My first hypothesis was that the Resend API key was wrong. I checked the key, compared it to the dashboard — it was correct. Hypothesis rejected.

Second hypothesis: the email was being delivered but going to spam. Checked Gmail spam folder. Nothing there.

Third hypothesis: something in the network path was silently failing. I opened the browser DevTools Network tab and watched the `POST /api/email` request. Status 200, response `{ "success": true }`. So the API was returning success. But was the email actually sent?

I added `console.log('Resend response:', result)` inside the API route and tailed the Vercel function logs. The log showed `Resend response: { data: null, error: { message: "The sender domain is not verified." } }`. The Resend SDK returns an error object instead of throwing — so my `try/catch` never caught it. I was checking `if (process.env.RESEND_API_KEY)` to decide whether to attempt sending, but I wasn't checking the *result* of the send call. The error was right there in the return value and I was discarding it.

The fix was two lines: `const { error: resendError } = await resend.emails.send(...)` followed by `if (resendError) return NextResponse.json({ error: resendError.message }, { status: 500 })`. Now the frontend gets a real error and shows it instead of showing "Report sent!"

The root cause was an assumption: I assumed SDK calls throw on failure. Resend (like many modern SDKs) returns a discriminated union instead. I learned to always check the return value of SDK calls, not just catch exceptions.

---

## 2. A decision I reversed mid-week

On day 3 I initially built the result page as a separate route that fetched the audit result from the API on every load. The idea was simplicity — no localStorage complexity, the database is the source of truth.

By day 4 I reversed this. The problem: the Anthropic API adds 3–5 seconds to the audit route, and saving to Supabase adds another ~200ms. On a bad connection, the round-trip from submitting the form to seeing the result page could be 6+ seconds. If the user then shared the link with a colleague, that colleague's load added another Supabase read. Every load was slow.

The fix was a hybrid: save the result to `localStorage` immediately after the audit API returns (before navigating to the result page), then read from localStorage first on the result page. Only fall back to the API if localStorage is empty — which handles shared URLs from other devices.

What made me reverse it was actually watching someone else use the tool on day 4. They submitted the form, waited, then immediately hit the back button because they thought it had hung. The wait was only 4 seconds but felt much longer. The localStorage approach makes the result page feel instant for the person who just submitted, which is the most important UX moment.

---

## 3. What I'd build in week 2

**Benchmark mode** is the highest-priority week-2 feature, and I didn't expect that until the user interviews told me. Every person I talked to asked some version of "how does my spend compare to other companies my size?" The current tool tells you whether *you* are overpaying relative to the plan alternatives. It doesn't tell you whether your *total AI spend per developer* is normal. A $500/month team of 2 is spending $250/developer — that's on the high end. A $5,000/month team of 30 is spending $167/developer — that's below average for a tech company in 2025.

I'd build this by collecting team size and monthly spend data from submitted audits (opt-in, clearly disclosed), then computing percentiles by team size bucket and industry. The result page would show: "Your AI spend per developer: $X. Companies your size (5–15 people, software): median $Y, 75th percentile $Z."

Second priority: **PDF export**. Three of the user interview subjects said they'd want to share the report with their CFO or finance team. A link to a web page doesn't always cut it — finance people want a document they can attach to a budget review.

Third priority: **embeddable widget**. A `<script>` tag that bloggers and Hacker News commenters could drop into posts. "I write about AI tools — I want my readers to be able to audit their stack without leaving the article." This is also the viral loop: every blogger who embeds it becomes a distribution channel.

---

## 4. How I used AI tools

I used Claude (Sonnet) and GitHub Copilot throughout the build.

**Claude** was most useful for:
- Drafting the initial TypeScript types for `AuditInput`, `ToolEntry`, and `AuditResult` — I described the data model in plain English and it produced well-typed interfaces in seconds
- The Resend email HTML template — writing HTML email is miserable; Claude got me 80% of the way there
- Debugging the Supabase RLS policies when my anon key couldn't read back records I'd just inserted
- Drafting the Anthropic API prompt for the audit summary

**GitHub Copilot** was useful for autocompleting repetitive patterns — the pricing data entries especially. After I wrote the first 3 tool entries, Copilot predicted the structure correctly for the remaining 5.

**What I didn't trust AI with:**
- The pricing numbers themselves. I checked every figure against the actual vendor pricing pages manually. Claude's training data has a cutoff and pricing changes frequently — I caught two errors where Claude quoted outdated prices (GitHub Copilot Business was $21, now $19; Claude Pro was $20, now remains $20 but the API direct pricing had changed).
- The audit rule logic. I wrote every rule myself and tested each one manually before trusting the engine. The logic needs to be defensible to a finance person — "the AI said so" is not a defensible reason.

**One specific time the AI was wrong:**
When I asked Claude to help me write the rate limiting logic, it suggested using `Date.now() % 3600000 === 0` to reset the counter at the top of each hour. This is wrong — it would only reset in the exact millisecond that `Date.now()` is divisible by 3600000, which almost never happens. The correct approach is to store a `resetAt` timestamp set to `now + 3600000` when the first request comes in, and check `now > resetAt` to decide whether to reset. I caught this because I tested the rate limiting manually and noticed it never actually reset between test runs.

---

## 5. Self-rating

**Discipline: 7/10**
I started on day 1 (the day the brief was shared) and committed on all 7 days, which meets the requirement. But I front-loaded the code and back-loaded the documentation — I should have written the GTM and user interview documents earlier, not treated them as things to "fill in at the end."

**Code quality: 7/10**
The audit engine is clean, typed, and tested. The result page is a single large file with several components in it — that worked for the build but would need splitting before a team touched it. Error handling improved significantly during the week but the early API routes were too lenient about silent failures.

**Design sense: 6/10**
The dark UI with gradient accents is distinctive and readable. The savings hero is the right focal point. What's missing: mobile layout is functional but not delightful — the tool grid wraps awkwardly on 375px screens. I'd spend more time on the mobile form in week 2.

**Problem-solving: 8/10**
The silent email failure bug was solved methodically — hypothesis, test, reject, next hypothesis. The localStorage hydration issue was caught before it shipped. I generally moved from "what's wrong" to "what would I need to see to confirm that hypothesis" rather than changing random things and hoping.

**Entrepreneurial thinking: 7/10**
The core insight — an audit tool that generates leads for Credex by surfacing real overspend — is solid. The user interviews changed the product roadmap in a useful way (benchmark mode). What I underestimated: the viral mechanism. The shareable URL is there, but I didn't think hard enough about why someone would actually share their audit result. Most people don't want to broadcast their AI spending. The shareable feature needs a better angle — maybe "share with your team to decide together" rather than "share publicly."
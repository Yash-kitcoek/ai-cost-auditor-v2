import { AuditResult } from '../audit/types';

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';

export function buildPrompt(result: AuditResult): string {
  const topSavings = result.recommendations
    .filter((r) => r.savings > 0)
    .sort((a, b) => b.savings - a.savings)
    .slice(0, 3)
    .map((r) => `${r.toolName}: save $${r.savings}/mo by ${r.action === 'downgrade' ? 'downgrading to ' + r.recommendedPlan : 'switching to ' + r.recommendedTool}`)
    .join('; ');

  return `You are a concise AI cost analyst. Write a single paragraph (90–110 words, no bullet points, no headers) summarizing this AI tool spend audit for a ${result.teamSize}-person team focused on ${result.useCase}.

Current monthly spend: $${result.totalCurrentSpend}
Potential monthly savings: $${result.totalMonthlySavings}
Top recommendations: ${topSavings || 'Already optimized — no major savings found'}

Tone: direct, financial, like a CFO giving a 30-second brief. Name specific tools and dollar amounts. End with one forward-looking sentence. Do not use the word "leverage." Do not use phrases like "In conclusion" or "Overall."`;
}

export function generateFallbackSummary(result: AuditResult): string {
  if (result.isAlreadyOptimal) {
    return `Your team's AI tool stack is well-optimized for a ${result.teamSize}-person ${result.useCase} workflow. At $${result.totalCurrentSpend}/month, you're getting solid value — no obvious redundancies or over-provisioned plans were detected. Keep reviewing quarterly as vendor pricing evolves.`;
  }

  const topRec = result.recommendations
    .filter((r) => r.savings > 0)
    .sort((a, b) => b.savings - a.savings)[0];

  return `Your team is spending $${result.totalCurrentSpend}/month across AI tools, with $${result.totalMonthlySavings}/month ($${result.totalAnnualSavings}/year) in identified savings. ${topRec ? `The biggest opportunity is ${topRec.toolName} — ${topRec.reason.split('.')[0]}.` : ''} Implementing these recommendations requires minimal workflow disruption and no capability loss for your primary ${result.useCase} workload. Review the full breakdown below.`;
}

export async function generateAISummary(result: AuditResult): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return generateFallbackSummary(result);
  }

  try {
    const response = await fetch(ANTHROPIC_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 200,
        messages: [
          {
            role: 'user',
            content: buildPrompt(result),
          },
        ],
      }),
      signal: AbortSignal.timeout(8000),
    });

    if (!response.ok) {
      console.error('Anthropic API error:', response.status);
      return generateFallbackSummary(result);
    }

    const data = await response.json();
    const text = data.content?.[0]?.text;
    if (!text) return generateFallbackSummary(result);
    return text.trim();
  } catch (err) {
    console.error('AI summary failed, using fallback:', err);
    return generateFallbackSummary(result);
  }
}
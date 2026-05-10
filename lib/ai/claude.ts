import { AuditResult } from '../audit/types';

export function generateFallbackSummary(result: AuditResult): string {
  if (result.isAlreadyOptimal) {
    return `Your ${result.teamSize}-person ${result.useCase} team's AI stack is well-optimized at $${result.totalCurrentSpend}/month. No redundancies or over-provisioned plans detected. No immediate action required — review quarterly as vendor pricing evolves.`;
  }

  const topRec = result.recommendations
    .filter((r) => r.savings > 0)
    .sort((a, b) => b.savings - a.savings)[0];

  const secondRec = result.recommendations
    .filter((r) => r.savings > 0)
    .sort((a, b) => b.savings - a.savings)[1];

  return `Your ${result.teamSize}-person ${result.useCase} team spends $${result.totalCurrentSpend}/month on AI tools — $${result.totalMonthlySavings}/month ($${result.totalAnnualSavings}/year) above what your workflow requires. ${topRec ? `The largest inefficiency is ${topRec.toolName}: ${topRec.reason.split('.')[0]}.` : ''} ${secondRec ? `Additional savings come from ${secondRec.toolName} ($${secondRec.savings}/month).` : ''} Implementing these changes preserves your ${result.useCase} workflow while eliminating unnecessary spend.`;
}

export async function generateAISummary(result: AuditResult): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return generateFallbackSummary(result);

  try {
    const topIssues = result.recommendations
      .filter((r) => r.savings > 0)
      .sort((a, b) => b.savings - a.savings)
      .slice(0, 3)
      .map((r) => `• ${r.toolName}: ${r.reason.split('.')[0]}`)
      .join('\n');

    const response = await fetch('https://api.anthropic.com/v1/messages', {
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
            content: `You are a blunt AI cost analyst. Write a single paragraph (90–110 words) summarizing this audit for a ${result.teamSize}-person ${result.useCase} team spending $${result.totalCurrentSpend}/month.

Top issues found:
${topIssues || 'No major issues — stack is optimized'}

Total potential savings: $${result.totalMonthlySavings}/month

Rules:
- Be direct and analytical, like a CFO giving a 30-second brief
- Name specific tools and dollar amounts
- Mention the biggest single inefficiency first
- Do NOT use phrases like "minimal workflow disruption", "leverage", "In conclusion", or "Overall"
- No bullet points — single paragraph only
- End with one forward-looking sentence about what fixing this unlocks`,
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
    return data.content?.[0]?.text?.trim() || generateFallbackSummary(result);
  } catch (err) {
    console.error('AI summary failed:', err);
    return generateFallbackSummary(result);
  }
}
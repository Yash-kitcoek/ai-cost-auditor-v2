import { AuditResult } from '../audit/types';

export function generateFallbackSummary(result: AuditResult): string {
  if (result.isAlreadyOptimal) {
    return `Your team's AI tool stack is well-optimized for a ${result.teamSize}-person ${result.useCase} workflow. At $${result.totalCurrentSpend}/month, you're getting solid value — no obvious redundancies or over-provisioned plans detected. Review quarterly as vendor pricing evolves.`;
  }
  const topRec = result.recommendations.filter((r) => r.savings > 0).sort((a, b) => b.savings - a.savings)[0];
  return `Your team spends $${result.totalCurrentSpend}/month across AI tools, with $${result.totalMonthlySavings}/month ($${result.totalAnnualSavings}/year) in identified savings. ${topRec ? `The biggest opportunity is ${topRec.toolName} — ${topRec.reason.split('.')[0]}.` : ''} Implementing these recommendations requires minimal workflow disruption for your ${result.useCase} workload.`;
}

export async function generateAISummary(result: AuditResult): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return generateFallbackSummary(result);

  try {
    const topSavings = result.recommendations
      .filter((r) => r.savings > 0).sort((a, b) => b.savings - a.savings).slice(0, 3)
      .map((r) => `${r.toolName}: save $${r.savings}/mo`).join('; ');

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 200,
        messages: [{
          role: 'user',
          content: `You are a concise AI cost analyst. Write a single paragraph (90-110 words, no bullet points) summarizing this audit for a ${result.teamSize}-person ${result.useCase} team. Current spend: $${result.totalCurrentSpend}/mo. Potential savings: $${result.totalMonthlySavings}/mo. Top recommendations: ${topSavings || 'Already optimized'}. Tone: direct, financial, like a CFO briefing. Name specific tools and dollar amounts. Do not use the word "leverage".`
        }],
      }),
      signal: AbortSignal.timeout(8000),
    });
    const data = await response.json();
    return data.content?.[0]?.text?.trim() || generateFallbackSummary(result);
  } catch {
    return generateFallbackSummary(result);
  }
}
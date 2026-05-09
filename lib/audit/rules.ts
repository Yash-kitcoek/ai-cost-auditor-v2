import { ToolEntry, ToolRecommendation, UseCase } from './types';
import { PRICING, TOOL_NAMES, getPlan } from './pricing';

function findCheaperPlan(toolId: string, planId: string, seats: number, useCase: UseCase) {
  const plans = PRICING[toolId];
  if (!plans) return null;
  const currentPlan = getPlan(toolId, planId);
  if (!currentPlan) return null;

  if (toolId === 'cursor' && planId === 'business' && seats <= 3 && useCase === 'coding') {
    return plans.find((p) => p.planId === 'pro') || null;
  }
  if (toolId === 'claude' && planId === 'max' && seats <= 2) {
    return plans.find((p) => p.planId === 'pro') || null;
  }
  if (toolId === 'chatgpt' && planId === 'team' && seats === 1) {
    return plans.find((p) => p.planId === 'plus') || null;
  }
  if (toolId === 'gemini' && planId === 'business' && seats <= 3) {
    return plans.find((p) => p.planId === 'pro') || null;
  }
  if (toolId === 'github-copilot' && planId === 'enterprise' && seats < 10) {
    return plans.find((p) => p.planId === 'business') || null;
  }
  return null;
}

function findAlternative(toolId: string, planId: string, seats: number, useCase: UseCase, alreadyHas: string[]) {
  if (toolId === 'github-copilot' && planId === 'individual' && seats === 1 && useCase === 'coding' && !alreadyHas.includes('cursor')) {
    return { toolId: 'cursor', planId: 'hobby', label: 'Cursor Hobby (Free)', pricePerSeat: 0,
      reason: 'Cursor Hobby is free and provides inline AI completions comparable to Copilot Individual for solo developers. Switching saves $10/month with no functionality loss.' };
  }
  if (toolId === 'chatgpt' && planId === 'plus' && (useCase === 'writing' || useCase === 'research') && !alreadyHas.includes('claude')) {
    return { toolId: 'claude', planId: 'pro', label: 'Claude Pro', pricePerSeat: 20,
      reason: 'Claude Pro ($20/seat) matches ChatGPT Plus pricing but benchmarks significantly better on long-form writing and document analysis — the primary tasks for your use case.' };
  }
  return null;
}

export function detectRedundancy(tools: ToolEntry[], useCase: UseCase): string | null {
  const ids = tools.map((t) => t.toolId);
  const hasPaidClaude = ids.includes('claude') && tools.find((t) => t.toolId === 'claude')?.plan !== 'free';
  const hasPaidChatGPT = ids.includes('chatgpt') && tools.find((t) => t.toolId === 'chatgpt')?.plan !== 'free';

  if (hasPaidClaude && hasPaidChatGPT && useCase !== 'mixed') {
    return 'You are paying for both Claude and ChatGPT subscriptions. For non-mixed workloads, one general-purpose LLM is typically sufficient. Evaluate which fits your workflow better and cancel the other.';
  }
  if (ids.includes('anthropic-api') && hasPaidClaude) {
    return 'You have both a Claude subscription and direct Anthropic API access. If your primary use is the chat UI, the subscription may be redundant with API credits.';
  }
  if (ids.includes('openai-api') && hasPaidChatGPT) {
    return 'You have both a ChatGPT subscription and direct OpenAI API access. Consolidate to the API with a thin wrapper for custom workflows, or the subscription for chat-only use.';
  }
  return null;
}

export function evaluateTool(entry: ToolEntry, useCase: UseCase, teamSize: number, allToolIds: string[]): ToolRecommendation {
  const { toolId, plan, monthlySpend, seats } = entry;
  const toolName = TOOL_NAMES[toolId] || toolId;
  const currentPlan = getPlan(toolId, plan);

  const cheaperPlan = findCheaperPlan(toolId, plan, seats, useCase);
  if (cheaperPlan) {
    const newSpend = cheaperPlan.pricePerSeat * seats;
    const savings = monthlySpend - newSpend;
    if (savings > 0) {
      return { toolId, toolName, currentPlan: currentPlan?.label || plan, currentSpend: monthlySpend,
        action: 'downgrade', recommendedPlan: cheaperPlan.label, recommendedSpend: newSpend, savings,
        reason: `${toolName} — your current plan includes features beyond what a ${seats}-seat ${useCase} team typically uses. ${cheaperPlan.label} covers all core functionality at $${cheaperPlan.pricePerSeat}/seat.` };
    }
  }

  const alt = findAlternative(toolId, plan, seats, useCase, allToolIds);
  if (alt) {
    const newSpend = alt.pricePerSeat * seats;
    const savings = monthlySpend - newSpend;
    if (savings > 0) {
      return { toolId, toolName, currentPlan: currentPlan?.label || plan, currentSpend: monthlySpend,
        action: 'switch', recommendedTool: alt.label, recommendedSpend: newSpend, savings, reason: alt.reason };
    }
  }

  return { toolId, toolName, currentPlan: currentPlan?.label || plan, currentSpend: monthlySpend,
    action: 'keep', recommendedSpend: monthlySpend, savings: 0,
    reason: `${toolName} plan is well-matched to your ${seats}-seat ${useCase} team. No cheaper alternative offers equivalent capability.` };
}
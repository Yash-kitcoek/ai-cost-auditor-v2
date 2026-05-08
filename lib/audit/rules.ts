import { ToolEntry, ToolRecommendation, UseCase } from './types';
import { PRICING, TOOL_NAMES, getPlan } from './pricing';

// ─── Rule: Is Team plan being used for too few users? ────────────────────────
function isTeamOverkill(toolId: string, planId: string, seats: number): boolean {
  const teamMinSeats: Record<string, number> = {
    claude: 5,
    chatgpt: 2,
  };
  const min = teamMinSeats[toolId];
  if (!min) return false;
  return planId === 'team' && seats < min;
}

// ─── Rule: Can they downgrade within same vendor? ────────────────────────────
function findCheaperPlan(
  toolId: string,
  currentPlanId: string,
  seats: number,
  useCase: UseCase
): { planId: string; label: string; pricePerSeat: number } | null {
  const plans = PRICING[toolId];
  if (!plans) return null;
  const currentPlan = getPlan(toolId, currentPlanId);
  if (!currentPlan) return null;

  // For coding use cases, Cursor Pro is sufficient for individuals / small teams
  if (toolId === 'cursor' && currentPlanId === 'business' && seats <= 3 && useCase === 'coding') {
    const pro = plans.find((p) => p.planId === 'pro');
    if (pro && pro.pricePerSeat < currentPlan.pricePerSeat) return pro;
  }

  // Claude Max → Claude Pro for non-power users (teams < 3, not API-heavy)
  if (toolId === 'claude' && currentPlanId === 'max' && seats <= 2) {
    const pro = plans.find((p) => p.planId === 'pro');
    if (pro && pro.pricePerSeat < currentPlan.pricePerSeat) return pro;
  }

  // ChatGPT Team → Plus for solo users
  if (toolId === 'chatgpt' && currentPlanId === 'team' && seats === 1) {
    const plus = plans.find((p) => p.planId === 'plus');
    if (plus && plus.pricePerSeat < currentPlan.pricePerSeat) return plus;
  }

  // Gemini Business → Gemini Advanced (Pro) for small teams
  if (toolId === 'gemini' && currentPlanId === 'business' && seats <= 3) {
    const pro = plans.find((p) => p.planId === 'pro');
    if (pro && pro.pricePerSeat < currentPlan.pricePerSeat) return pro;
  }

  // GitHub Copilot Enterprise → Business for teams < 10
  if (toolId === 'github-copilot' && currentPlanId === 'enterprise' && seats < 10) {
    const biz = plans.find((p) => p.planId === 'business');
    if (biz && biz.pricePerSeat < currentPlan.pricePerSeat) return biz;
  }

  return null;
}

// ─── Rule: Is there a substantially cheaper alternative? ─────────────────────
interface AlternativeSuggestion {
  toolId: string;
  planId: string;
  label: string;
  pricePerSeat: number;
  reason: string;
}

function findAlternative(
  toolId: string,
  planId: string,
  seats: number,
  useCase: UseCase,
  alreadyHasTools: string[]
): AlternativeSuggestion | null {
  // Don't suggest tools the user already has
  const has = (id: string) => alreadyHasTools.includes(id);

  // Cursor Business → Windsurf Teams (cheaper for small coding teams)
  if (
    toolId === 'cursor' &&
    planId === 'business' &&
    seats <= 5 &&
    useCase === 'coding' &&
    !has('windsurf')
  ) {
    return {
      toolId: 'windsurf',
      planId: 'teams',
      label: 'Windsurf Teams',
      pricePerSeat: 35,
      reason:
        'Windsurf Teams ($35/seat) offers comparable AI coding assistance at $5 less per seat than Cursor Business. For teams ≤5, the annual saving is meaningful without sacrificing core features.',
    };
  }

  // ChatGPT Plus → Claude Pro (better for writing/research; same price)
  if (
    toolId === 'chatgpt' &&
    planId === 'plus' &&
    (useCase === 'writing' || useCase === 'research') &&
    !has('claude')
  ) {
    return {
      toolId: 'claude',
      planId: 'pro',
      label: 'Claude Pro',
      pricePerSeat: 20,
      reason:
        'Claude Pro ($20/seat) matches ChatGPT Plus pricing but benchmarks better on long-form writing and document analysis — the primary tasks for your use case.',
    };
  }

  // OpenAI API → Anthropic API for writing/research (cost advantage on Claude Haiku)
  if (
    toolId === 'openai-api' &&
    (useCase === 'writing' || useCase === 'research' || useCase === 'data') &&
    !has('anthropic-api')
  ) {
    return null; // API costs are usage-dependent; flag in reason instead
  }

  // GitHub Copilot Individual → Cursor Hobby (free) for solo devs
  if (
    toolId === 'github-copilot' &&
    planId === 'individual' &&
    seats === 1 &&
    useCase === 'coding' &&
    !has('cursor')
  ) {
    return {
      toolId: 'cursor',
      planId: 'hobby',
      label: 'Cursor Hobby (Free)',
      pricePerSeat: 0,
      reason:
        'Cursor Hobby is free and provides inline AI completions comparable to Copilot Individual for solo developers. Switching saves $10/month with no functionality loss for most coding workflows.',
    };
  }

  return null;
}

// ─── Rule: Redundancy detection ──────────────────────────────────────────────
// If user has both ChatGPT Plus AND Claude Pro AND same use case → suggest dropping one
export function detectRedundancy(tools: ToolEntry[], useCase: UseCase): string | null {
  const ids = tools.map((t) => t.toolId);
  const hasClaude = ids.includes('claude') && tools.find((t) => t.toolId === 'claude')?.plan !== 'free';
  const hasChatGPT =
    ids.includes('chatgpt') && tools.find((t) => t.toolId === 'chatgpt')?.plan !== 'free';
  const hasAnthropicAPI = ids.includes('anthropic-api');
  const hasOpenAIAPI = ids.includes('openai-api');

  if (hasClaude && hasChatGPT && useCase !== 'mixed') {
    return 'You are paying for both Claude and ChatGPT subscriptions. For non-mixed workloads, one general-purpose LLM is typically sufficient. Evaluate which fits your workflow better and cancel the other.';
  }

  if (hasAnthropicAPI && hasClaude) {
    return 'You have both a Claude subscription and direct Anthropic API access. If your primary use is the chat UI, the subscription is likely redundant with API credits — or vice versa.';
  }

  if (hasOpenAIAPI && hasChatGPT) {
    return 'You have both a ChatGPT subscription and direct OpenAI API access. Consolidate: use the API with a thin wrapper if you need custom workflows, or the subscription if you primarily use the chat interface.';
  }

  return null;
}

// ─── Main rule evaluator ─────────────────────────────────────────────────────
export function evaluateTool(
  entry: ToolEntry,
  useCase: UseCase,
  teamSize: number,
  allToolIds: string[]
): ToolRecommendation {
  const { toolId, plan, monthlySpend, seats } = entry;
  const toolName = TOOL_NAMES[toolId] || toolId;
  const currentPlan = getPlan(toolId, plan);
  const currentSpend = monthlySpend; // user-entered is authoritative

  // 1. Check for within-vendor downgrade
  const cheaperPlan = findCheaperPlan(toolId, plan, seats, useCase);
  if (cheaperPlan) {
    const newSpend = cheaperPlan.pricePerSeat * seats;
    const savings = currentSpend - newSpend;
    if (savings > 0) {
      return {
        toolId,
        toolName,
        currentPlan: currentPlan?.label || plan,
        currentSpend,
        action: 'downgrade',
        recommendedPlan: cheaperPlan.label,
        recommendedSpend: newSpend,
        savings,
        reason: buildDowngradeReason(toolId, plan, cheaperPlan.planId, seats, useCase),
      };
    }
  }

  // 2. Team-size overkill
  if (isTeamOverkill(toolId, plan, seats)) {
    const indivPlan = PRICING[toolId]?.find(
      (p) => p.planId === 'pro' || p.planId === 'plus' || p.planId === 'individual'
    );
    if (indivPlan) {
      const newSpend = indivPlan.pricePerSeat * seats;
      const savings = currentSpend - newSpend;
      if (savings > 0) {
        return {
          toolId,
          toolName,
          currentPlan: currentPlan?.label || plan,
          currentSpend,
          action: 'downgrade',
          recommendedPlan: indivPlan.label,
          recommendedSpend: newSpend,
          savings,
          reason: `${toolName} Team plan requires a minimum seat count that your team doesn't justify. Switching each user to ${indivPlan.label} ($${indivPlan.pricePerSeat}/seat) achieves the same capability at lower total cost.`,
        };
      }
    }
  }

  // 3. Check for alternative tool
  const alt = findAlternative(toolId, plan, seats, useCase, allToolIds);
  if (alt) {
    const newSpend = alt.pricePerSeat * seats;
    const savings = currentSpend - newSpend;
    if (savings > 0) {
      return {
        toolId,
        toolName,
        currentPlan: currentPlan?.label || plan,
        currentSpend,
        action: 'switch',
        recommendedTool: alt.label,
        recommendedSpend: newSpend,
        savings,
        reason: alt.reason,
      };
    }
  }

  // 4. Already optimal
  return {
    toolId,
    toolName,
    currentPlan: currentPlan?.label || plan,
    currentSpend,
    action: 'keep',
    recommendedSpend: currentSpend,
    savings: 0,
    reason: buildKeepReason(toolId, plan, useCase, seats),
  };
}

function buildDowngradeReason(
  toolId: string,
  currentPlan: string,
  newPlan: string,
  seats: number,
  useCase: UseCase
): string {
  const reasonMap: Record<string, string> = {
    'cursor-business-pro': `Cursor Business adds admin controls and SSO — features that matter at 5+ seats. With ${seats} seat(s) on a ${useCase} workload, Cursor Pro delivers the same AI completion quality at half the price.`,
    'claude-max-pro': `Claude Max is designed for power users running 5-hour deep research sessions daily. For ${seats} seat(s) with a typical ${useCase} workflow, Claude Pro's generous limits are rarely hit and cost 80% less.`,
    'chatgpt-team-plus': `ChatGPT Team's value prop (shared workspace, admin panel) is wasted on a single seat. ChatGPT Plus delivers identical model access at $10/month less.`,
    'gemini-business-pro': `Gemini for Workspace Business bundles Google Workspace features you may already pay for separately. Gemini Advanced via One AI Premium gives the same model access at $24→$20/seat.`,
    'github-copilot-enterprise-business': `GitHub Copilot Enterprise adds fine-tuned models and Jira/docs integrations — overkill for teams under 10. Copilot Business covers code completion and chat at less than half the cost.`,
  };
  const key = `${toolId}-${currentPlan}-${newPlan}`;
  return (
    reasonMap[key] ||
    `The current plan includes features beyond what a ${seats}-seat ${useCase} team typically uses. The lower tier covers all core functionality at a lower price.`
  );
}

function buildKeepReason(
  toolId: string,
  plan: string,
  useCase: UseCase,
  seats: number
): string {
  const keepMap: Record<string, string> = {
    'cursor-pro': 'Cursor Pro is the right tier for professional individual coders and small teams — full model access, no usage caps that matter day-to-day.',
    'github-copilot-individual': 'GitHub Copilot Individual is well-priced for solo developers and provides strong IDE integration across all major editors.',
    'claude-pro': 'Claude Pro is correctly sized for most professional users — the usage limits are generous and Max is only justified for extremely heavy daily use.',
    'chatgpt-plus': 'ChatGPT Plus is the standard tier for individual power users. No cheaper alternative matches GPT-4o access at this price.',
    'windsurf-pro': 'Windsurf Pro is competitively priced for AI-assisted coding and is well-matched to your use case.',
  };
  const key = `${toolId}-${plan}`;
  return (
    keepMap[key] ||
    `Your ${TOOL_NAMES[toolId] || toolId} plan is appropriate for a ${seats}-seat ${useCase} team. No cheaper alternative offers equivalent capability for your stated workflow.`
  );
}
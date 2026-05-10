import { ToolEntry, ToolRecommendation, UseCase } from './types';
import { PRICING, TOOL_NAMES, getPlan } from './pricing';

// ─── Benchmarks: reasonable all-in monthly spend per seat by use case ─────────
// These are conservative upper bounds, not averages.
// A finance reviewer should read: "above X, you need a specific justification."
export const SPEND_BENCHMARKS: Record<UseCase, { low: number; high: number }> = {
  coding:   { low: 30,  high: 100 },  // Cursor Pro + Copilot Pro = $30; heavy = $60–100
  writing:  { low: 20,  high: 60  },  // Claude Pro or ChatGPT Plus = $20; heavy = $40–60
  data:     { low: 20,  high: 80  },  // Claude Pro = $20; API-heavy can reach $80
  research: { low: 20,  high: 80  },  // Claude Pro = $20; Max5x = $100 for extreme use
  mixed:    { low: 30,  high: 120 },  // Multiple tools; legitimate to stack
};

// ─── Rule 1: Seat mismatch — licensed more seats than team members ────────────
// Logic: you are paying per-seat. Seats > team size = provably wasted spend.
// Savings = (seats − teamSize) × pricePerSeat. No assumptions required.
function checkSeatMismatch(
  entry: ToolEntry,
  teamSize: number
): { savings: number; reason: string; recommendedLabel: string } | null {
  const { seats, monthlySpend, toolId } = entry;
  if (seats <= teamSize || teamSize <= 0) return null;

  const plan = getPlan(toolId, entry.plan);
  if (!plan || plan.pricePerSeat === 0 || plan.isUsageBased) return null;

  const unusedSeats  = seats - teamSize;
  const correctSpend = plan.pricePerSeat * teamSize;
  const savings      = Math.round((monthlySpend - correctSpend) * 100) / 100;
  if (savings <= 0) return null;

  return {
    savings,
    recommendedLabel: `${plan.label} (${teamSize} seat${teamSize > 1 ? 's' : ''})`,
    reason:
      `${unusedSeats} unused seat${unusedSeats > 1 ? 's' : ''} at $${plan.pricePerSeat}/seat/mo = ` +
      `$${savings}/mo wasted. You have ${seats} licensed seats for a ${teamSize}-person team. ` +
      `Reduce to ${teamSize} seat${teamSize > 1 ? 's' : ''}.`,
  };
}

// ─── Rule 2: Plan tier above what the team's usage justifies ─────────────────
// Logic is tool-specific. Every case cites the dollar difference and the
// specific feature gap between tiers. "SSO you don't need" is not a saving —
// it must be quantified.
function checkPlanOverkill(
  entry:    ToolEntry,
  useCase:  UseCase,
  teamSize: number
): { planId: string; label: string; pricePerSeat: number; reason: string } | null {
  const { toolId, plan: planId, seats } = entry;

  // ── Claude Max 20× → Max 5× ────────────────────────────────────────────────
  // Max 20× ($200/seat) is for developers running Claude Code full-day, every day.
  // Unless your audit input shows a coding team hitting Max 5× limits constantly,
  // Max 5× ($100/seat) provides 5× Pro usage — sufficient for all but extreme workloads.
  if (toolId === 'claude' && planId === 'max20x') {
    const target = getPlan('claude', 'max5x');
    if (target) {
      const saving = 200 - 100;
      return {
        planId: 'max5x', label: 'Claude Max (5×)', pricePerSeat: 100,
        reason:
          `Max 20× ($200/seat) provides 20× Pro usage — designed for developers ` +
          `running Claude Code agents full-time, all day. Max 5× ($100/seat) delivers ` +
          `5× Pro usage and the same priority access, covering nearly all power-user ` +
          `workflows. Downgrade saves $${saving}/seat/mo ($${saving * seats}/mo total) ` +
          `unless you are consistently exhausting 5× limits within a billing period.`,
      };
    }
  }

  // ── Claude Max 5× → Pro for non-coding, small teams ────────────────────────
  // Max 5× = $100/seat. Pro = $20/seat. $80/seat/mo gap.
  // Max is justified when: (a) daily heavy research/coding, or (b) Claude Code use.
  // For writing/data/research teams of 1–3 not doing agentic coding: Pro suffices.
  if (toolId === 'claude' && planId === 'max5x' && seats <= 3 && useCase !== 'coding' && useCase !== 'mixed') {
    const pro = getPlan('claude', 'pro');
    if (pro) {
      const saving = 100 - 20;
      return {
        planId: 'pro', label: 'Claude Pro', pricePerSeat: 20,
        reason:
          `Claude Max 5× ($100/seat) provides 5× Pro usage limits plus Claude Code access. ` +
          `For a ${seats}-person ${useCase} team not using Claude Code or hitting Pro limits ` +
          `regularly, Claude Pro ($20/seat) delivers the same models (Sonnet 4.6, Opus 4.6) ` +
          `and sufficient usage. Downgrade saves $${saving}/seat/mo ` +
          `($${saving * seats}/mo total). Upgrade back if you start hitting Pro limits ` +
          `more than once per week.`,
      };
    }
  }

  // ── Claude Team Premium → Team Standard for non-coding teams ───────────────
  // Team Premium ($125/seat monthly) = Team Standard + Claude Code access.
  // If your team doesn't use Claude Code (terminal coding agent), you are paying
  // $100/seat/mo extra for a feature you don't use.
  if (toolId === 'claude' && planId === 'team-premium' && useCase !== 'coding' && useCase !== 'mixed') {
    const std = getPlan('claude', 'team');
    if (std) {
      const saving = 125 - 25;
      return {
        planId: 'team', label: 'Claude Team Standard', pricePerSeat: 25,
        reason:
          `Claude Team Premium ($125/seat/mo) adds Claude Code access over Team Standard ` +
          `($25/seat/mo). Claude Code is a terminal-based agentic coding tool — it provides ` +
          `zero value for a ${useCase} team. Both plans include identical model access, ` +
          `no-training data policy, SSO, and shared projects. Downgrade saves ` +
          `$${saving}/seat/mo ($${saving * seats}/mo total).`,
      };
    }
  }

  // ── Claude Team Standard → Pro for teams under 5 ───────────────────────────
  // Team Standard requires minimum 5 seats ($25/seat monthly).
  // For 2–4 person teams, each member can hold an individual Pro ($20/seat)
  // with zero feature loss for most workflows. Team adds: shared projects,
  // centralised billing, no-training default. If those aren't needed: Pro wins.
  if (toolId === 'claude' && planId === 'team' && seats < 5) {
    const pro = getPlan('claude', 'pro');
    if (pro) {
      const saving = 25 - 20;
      return {
        planId: 'pro', label: 'Claude Pro', pricePerSeat: 20,
        reason:
          `Claude Team Standard ($25/seat/mo, min 5 seats) is designed for ` +
          `organisations needing centralised billing, shared projects, and a ` +
          `no-training data policy by default. For a ${seats}-person team, ` +
          `individual Pro subscriptions ($20/seat/mo) deliver identical model ` +
          `access at $${saving}/seat/mo less. Note: Pro conversations may be used ` +
          `for training unless you opt out — if that is a compliance concern, ` +
          `Team Standard is justified despite the cost.`,
      };
    }
  }

  // ── Cursor Teams → Pro for small teams without SSO/RBAC need ───────────────
  // Teams ($40/seat) adds: SSO, RBAC, centralised billing, shared rules,
  // usage analytics. These are procurement features, not AI features.
  // For teams ≤5 without an IT/security mandate: Pro ($20/seat) is equivalent
  // for all AI functionality. $20/seat/mo × 5 seats = $100/mo saved.
  if (toolId === 'cursor' && planId === 'business' && seats <= 5) {
    const pro = getPlan('cursor', 'pro');
    if (pro) {
      const saving = 40 - 20;
      return {
        planId: 'pro', label: 'Cursor Pro', pricePerSeat: 20,
        reason:
          `Cursor Teams ($40/seat/mo) doubles the cost of Pro ($20/seat/mo) to add ` +
          `SSO, RBAC, and centralised billing — organisational controls that require ` +
          `IT infrastructure to use. For a ${seats}-person team without SSO mandates, ` +
          `Cursor Pro provides identical AI credit pools, Auto mode, Claude/GPT model ` +
          `access, and Agent features. Savings: $${saving}/seat/mo ` +
          `($${saving * seats}/mo total).`,
      };
    }
  }

  // ── Cursor Pro+ → Pro unless overages are consistent ───────────────────────
  // Pro+ ($60) = Pro ($20) + 3× credit pool. Only justified if a user regularly
  // exhausts the Pro $20 credit pool mid-month. For most developers using Auto
  // mode (which is unlimited), Pro is sufficient.
  if (toolId === 'cursor' && planId === 'pro-plus') {
    const pro = getPlan('cursor', 'pro');
    if (pro) {
      const saving = 60 - 20;
      return {
        planId: 'pro', label: 'Cursor Pro', pricePerSeat: 20,
        reason:
          `Cursor Pro+ ($60/seat/mo) provides 3× the credit pool of Pro ($20/seat/mo). ` +
          `The extra credits only matter if you manually select frontier models ` +
          `(Claude Sonnet, GPT-4o) for every request — Auto mode is unlimited on ` +
          `both tiers. If you are using Auto mode as your default, Pro at $20/seat ` +
          `is functionally equivalent. Saves $${saving}/seat/mo ` +
          `($${saving * seats}/mo total). Upgrade back if monthly overages exceed ` +
          `$20–40/mo consistently.`,
      };
    }
  }

  // ── ChatGPT Business → Plus for solo/duo users ─────────────────────────────
  // Business ($20/seat annual, $25 monthly) requires min 2 seats.
  // Adds: training-exclusion default, SSO, SCIM, admin panel.
  // For 1 person: Plus ($20/seat) is identical in AI capability.
  // For 2 people on monthly billing ($25/seat): $10/mo total can be saved.
  if (toolId === 'chatgpt' && planId === 'business' && seats <= 2) {
    const plus = getPlan('chatgpt', 'plus');
    if (plus) {
      const monthlyBizPrice = 25; // monthly rate (not annual)
      const saving = monthlyBizPrice - 20;
      return {
        planId: 'plus', label: 'ChatGPT Plus', pricePerSeat: 20,
        reason:
          `ChatGPT Business ($25/seat/mo on monthly billing) adds training-exclusion ` +
          `by default, SAML SSO, and workspace admin controls — features designed for ` +
          `organisations with compliance requirements. For ${seats} user(s), ChatGPT ` +
          `Plus ($20/seat/mo) provides identical model access (GPT-5.5 Instant, o4, ` +
          `image gen, deep research). Saves $${saving}/seat/mo ` +
          `($${saving * seats}/mo). Note: on Plus, opt out of training data in ` +
          `Settings → Data Controls if working with sensitive material.`,
      };
    }
  }

  // ── GitHub Copilot Pro+ → Pro for standard coding teams ────────────────────
  // Pro+ ($39/mo) adds expanded premium request allowance and latest models
  // (e.g. Claude Opus 4.7). For teams using standard Chat + completions,
  // Pro ($10/mo) covers all workflows. $29/seat/mo saving.
  if (toolId === 'github-copilot' && planId === 'pro-plus') {
    const pro = getPlan('github-copilot', 'pro');
    if (pro) {
      const saving = 39 - 10;
      return {
        planId: 'pro', label: 'GitHub Copilot Pro', pricePerSeat: 10,
        reason:
          `GitHub Copilot Pro+ ($39/mo) expands premium request limits and adds ` +
          `access to the latest heavy models (Claude Opus 4.7, GPT-5.4). ` +
          `Pro ($10/mo) includes GPT-5.4 nano, GPT-4.1, unlimited completions, ` +
          `and standard chat — sufficient for the vast majority of coding workflows. ` +
          `Saves $${saving}/mo per user. Upgrade to Pro+ only if you are consistently ` +
          `hitting Pro's monthly premium request limit.`,
      };
    }
  }

  // ── GitHub Copilot Enterprise → Business for teams under 20 ────────────────
  // Enterprise ($39/seat) requires GitHub Enterprise Cloud (GHE) — a separate
  // paid platform. If you don't have GHE, you can't use Copilot Enterprise.
  // Even with GHE, Enterprise adds fine-tuned models and Jira/docs integrations
  // that typically only pay off at 20+ seats with complex monorepos.
  if (toolId === 'github-copilot' && planId === 'enterprise' && seats < 20) {
    const biz = getPlan('github-copilot', 'business');
    if (biz) {
      const saving = 39 - 19;
      return {
        planId: 'business', label: 'GitHub Copilot Business', pricePerSeat: 19,
        reason:
          `GitHub Copilot Enterprise ($39/seat/mo) requires GitHub Enterprise Cloud ` +
          `and adds: fine-tuned custom models, codebase indexing, and Jira/docs ` +
          `integrations. These features require significant setup time and only ` +
          `deliver ROI at 20+ seat organisations with large, complex monorepos. ` +
          `Copilot Business ($19/seat/mo) covers all standard coding features: ` +
          `completions, multi-model chat, policy controls. ` +
          `Saves $${saving}/seat/mo ($${saving * seats}/mo total).`,
      };
    }
  }

  // ── Windsurf Teams → Pro for very small teams ──────────────────────────────
  // Teams ($30/seat) adds pooled credits and admin controls.
  // For 1–2 person teams, admin controls are irrelevant.
  // Pro ($15/seat) gives 500 credits/mo — sufficient for focused daily use.
  if (toolId === 'windsurf' && planId === 'teams' && seats <= 2) {
    const pro = getPlan('windsurf', 'pro');
    if (pro) {
      const saving = 30 - 15;
      return {
        planId: 'pro', label: 'Windsurf Pro', pricePerSeat: 15,
        reason:
          `Windsurf Teams ($30/seat/mo) adds pooled credit management and admin ` +
          `controls — meaningful for 5+ person teams where usage varies across ` +
          `developers. For ${seats} user(s), Windsurf Pro ($15/seat/mo) provides ` +
          `500 prompt credits/mo and SOC 2 compliance. Saves $${saving}/seat/mo ` +
          `($${saving * seats}/mo total). Upgrade to Teams when you need centralised ` +
          `billing or credit pooling across 3+ developers.`,
      };
    }
  }

  // ── Windsurf Pro Ultimate → Pro unless credits run out monthly ──────────────
  // Pro Ultimate ($60/mo) = unlimited credits. Pro ($15/mo) = 500 credits.
  // At Windsurf's default 1 credit/prompt, 500 credits ≈ 500 agent turns/mo.
  // Most developers don't exhaust 500 credits. Only upgrade if you do.
  if (toolId === 'windsurf' && planId === 'pro-ultimate') {
    const pro = getPlan('windsurf', 'pro');
    if (pro) {
      const saving = 60 - 15;
      return {
        planId: 'pro', label: 'Windsurf Pro', pricePerSeat: 15,
        reason:
          `Windsurf Pro Ultimate ($60/mo) removes the 500 credit/mo cap of Pro ` +
          `($15/mo). 500 credits covers approximately 500 standard Cascade ` +
          `interactions per month — more than enough for focused daily use. ` +
          `Pro Ultimate is only justified if you regularly exhaust 500 credits ` +
          `before month end. Saves $${saving}/seat/mo per user. Top-up credits ` +
          `are available at $10/250 credits if you occasionally overshoot.`,
      };
    }
  }

  // ── Gemini AI Pro → Free/Workspace for teams already on Google Workspace ────
  // All Google Workspace plans have had Gemini bundled since Jan 2025 at no extra charge.
  // Paying for Google AI Pro ($19.99/mo) on top of an active Workspace licence
  // is redundant for Workspace-integrated features (Docs, Gmail, Sheets).
  if (toolId === 'gemini' && planId === 'ai-pro') {
    return {
      planId: 'workspace', label: 'Workspace (bundled)', pricePerSeat: 0,
      reason:
        `Google Gemini AI is bundled into all Google Workspace plans (Business Starter ` +
        `and above) at no extra charge since January 2025. If your team already pays ` +
        `for Google Workspace, the Google AI Pro subscription ($19.99/seat/mo) is ` +
        `redundant for Workspace-integrated features (Gemini in Docs, Gmail, Sheets, ` +
        `Meet). Cancel Google AI Pro and use the Workspace-bundled Gemini instead. ` +
        `Saves $19.99/seat/mo. Only keep AI Pro if you need: Deep Research beyond ` +
        `Workspace limits, the 2TB personal storage, or YouTube Premium.`,
    };
  }

  return null;
}

// ─── Rule 3: Alternative tool better suited to use case ──────────────────────
// Only fire when: (1) savings are real (competitor is cheaper), AND
// (2) the capability difference is defensible by use case.
// Never recommend a switch purely on price — the reason must name
// the specific capability gap.
function checkAlternative(
  entry:      ToolEntry,
  useCase:    UseCase,
  allToolIds: string[]
): { toolId: string; label: string; pricePerSeat: number; reason: string } | null {
  const { toolId, plan: planId, seats } = entry;
  const has = (id: string) => allToolIds.includes(id);

  // ── GitHub Copilot Pro → Cursor Pro for dedicated coding (solo) ─────────────
  // Copilot Pro ($10): IDE plugin, completions + chat in VS Code / JetBrains.
  // Cursor Pro ($20): Full agentic IDE, multi-file edits, Agent mode, codebase indexing.
  // For solo developers doing daily AI-assisted coding: Cursor's agentic features
  // often justify the $10/mo premium — but we flag it as a switch, not a downgrade.
  // We only suggest this if they don't already have Cursor.
  if (
    toolId === 'github-copilot' && planId === 'pro' &&
    seats === 1 && useCase === 'coding' && !has('cursor')
  ) {
    return {
      toolId: 'cursor', label: 'Cursor Pro', pricePerSeat: 20,
      reason:
        `GitHub Copilot Pro ($10/mo) works as a VS Code plugin with standard ` +
        `completions and chat. Cursor Pro ($20/mo) is an agentic IDE: it can ` +
        `autonomously edit multiple files, run terminal commands, and understand ` +
        `your entire codebase in context — features that translate to faster ` +
        `refactoring and debugging for full-time coders. The $10/mo premium ` +
        `is justified if you spend 2+ hours/day in an AI coding workflow. ` +
        `If you prefer staying in VS Code, keep Copilot Pro.`,
    };
  }

  // ── ChatGPT Plus → Claude Pro for writing/research workflows ────────────────
  // Both cost $20/seat. Not a cost saving — a fit recommendation.
  // Only flag this if the use case is writing or research AND they don't
  // already have Claude. We show it as 'switch', same price, different capability.
  if (
    toolId === 'chatgpt' && planId === 'plus' &&
    (useCase === 'writing' || useCase === 'research') && !has('claude')
  ) {
    return {
      toolId: 'claude', label: 'Claude Pro', pricePerSeat: 20,
      reason:
        `Both cost $20/seat/mo. Claude Pro is consistently preferred for long-form ` +
        `writing, document analysis, and extended research — tasks that benefit from ` +
        `Claude's 200K context window and instruction-following precision. ` +
        `ChatGPT Plus excels at web search, image generation, and plugin integrations. ` +
        `If your primary use is ${useCase} without heavy tool integrations, ` +
        `Claude Pro is a better fit at the same price.`,
    };
  }

  // ── Cursor (non-hobby) for non-coders → Claude Pro ─────────────────────────
  // Cursor is a code editor. It is purpose-built for writing, running, and
  // editing code. A writing or research team paying $20–$60/seat for Cursor
  // is paying for an IDE they can't productively use. Claude Pro ($20/seat)
  // is built exactly for their workflow.
  if (
    toolId === 'cursor' && planId !== 'hobby' &&
    (useCase === 'writing' || useCase === 'research') && !has('claude')
  ) {
    return {
      toolId: 'claude', label: 'Claude Pro', pricePerSeat: 20,
      reason:
        `Cursor is a code editor — its AI features (Agent mode, multi-file edits, ` +
        `completions) are all designed for writing and running code. For a ${useCase} ` +
        `workflow, Cursor provides no meaningful advantage over a general LLM and ` +
        `requires technical setup to use at all. Claude Pro ($20/seat/mo) is purpose-built ` +
        `for ${useCase}: 200K context, document analysis, deep research, and structured ` +
        `writing assistance. Switch and save the difference between your current ` +
        `Cursor plan and $20/seat.`,
    };
  }

  return null;
}

// ─── Rule 4: Redundancy — two tools with >80% capability overlap ───────────────
// Only fire for non-mixed use cases. Mixed teams legitimately use multiple models.
export function detectRedundancy(tools: ToolEntry[], useCase: UseCase): string | null {
  const ids      = tools.map((t) => t.toolId);
  const findPlan = (id: string) => tools.find((t) => t.toolId === id)?.plan;

  const paidClaudePlans  = ['pro', 'max5x', 'max20x', 'team', 'team-premium'];
  const paidChatGPTPlans = ['plus', 'pro', 'business', 'enterprise'];

  const hasPaidClaude  = ids.includes('claude')  && paidClaudePlans.includes(findPlan('claude')  || '');
  const hasPaidChatGPT = ids.includes('chatgpt') && paidChatGPTPlans.includes(findPlan('chatgpt') || '');
  const hasAnthropicAPI = ids.includes('anthropic-api');
  const hasOpenAIAPI    = ids.includes('openai-api');

  // Dual paid chat subscriptions for a single-purpose team
  if (hasPaidClaude && hasPaidChatGPT && useCase !== 'mixed') {
    return (
      `Your team holds paid subscriptions to both Claude and ChatGPT for a ` +
      `${useCase} workflow. These products have >80% capability overlap for ` +
      `text-based tasks. Pick the one that better fits your workflow and cancel ` +
      `the other. Claude Pro and ChatGPT Plus both cost $20/seat/mo — cancelling ` +
      `one saves $20/seat/mo immediately with no capability gap for ${useCase} tasks.`
    );
  }

  // Claude subscription + Anthropic API: paying twice for the same models
  if (hasAnthropicAPI && hasPaidClaude) {
    return (
      `You are paying for both a Claude subscription (flat monthly fee) and ` +
      `Anthropic API access (usage-based). These access the same underlying models. ` +
      `If your use is primarily the claude.ai chat UI: cancel the API credits and ` +
      `keep the subscription. If you are building or automating: cancel the ` +
      `subscription and use the API alone. Running both simultaneously is redundant ` +
      `and doubles your Anthropic spend.`
    );
  }

  // ChatGPT subscription + OpenAI API: same overlap as above
  if (hasOpenAIAPI && hasPaidChatGPT) {
    return (
      `You have both a ChatGPT subscription and OpenAI API access — both charge you ` +
      `for access to GPT-5.5. Consolidate: use the subscription for conversational ` +
      `tasks, or the API for programmatic/automation workflows. Maintaining both ` +
      `typically means you are paying for 50–100% more capacity than you consume ` +
      `on either channel alone.`
    );
  }

  return null;
}

// ─── Rule 5: Spend-per-user benchmark check ────────────────────────────────────
// Flags statistically extreme spend. Does not produce a specific recommendation —
// appended to the "keep" reason as a warning signal for manual review.
function checkSpendBenchmark(
  entry:    ToolEntry,
  useCase:  UseCase,
): string | null {
  if (entry.seats === 0) return null;
  const spendPerUser = entry.monthlySpend / entry.seats;
  const benchmark    = SPEND_BENCHMARKS[useCase];

  if (spendPerUser > benchmark.high * 2.5) {
    return (
      `⚠️ Spend flag: $${Math.round(spendPerUser)}/seat/mo is ` +
      `${Math.round(spendPerUser / benchmark.high)}× the typical upper bound ` +
      `($${benchmark.high}/seat/mo) for ${useCase} workflows. ` +
      `This may reflect usage-based API overages or an input error — ` +
      `verify against your actual billing dashboard.`
    );
  }
  return null;
}

// ─── Main evaluator ────────────────────────────────────────────────────────────
export function evaluateTool(
  entry:      ToolEntry,
  useCase:    UseCase,
  teamSize:   number,
  allToolIds: string[]
): ToolRecommendation {
  const { toolId, plan, monthlySpend, seats } = entry;
  const toolName   = TOOL_NAMES[toolId] || toolId;
  const currentPlan = getPlan(toolId, plan);

  // Priority 1: Seat mismatch (most provable, highest savings)
  const seatMismatch = checkSeatMismatch(entry, teamSize);
  if (seatMismatch) {
    const planData   = getPlan(toolId, plan);
    const newSpend   = planData ? planData.pricePerSeat * teamSize : monthlySpend - seatMismatch.savings;
    return {
      toolId, toolName,
      currentPlan:     currentPlan?.label || plan,
      currentSpend:    monthlySpend,
      action:          'downgrade',
      recommendedPlan: seatMismatch.recommendedLabel,
      recommendedSpend: Math.round(newSpend * 100) / 100,
      savings:         Math.round(seatMismatch.savings * 100) / 100,
      reason:          seatMismatch.reason,
    };
  }

  // Priority 2: Plan tier overkill
  const planOverkill = checkPlanOverkill(entry, useCase, teamSize);
  if (planOverkill) {
    const newSpend = planOverkill.pricePerSeat * seats;
    const savings  = Math.round((monthlySpend - newSpend) * 100) / 100;
    if (savings > 0) {
      return {
        toolId, toolName,
        currentPlan:      currentPlan?.label || plan,
        currentSpend:     monthlySpend,
        action:           'downgrade',
        recommendedPlan:  planOverkill.label,
        recommendedSpend: Math.round(newSpend * 100) / 100,
        savings,
        reason:           planOverkill.reason,
      };
    }
  }

  // Priority 3: Better-fit alternative tool
  const alt = checkAlternative(entry, useCase, allToolIds);
  if (alt) {
    const newSpend = alt.pricePerSeat * seats;
    const savings  = Math.round((monthlySpend - newSpend) * 100) / 100;
    if (savings >= 0) {   // allow $0 savings for same-price better-fit switches
      return {
        toolId, toolName,
        currentPlan:      currentPlan?.label || plan,
        currentSpend:     monthlySpend,
        action:           savings > 0 ? 'switch' : 'keep',
        recommendedTool:  alt.label,
        recommendedSpend: Math.round(newSpend * 100) / 100,
        savings:          Math.max(0, savings),
        reason:           alt.reason,
      };
    }
  }

  // Priority 4: Keep — but add benchmark warning if spend is extreme
  const benchmarkWarning = checkSpendBenchmark(entry, useCase);
  return {
    toolId, toolName,
    currentPlan:      currentPlan?.label || plan,
    currentSpend:     monthlySpend,
    action:           'keep',
    recommendedSpend: monthlySpend,
    savings:          0,
    reason:
      benchmarkWarning ??
      `${toolName} (${currentPlan?.label || plan}) is appropriately sized for your ` +
      `${seats}-seat ${useCase} workflow. No cheaper plan from the same vendor ` +
      `or substantially cheaper alternative offers equivalent capability for your ` +
      `stated use case.`,
  };
}
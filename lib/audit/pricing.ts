export interface PlanPrice {
  planId: string;
  label: string;
  pricePerSeat: number;
  minSeats?: number;
  notes?: string;
  isUsageBased?: boolean;
}

export const PRICING: Record<string, PlanPrice[]> = {
  cursor: [
    { planId: 'hobby', label: 'Hobby (Free)', pricePerSeat: 0 },
    { planId: 'pro', label: 'Pro', pricePerSeat: 20 },
    { planId: 'business', label: 'Business', pricePerSeat: 40 },
    { planId: 'enterprise', label: 'Enterprise', pricePerSeat: 60, notes: 'Contact sales' },
  ],
  'github-copilot': [
    { planId: 'individual', label: 'Individual', pricePerSeat: 10 },
    { planId: 'business', label: 'Business', pricePerSeat: 19 },
    { planId: 'enterprise', label: 'Enterprise', pricePerSeat: 39 },
  ],
  claude: [
    { planId: 'free', label: 'Free', pricePerSeat: 0 },
    { planId: 'pro', label: 'Pro', pricePerSeat: 20 },
    { planId: 'max', label: 'Max', pricePerSeat: 100 },
    { planId: 'team', label: 'Team', pricePerSeat: 30, minSeats: 5 },
    { planId: 'enterprise', label: 'Enterprise', pricePerSeat: 60, notes: 'Contact sales' },
    { planId: 'api', label: 'API (Usage-based)', pricePerSeat: 0, isUsageBased: true, notes: 'Billed per token' },
  ],
  chatgpt: [
    { planId: 'free', label: 'Free', pricePerSeat: 0 },
    { planId: 'plus', label: 'Plus', pricePerSeat: 20 },
    { planId: 'team', label: 'Team', pricePerSeat: 30, minSeats: 2 },
    { planId: 'enterprise', label: 'Enterprise', pricePerSeat: 60, notes: 'Contact sales' },
    { planId: 'api', label: 'API (Usage-based)', pricePerSeat: 0, isUsageBased: true, notes: 'Billed per token' },
  ],
  'anthropic-api': [
    { planId: 'api', label: 'API (Usage-based)', pricePerSeat: 0, isUsageBased: true, notes: 'Claude Haiku ~$0.80/MTok · Sonnet ~$3/MTok · Opus ~$15/MTok' },
  ],
  'openai-api': [
    { planId: 'api', label: 'API (Usage-based)', pricePerSeat: 0, isUsageBased: true, notes: 'GPT-4o ~$2.50/MTok · GPT-4o-mini ~$0.15/MTok' },
  ],
  gemini: [
    { planId: 'free', label: 'Free', pricePerSeat: 0 },
    { planId: 'pro', label: 'Gemini Advanced', pricePerSeat: 19.99 },
    { planId: 'business', label: 'Gemini for Workspace', pricePerSeat: 24 },
    { planId: 'api', label: 'API (Usage-based)', pricePerSeat: 0, isUsageBased: true, notes: 'Gemini 1.5 Flash free tier · Pro billed per token' },
  ],
  windsurf: [
    { planId: 'free', label: 'Free', pricePerSeat: 0 },
    { planId: 'pro', label: 'Pro', pricePerSeat: 15 },
    { planId: 'teams', label: 'Teams', pricePerSeat: 35 },
    { planId: 'enterprise', label: 'Enterprise', pricePerSeat: 60, notes: 'Contact sales' },
  ],
};

export const TOOL_NAMES: Record<string, string> = {
  cursor: 'Cursor',
  'github-copilot': 'GitHub Copilot',
  claude: 'Claude',
  chatgpt: 'ChatGPT',
  'anthropic-api': 'Anthropic API',
  'openai-api': 'OpenAI API',
  gemini: 'Gemini',
  windsurf: 'Windsurf',
};

export function getPlanPrice(toolId: string, planId: string, seats: number): number {
  const plan = PRICING[toolId]?.find((p) => p.planId === planId);
  if (!plan || plan.isUsageBased) return 0;
  return plan.pricePerSeat * seats;
}

export function getPlan(toolId: string, planId: string): PlanPrice | undefined {
  return PRICING[toolId]?.find((p) => p.planId === planId);
}

export function formatPlanPrice(plan: PlanPrice, seats: number): string {
  if (plan.isUsageBased) return 'Usage-based';
  if (plan.pricePerSeat === 0) return 'Free';
  return `$${(plan.pricePerSeat * seats).toFixed(0)}/mo`;
}
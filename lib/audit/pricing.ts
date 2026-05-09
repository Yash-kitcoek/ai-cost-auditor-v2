export interface PlanPrice {
  planId: string;
  label: string;
  pricePerSeat: number;
  minSeats?: number;
  notes?: string;
}

export const PRICING: Record<string, PlanPrice[]> = {
  cursor: [
    { planId: 'hobby', label: 'Hobby (Free)', pricePerSeat: 0 },
    { planId: 'pro', label: 'Pro', pricePerSeat: 20 },
    { planId: 'business', label: 'Business', pricePerSeat: 40 },
    { planId: 'enterprise', label: 'Enterprise', pricePerSeat: 60 },
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
    { planId: 'enterprise', label: 'Enterprise', pricePerSeat: 60 },
    { planId: 'api', label: 'API Direct', pricePerSeat: 0 },
  ],
  chatgpt: [
    { planId: 'free', label: 'Free', pricePerSeat: 0 },
    { planId: 'plus', label: 'Plus', pricePerSeat: 20 },
    { planId: 'team', label: 'Team', pricePerSeat: 30, minSeats: 2 },
    { planId: 'enterprise', label: 'Enterprise', pricePerSeat: 60 },
    { planId: 'api', label: 'API Direct', pricePerSeat: 0 },
  ],
  'anthropic-api': [
    { planId: 'api', label: 'API (Pay-as-you-go)', pricePerSeat: 0 },
  ],
  'openai-api': [
    { planId: 'api', label: 'API (Pay-as-you-go)', pricePerSeat: 0 },
  ],
  gemini: [
    { planId: 'free', label: 'Free', pricePerSeat: 0 },
    { planId: 'pro', label: 'Gemini Advanced', pricePerSeat: 19.99 },
    { planId: 'business', label: 'Workspace Business', pricePerSeat: 24 },
    { planId: 'api', label: 'API Direct', pricePerSeat: 0 },
  ],
  windsurf: [
    { planId: 'free', label: 'Free', pricePerSeat: 0 },
    { planId: 'pro', label: 'Pro', pricePerSeat: 15 },
    { planId: 'teams', label: 'Teams', pricePerSeat: 35 },
    { planId: 'enterprise', label: 'Enterprise', pricePerSeat: 60 },
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
  if (!plan) return 0;
  return plan.pricePerSeat * seats;
}

export function getPlan(toolId: string, planId: string): PlanPrice | undefined {
  return PRICING[toolId]?.find((p) => p.planId === planId);
}
// PRICING DATA — verified May 2026
// All prices are per user per month unless noted
// Sources in PRICING_DATA.md

export interface PlanPrice {
  planId: string;
  label: string;
  pricePerSeat: number; // monthly per seat
  minSeats?: number;
  maxSeats?: number;
  annualOnly?: boolean;
  notes?: string;
}

export const PRICING: Record<string, PlanPrice[]> = {
  cursor: [
    { planId: 'hobby', label: 'Hobby (Free)', pricePerSeat: 0 },
    { planId: 'pro', label: 'Pro', pricePerSeat: 20 },
    { planId: 'business', label: 'Business', pricePerSeat: 40 },
    { planId: 'enterprise', label: 'Enterprise', pricePerSeat: 60, notes: 'Estimated; contact sales' },
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
    { planId: 'enterprise', label: 'Enterprise', pricePerSeat: 60, notes: 'Estimated; contact sales' },
    { planId: 'api', label: 'API Direct', pricePerSeat: 0, notes: 'Usage-based; user enters spend' },
  ],
  chatgpt: [
    { planId: 'free', label: 'Free', pricePerSeat: 0 },
    { planId: 'plus', label: 'Plus', pricePerSeat: 20 },
    { planId: 'team', label: 'Team', pricePerSeat: 30, minSeats: 2 },
    { planId: 'enterprise', label: 'Enterprise', pricePerSeat: 60, notes: 'Estimated; contact sales' },
    { planId: 'api', label: 'API Direct', pricePerSeat: 0, notes: 'Usage-based; user enters spend' },
  ],
  'anthropic-api': [
    { planId: 'api', label: 'API (Pay-as-you-go)', pricePerSeat: 0, notes: 'Usage-based; user enters spend' },
  ],
  'openai-api': [
    { planId: 'api', label: 'API (Pay-as-you-go)', pricePerSeat: 0, notes: 'Usage-based; user enters spend' },
  ],
  gemini: [
    { planId: 'free', label: 'Free', pricePerSeat: 0 },
    { planId: 'pro', label: 'Gemini Advanced (One AI Premium)', pricePerSeat: 19.99 },
    { planId: 'business', label: 'Gemini for Google Workspace Business', pricePerSeat: 24 },
    { planId: 'api', label: 'API Direct', pricePerSeat: 0, notes: 'Usage-based; user enters spend' },
  ],
  windsurf: [
    { planId: 'free', label: 'Free', pricePerSeat: 0 },
    { planId: 'pro', label: 'Pro', pricePerSeat: 15 },
    { planId: 'teams', label: 'Teams', pricePerSeat: 35 },
    { planId: 'enterprise', label: 'Enterprise', pricePerSeat: 60, notes: 'Estimated; contact sales' },
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
  const plans = PRICING[toolId];
  if (!plans) return 0;
  const plan = plans.find((p) => p.planId === planId);
  if (!plan) return 0;
  return plan.pricePerSeat * seats;
}

export function getPlan(toolId: string, planId: string): PlanPrice | undefined {
  return PRICING[toolId]?.find((p) => p.planId === planId);
}
export interface PricingTier {
  name: string;
  price: number;
  period: 'month' | 'year';
  features: string[];
}

export interface Tool {
  name: string;
  category: 'ide' | 'api' | 'search' | 'other';
  tiers: PricingTier[];
  lastUpdated: string;
}

export const PRICING_DATA: Record<string, Tool> = {
  cursor: {
    name: 'Cursor',
    category: 'ide',
    lastUpdated: '2026-05-20',
    tiers: [
      { name: 'Free',     price: 0,  period: 'month', features: ['2000 completions/month'] },
      { name: 'Pro', price: 20, period: 'month', features: ['Unlimited completions'] },
      { name: 'Business', price: 40, period: 'month', features: ['All Pro features', 'Team management'] },
    ],
  },

  'github-copilot': {
    name: 'GitHub Copilot',
    category: 'ide',
    lastUpdated: '2026-05-20',
    tiers: [
      { name: 'Free',       price: 0,  period: 'month', features: ['Limited completions'] },
      { name: 'Individual', price: 10, period: 'month', features: ['Unlimited completions'] },
      { name: 'Business',   price: 19, period: 'month', features: ['All Individual features', 'Org management'] },
      { name: 'Enterprise', price: 39, period: 'month', features: ['All Business features', 'Enterprise SSO'] },
    ],
  },

  claude: {
    name: 'Claude',
    category: 'api',
    lastUpdated: '2026-05-20',
    tiers: [
      { name: 'Free',       price: 0,  period: 'month', features: ['Limited messages'] },
      { name: 'Pro',        price: 20, period: 'month', features: ['5x usage', 'Priority access'] },
      { name: 'Team',       price: 30, period: 'month', features: ['All Pro features', 'Team workspace'] },
      { name: 'Enterprise', price: 60, period: 'month', features: ['All Team features', 'SSO', 'Admin controls'] },
    ],
  },

  chatgpt: {
    name: 'ChatGPT',
    category: 'api',
    lastUpdated: '2026-05-20',
    tiers: [
      { name: 'Free',       price: 0,  period: 'month', features: ['GPT-3.5'] },
      { name: 'Plus',       price: 20, period: 'month', features: ['GPT-4', 'DALL-E'] },
      { name: 'Team',       price: 30, period: 'month', features: ['All Plus features', 'Team workspace'] },
      { name: 'Enterprise', price: 60, period: 'month', features: ['All Team features', 'SSO', 'Admin controls'] },
    ],
  },

  'anthropic-api': {
    name: 'Anthropic API',
    category: 'api',
    lastUpdated: '2026-05-20',
    tiers: [
      { name: 'Free',       price: 0,   period: 'month', features: ['Limited credits'] },
      { name: 'Pay-as-you-go', price: 0, period: 'month', features: ['Usage-based pricing'] },
    ],
  },

  'openai-api': {
    name: 'OpenAI API',
    category: 'api',
    lastUpdated: '2026-05-20',
    tiers: [
      { name: 'Free',          price: 0, period: 'month', features: ['Limited credits'] },
      { name: 'Pay-as-you-go', price: 0, period: 'month', features: ['Usage-based pricing'] },
    ],
  },

  gemini: {
    name: 'Gemini',
    category: 'api',
    lastUpdated: '2026-05-20',
    tiers: [
      { name: 'Free',                  price: 0,  period: 'month', features: ['Limited usage'] },
      { name: 'Gemini for Workspace',  price: 24, period: 'month', features: ['Workspace integration'] },
      { name: 'Enterprise',            price: 36, period: 'month', features: ['Advanced features', 'SSO'] },
    ],
  },

  windsurf: {
    name: 'Windsurf',
    category: 'ide',
    lastUpdated: '2026-05-20',
    tiers: [
      { name: 'Free', price: 0,  period: 'month', features: ['Limited usage'] },
      { name: 'Pro',  price: 15, period: 'month', features: ['Unlimited usage'] },
      { name: 'Team', price: 30, period: 'month', features: ['All Pro features', 'Team management'] },
    ],
  },
};

export function getPricingSnapshot() {
  return {
    timestamp: new Date().toISOString(),
    data: PRICING_DATA,
    version: calculateVersion(PRICING_DATA),
  };
}

function calculateVersion(data: typeof PRICING_DATA): string {
  const str = JSON.stringify(data);
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16);
}

export function comparePricingSnapshots(oldSnapshot: any, newSnapshot: any) {
  const changes: Array<{
    tool: string;
    changeType: 'price_change' | 'tier_added' | 'tier_removed';
    oldValue?: any;
    newValue?: any;
    details: string;
  }> = [];

  const oldTools = oldSnapshot?.data || {};
  const newTools = newSnapshot?.data || {};

  for (const toolKey in newTools) {
    if (!oldTools[toolKey]) continue;

    const oldTool = oldTools[toolKey];
    const newTool = newTools[toolKey];

    for (let i = 0; i < Math.max(oldTool.tiers.length, newTool.tiers.length); i++) {
      const oldTier = oldTool.tiers[i];
      const newTier = newTool.tiers[i];

      if (oldTier && newTier) {
        if (oldTier.price !== newTier.price) {
          changes.push({
            tool: newTool.name,
            changeType: 'price_change',
            oldValue: oldTier.price,
            newValue: newTier.price,
            details: `${oldTier.name} tier: $${oldTier.price} → $${newTier.price}`,
          });
        }
      } else if (!oldTier && newTier) {
        changes.push({
          tool: newTool.name,
          changeType: 'tier_added',
          newValue: newTier,
          details: `New "${newTier.name}" tier added at $${newTier.price}/month`,
        });
      } else if (oldTier && !newTier) {
        changes.push({
          tool: newTool.name,
          changeType: 'tier_removed',
          oldValue: oldTier,
          details: `"${oldTier.name}" tier removed`,
        });
      }
    }
  }

  return changes;
}

export function hasSignificantChange(changes: any[]): boolean {
  return changes.length > 0;
}
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
      {
        name: 'Free',
        price: 0,
        period: 'month',
        features: ['2000 completions/month', 'Basic AI assistance'],
      },
      {
        name: 'Pro',
        price: 20,
        period: 'month',
        features: ['Unlimited completions', 'GPT-4', 'Priority support'],
      },
    ],
  },
  github_copilot: {
    name: 'GitHub Copilot',
    category: 'ide',
    lastUpdated: '2026-05-20',
    tiers: [
      {
        name: 'Individual',
        price: 10,
        period: 'month',
        features: ['Code completions', 'Chat', 'CLI'],
      },
      {
        name: 'Business',
        price: 19,
        period: 'month',
        features: ['All Individual features', 'Organization license', 'Policy management'],
      },
    ],
  },
  claude: {
    name: 'Claude (Anthropic)',
    category: 'api',
    lastUpdated: '2026-05-20',
    tiers: [
      {
        name: 'Free',
        price: 0,
        period: 'month',
        features: ['Limited messages'],
      },
      {
        name: 'Pro',
        price: 20,
        period: 'month',
        features: ['5x usage', 'Priority access', 'Early features'],
      },
    ],
  },
  chatgpt: {
    name: 'ChatGPT',
    category: 'api',
    lastUpdated: '2026-05-20',
    tiers: [
      {
        name: 'Free',
        price: 0,
        period: 'month',
        features: ['GPT-3.5', 'Limited GPT-4'],
      },
      {
        name: 'Plus',
        price: 20,
        period: 'month',
        features: ['GPT-4', 'DALL-E', 'Priority access'],
      },
    ],
  },
  perplexity: {
    name: 'Perplexity',
    category: 'search',
    lastUpdated: '2026-05-20',
    tiers: [
      {
        name: 'Free',
        price: 0,
        period: 'month',
        features: ['5 Pro searches/day'],
      },
      {
        name: 'Pro',
        price: 20,
        period: 'month',
        features: ['Unlimited Pro searches', 'File upload', 'API access'],
      },
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
    changeType: 'price_change' | 'tier_added' | 'tier_removed' | 'feature_change';
    oldValue?: any;
    newValue?: any;
    details: string;
  }> = [];

  const oldTools = oldSnapshot.data || {};
  const newTools = newSnapshot.data || {};

  for (const toolKey in newTools) {
    if (!oldTools[toolKey]) continue;

    const oldTool = oldTools[toolKey];
    const newTool = newTools[toolKey];

    // Check price changes
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
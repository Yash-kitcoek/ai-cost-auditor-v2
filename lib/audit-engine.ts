import { PRICING_DATA, getPricingSnapshot } from './pricing';

export interface AuditInput {
  email: string;
  tools: {
    [key: string]: string;
  };
  usage?: {
    [key: string]: number;
  };
}

export interface AuditRecommendation {
  tool: string;
  currentTier: string;
  currentCost: number;
  recommendedTier: string;
  recommendedCost: number;
  savings: number;
  reason: string;
}

export interface AuditOutput {
  totalMonthlyCost: number;
  recommendations: AuditRecommendation[];
  totalPotentialSavings: number;
}

export function runAudit(input: AuditInput): AuditOutput {
  const recommendations: AuditRecommendation[] = [];
  let totalMonthlyCost = 0;
  let totalPotentialSavings = 0;

  for (const [toolKey, tierName] of Object.entries(input.tools)) {
    const tool = PRICING_DATA[toolKey];
    if (!tool) continue;

    // Fuzzy match — handles "Enterprise — $60/seat" matching "Enterprise"
    const currentTier = tool.tiers.find(
      (t) =>
        t.name === tierName ||
        tierName.toLowerCase().startsWith(t.name.toLowerCase()) ||
        t.name.toLowerCase().startsWith(tierName.toLowerCase())
    );

    if (!currentTier) continue;

    // Use actual monthly spend from usage map if provided
    const actualCost = input.usage?.[toolKey] || currentTier.price;
    totalMonthlyCost += actualCost;

    // Find cheapest tier below current
    const cheaperTiers = tool.tiers.filter((t) => t.price < currentTier.price);
    if (cheaperTiers.length === 0) continue;

    const cheapest = cheaperTiers.reduce((a, b) => (a.price < b.price ? a : b));
    const savings = actualCost - cheapest.price;

    if (savings <= 0) continue;

    recommendations.push({
      tool: tool.name,
      currentTier: currentTier.name,
      currentCost: actualCost,
      recommendedTier: cheapest.name,
      recommendedCost: cheapest.price,
      savings,
      reason: `Downgrade from ${currentTier.name} to ${cheapest.name} — save $${savings}/mo`,
    });

    totalPotentialSavings += savings;
  }

  return {
    totalMonthlyCost,
    recommendations,
    totalPotentialSavings,
  };
}

export function generateAuditWithSnapshot(input: AuditInput) {
  const pricingSnapshot = getPricingSnapshot();
  const output = runAudit(input);

  return {
    input,
    output,
    pricingSnapshot,
  };
}
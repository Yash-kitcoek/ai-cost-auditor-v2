import { PRICING_DATA, getPricingSnapshot } from './pricing';

export interface AuditInput {
  email: string;
  tools: {
    [key: string]: string; // tool key -> tier name
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

    const currentTier = tool.tiers.find((t) => t.name === tierName);
    if (!currentTier) continue;

    totalMonthlyCost += currentTier.price;

    // Check for free tier
    const freeTier = tool.tiers.find((t) => t.price === 0);
    if (freeTier && currentTier.price > 0) {
      const savings = currentTier.price;
      recommendations.push({
        tool: tool.name,
        currentTier: currentTier.name,
        currentCost: currentTier.price,
        recommendedTier: freeTier.name,
        recommendedCost: freeTier.price,
        savings,
        reason: `Consider if ${tool.name} free tier meets your needs - save $${savings}/mo`,
      });
      totalPotentialSavings += savings;
    }

    // Check for cheaper paid tiers
    const cheaperTiers = tool.tiers.filter(
      (t) => t.price < currentTier.price && t.price > 0
    );
    if (cheaperTiers.length > 0 && !freeTier) {
      const cheapest = cheaperTiers[cheaperTiers.length - 1];
      const savings = currentTier.price - cheapest.price;
      recommendations.push({
        tool: tool.name,
        currentTier: currentTier.name,
        currentCost: currentTier.price,
        recommendedTier: cheapest.name,
        recommendedCost: cheapest.price,
        savings,
        reason: `Downgrade to ${cheapest.name} tier - save $${savings}/mo`,
      });
      totalPotentialSavings += savings;
    }
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
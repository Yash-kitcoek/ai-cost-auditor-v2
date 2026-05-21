import { AuditOutput } from './audit-engine';
import { AuditResult, UseCase } from './audit/types';

export function adaptAuditOutputForResultPage(
  output: AuditOutput,
  opts: { teamSize?: number; useCase?: UseCase } = {}
): AuditResult {
  const totalCurrentSpend = output.totalMonthlyCost;
  const totalOptimizedSpend = Math.max(
    0,
    totalCurrentSpend - output.totalPotentialSavings
  );
  const score =
    totalCurrentSpend === 0
      ? 100
      : Math.max(
          0,
          Math.round(
            100 - (output.totalPotentialSavings / totalCurrentSpend) * 100
          )
        );

  return {
    totalMonthlySavings: output.totalPotentialSavings,
    totalAnnualSavings: output.totalPotentialSavings * 12,
    totalCurrentSpend,
    totalOptimizedSpend,
    score,
    isAlreadyOptimal: output.totalPotentialSavings === 0,
    highSavings: output.totalPotentialSavings > 500,
    teamSize: opts.teamSize || 1,
    useCase: opts.useCase || 'mixed',
    recommendations: output.recommendations.map((rec) => ({
      toolId: rec.tool.toLowerCase().replace(/\s+/g, '-') as any,
      toolName: rec.tool,
      action: rec.savings > 0 ? 'downgrade' : 'keep',
      currentPlan: rec.currentTier,
      currentSpend: rec.currentCost,
      recommendedPlan: rec.recommendedTier,
      recommendedSpend: rec.recommendedCost,
      savings: rec.savings,
      reason: rec.reason,
    })),
  };
}

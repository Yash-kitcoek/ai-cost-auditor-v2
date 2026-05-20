import { AuditOutput, AuditRecommendation } from './audit-engine';

export interface AuditDiff {
  costChange: number;
  savingsChange: number;
  changedRecommendations: Array<{
    tool: string;
    oldRecommendation: AuditRecommendation;
    newRecommendation: AuditRecommendation;
    impact: 'better' | 'worse' | 'neutral';
  }>;
  newRecommendations: AuditRecommendation[];
  removedRecommendations: AuditRecommendation[];
}

export function calculateAuditDiff(
  oldAudit: AuditOutput,
  newAudit: AuditOutput
): AuditDiff {
  const costChange = newAudit.totalMonthlyCost - oldAudit.totalMonthlyCost;
  const savingsChange =
    newAudit.totalPotentialSavings - oldAudit.totalPotentialSavings;

  const changedRecommendations: AuditDiff['changedRecommendations'] = [];
  const newRecommendations: AuditRecommendation[] = [];
  const removedRecommendations: AuditRecommendation[] = [];

  // Find changed recommendations
  oldAudit.recommendations.forEach((oldRec) => {
    const newRec = newAudit.recommendations.find((r) => r.tool === oldRec.tool);

    if (!newRec) {
      removedRecommendations.push(oldRec);
    } else if (
      oldRec.recommendedTier !== newRec.recommendedTier ||
      oldRec.savings !== newRec.savings
    ) {
      const impact =
        newRec.savings > oldRec.savings
          ? 'better'
          : newRec.savings < oldRec.savings
          ? 'worse'
          : 'neutral';

      changedRecommendations.push({
        tool: oldRec.tool,
        oldRecommendation: oldRec,
        newRecommendation: newRec,
        impact,
      });
    }
  });

  // Find new recommendations
  newAudit.recommendations.forEach((newRec) => {
    const existed = oldAudit.recommendations.find((r) => r.tool === newRec.tool);
    if (!existed) {
      newRecommendations.push(newRec);
    }
  });

  return {
    costChange,
    savingsChange,
    changedRecommendations,
    newRecommendations,
    removedRecommendations,
  };
}

export function formatDiffSummary(diff: AuditDiff): string {
  const parts: string[] = [];

  if (Math.abs(diff.costChange) >= 0.01) {
    const direction = diff.costChange > 0 ? 'increased' : 'decreased';
    parts.push(`Monthly cost ${direction} by $${Math.abs(diff.costChange).toFixed(2)}`);
  }

  if (Math.abs(diff.savingsChange) >= 0.01) {
    const direction = diff.savingsChange > 0 ? 'increased' : 'decreased';
    parts.push(
      `Potential savings ${direction} by $${Math.abs(diff.savingsChange).toFixed(2)}`
    );
  }

  if (diff.changedRecommendations.length > 0) {
    parts.push(`${diff.changedRecommendations.length} recommendation(s) updated`);
  }

  if (diff.newRecommendations.length > 0) {
    parts.push(`${diff.newRecommendations.length} new recommendation(s)`);
  }

  return parts.length > 0 ? parts.join(', ') : 'No significant changes detected';
}
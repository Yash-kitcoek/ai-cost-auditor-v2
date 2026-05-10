import { AuditInput, AuditResult } from './types';
import { evaluateTool, detectRedundancy } from './rules';
import { roundCents } from '../utils/format';

export function runAudit(input: AuditInput): AuditResult {
  const { tools, teamSize, useCase } = input;
  const allToolIds = tools.map((t) => t.toolId);

  const recommendations = tools.map((entry) =>
    evaluateTool(entry, useCase, teamSize, allToolIds)
  );

  // Apply redundancy detection
  const redundancyNote = detectRedundancy(tools, useCase);
  if (redundancyNote) {
    const target = recommendations.find(
      (r) => (r.toolId === 'chatgpt' || r.toolId === 'openai-api') && r.action === 'keep'
    );
    if (target) {
      const redundantTool = tools.find((t) => t.toolId === target.toolId);
      target.action = 'cancel';
      target.savings = roundCents(redundantTool?.monthlySpend || 0);
      target.recommendedSpend = 0;
      target.reason = redundancyNote;
    }
  }

  // Round every per-tool figure before summing — kills drift at the source
  for (const rec of recommendations) {
    rec.currentSpend     = roundCents(rec.currentSpend);
    rec.recommendedSpend = roundCents(rec.recommendedSpend);
    rec.savings          = roundCents(rec.savings);
  }

  const totalCurrentSpend   = roundCents(recommendations.reduce((sum, r) => sum + r.currentSpend, 0));
  const totalOptimizedSpend = roundCents(recommendations.reduce((sum, r) => sum + r.recommendedSpend, 0));
  const totalMonthlySavings = roundCents(Math.max(0, totalCurrentSpend - totalOptimizedSpend));
  const totalAnnualSavings  = roundCents(totalMonthlySavings * 12);

  const savingsRatio = totalCurrentSpend > 0 ? totalMonthlySavings / totalCurrentSpend : 0;
  const score = Math.round(Math.max(0, Math.min(100, 100 - savingsRatio * 100)));

  return {
    recommendations,
    totalMonthlySavings,
    totalAnnualSavings,
    totalCurrentSpend,
    totalOptimizedSpend,
    isAlreadyOptimal: totalMonthlySavings < 5,
    highSavings: totalMonthlySavings > 500,
    score,
    useCase,
    teamSize,
  };
}
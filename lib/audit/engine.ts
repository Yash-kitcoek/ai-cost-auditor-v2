import { AuditInput, AuditResult } from './types';
import { evaluateTool, detectRedundancy } from './rules';

export function runAudit(input: AuditInput): AuditResult {
  const { tools, teamSize, useCase } = input;
  const allToolIds = tools.map((t) => t.toolId);

  const recommendations = tools.map((entry) =>
    evaluateTool(entry, useCase, teamSize, allToolIds)
  );

  const totalCurrentSpend = recommendations.reduce((sum, r) => sum + r.currentSpend, 0);
  const totalOptimizedSpend = recommendations.reduce((sum, r) => sum + r.recommendedSpend, 0);
  const totalMonthlySavings = totalCurrentSpend - totalOptimizedSpend;
  const totalAnnualSavings = totalMonthlySavings * 12;

  const redundancyNote = detectRedundancy(tools, useCase);
  // Attach redundancy note to the most expensive redundant tool's recommendation
  if (redundancyNote) {
    const chatgptRec = recommendations.find((r) => r.toolId === 'chatgpt' && r.action === 'keep');
    if (chatgptRec) {
      chatgptRec.reason = redundancyNote;
      chatgptRec.action = 'cancel';
    }
  }

  return {
    recommendations,
    totalMonthlySavings,
    totalAnnualSavings,
    totalCurrentSpend,
    totalOptimizedSpend,
    isAlreadyOptimal: totalMonthlySavings <= 0,
    highSavings: totalMonthlySavings > 500,
    useCase,
    teamSize,
  };
}
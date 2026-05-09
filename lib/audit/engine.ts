import { AuditInput, AuditResult } from './types';
import { evaluateTool, detectRedundancy } from './rules';

export function runAudit(input: AuditInput): AuditResult {
  const { tools, teamSize, useCase } = input;
  const allToolIds = tools.map((t) => t.toolId);

  const recommendations = tools.map((entry) =>
    evaluateTool(entry, useCase, teamSize, allToolIds)
  );

  const redundancyNote = detectRedundancy(tools, useCase);
  if (redundancyNote) {
    const chatgptRec = recommendations.find((r) => r.toolId === 'chatgpt' && r.action === 'keep');
    if (chatgptRec) { chatgptRec.reason = redundancyNote; chatgptRec.action = 'cancel'; }
  }

  const totalCurrentSpend = recommendations.reduce((sum, r) => sum + r.currentSpend, 0);
  const totalOptimizedSpend = recommendations.reduce((sum, r) => sum + r.recommendedSpend, 0);
  const totalMonthlySavings = totalCurrentSpend - totalOptimizedSpend;

  return {
    recommendations,
    totalMonthlySavings,
    totalAnnualSavings: totalMonthlySavings * 12,
    totalCurrentSpend,
    totalOptimizedSpend,
    isAlreadyOptimal: totalMonthlySavings <= 0,
    highSavings: totalMonthlySavings > 500,
    useCase,
    teamSize,
  };
}
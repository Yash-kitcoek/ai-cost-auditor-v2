import { describe, expect, it } from 'vitest';
import { adaptAuditOutputForResultPage } from '../lib/audit-adapter';
import { runAudit } from '../lib/audit-engine';
import { calculateAuditDiff } from '../lib/diff-calculator';
import {
  comparePricingSnapshots,
  getPricingSnapshot,
  PRICING_DATA,
} from '../lib/pricing';

describe('round 2 re-audit flow', () => {
  it('stores enough audit output to calculate a later diff', () => {
    const oldAudit = runAudit({
      email: 'founder@example.com',
      tools: { cursor: 'Business' },
      usage: { cursor: 40 },
    });

    const newAudit = {
      ...oldAudit,
      totalMonthlyCost: 45,
      totalPotentialSavings: oldAudit.totalPotentialSavings + 5,
      recommendations: oldAudit.recommendations.map((rec) => ({
        ...rec,
        currentCost: rec.currentCost + 5,
        savings: rec.savings + 5,
      })),
    };

    const diff = calculateAuditDiff(oldAudit, newAudit);
    expect(diff.costChange).toBe(5);
    expect(diff.savingsChange).toBe(5);
    expect(diff.changedRecommendations).toHaveLength(1);
  });

  it('detects tier price changes between snapshots', () => {
    const oldSnapshot = getPricingSnapshot();
    const newSnapshot = {
      ...oldSnapshot,
      data: {
        ...PRICING_DATA,
        cursor: {
          ...PRICING_DATA.cursor,
          tiers: PRICING_DATA.cursor.tiers.map((tier) =>
            tier.name === 'Pro' ? { ...tier, price: tier.price + 5 } : tier
          ),
        },
      },
    };

    const changes = comparePricingSnapshots(oldSnapshot, newSnapshot);
    expect(changes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          tool: 'Cursor',
          changeType: 'price_change',
        }),
      ])
    );
  });

  it('adapts Round 2 audit output to the existing result page shape', () => {
    const output = runAudit({
      email: 'founder@example.com',
      tools: { claude: 'Team' },
      usage: { claude: 30 },
      teamSize: 5,
      useCase: 'writing',
    });

    const result = adaptAuditOutputForResultPage(output, {
      teamSize: 5,
      useCase: 'writing',
    });

    expect(result.totalMonthlySavings).toBe(output.totalPotentialSavings);
    expect(result.totalCurrentSpend).toBe(output.totalMonthlyCost);
    expect(result.teamSize).toBe(5);
    expect(result.useCase).toBe('writing');
  });
});

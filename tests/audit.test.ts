// tests/audit.test.ts
// Run: npx vitest run tests/audit.test.ts
// These tests cover the audit engine end-to-end with known inputs and expected outputs.

import { describe, it, expect } from 'vitest';
import { runAudit } from '../lib/audit/engine';
import { AuditInput } from '../lib/audit/types';

describe('runAudit — savings calculation', () => {
  it('returns zero savings for an empty tool list', () => {
    const input: AuditInput = { tools: [], teamSize: 5, useCase: 'coding' };
    const result = runAudit(input);
    expect(result.totalMonthlySavings).toBe(0);
    expect(result.totalAnnualSavings).toBe(0);
  });

  it('calculates correct monthly and annual savings', () => {
    // Cursor Business at $40/seat for 2 seats = $80/mo
    // Rule: team of 2 should be on Pro ($20/seat) = $40/mo → saves $40/mo
    const input: AuditInput = {
      tools: [{ toolId: 'cursor', plan: 'business', seats: 2, monthlySpend: 80 }],
      teamSize: 2,
      useCase: 'coding',
    };
    const result = runAudit(input);
    expect(result.totalMonthlySavings).toBeGreaterThan(0);
    expect(result.totalAnnualSavings).toBe(result.totalMonthlySavings * 12);
  });

  it('sets isAlreadyOptimal when savings are below $20/mo', () => {
    // Claude Pro for 1 user — well-priced for solo use
    const input: AuditInput = {
      tools: [{ toolId: 'claude', plan: 'pro', seats: 1, monthlySpend: 20 }],
      teamSize: 1,
      useCase: 'writing',
    };
    const result = runAudit(input);
    expect(result.isAlreadyOptimal).toBe(true);
  });

  it('does NOT set isAlreadyOptimal when significant savings exist', () => {
    // GitHub Copilot Enterprise at $39/seat for 10 seats
    // Business ($19/seat) would serve the same purpose for most teams
    const input: AuditInput = {
      tools: [{ toolId: 'github-copilot', plan: 'enterprise', seats: 10, monthlySpend: 390 }],
      teamSize: 10,
      useCase: 'coding',
    };
    const result = runAudit(input);
    expect(result.isAlreadyOptimal).toBe(false);
    expect(result.totalMonthlySavings).toBeGreaterThan(20);
  });

  it('returns a score between 0 and 100', () => {
    const inputs: AuditInput[] = [
      { tools: [], teamSize: 1, useCase: 'mixed' },
      {
        tools: [{ toolId: 'cursor', plan: 'business', seats: 1, monthlySpend: 40 }],
        teamSize: 1,
        useCase: 'coding',
      },
      {
        tools: [
          { toolId: 'cursor', plan: 'business', seats: 20, monthlySpend: 800 },
          { toolId: 'github-copilot', plan: 'enterprise', seats: 20, monthlySpend: 780 },
          { toolId: 'chatgpt', plan: 'team', seats: 20, monthlySpend: 500 },
        ],
        teamSize: 20,
        useCase: 'coding',
      },
    ];
    for (const input of inputs) {
      const result = runAudit(input);
      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(100);
    }
  });

  it('produces one recommendation per tool', () => {
    const input: AuditInput = {
      tools: [
        { toolId: 'cursor', plan: 'pro', seats: 3, monthlySpend: 60 },
        { toolId: 'claude', plan: 'team', seats: 3, monthlySpend: 75 },
      ],
      teamSize: 3,
      useCase: 'coding',
    };
    const result = runAudit(input);
    expect(result.recommendations).toHaveLength(2);
    const toolIds = result.recommendations.map((r) => r.toolId);
    expect(toolIds).toContain('cursor');
    expect(toolIds).toContain('claude');
  });

  it('marks a tool as keep when it is already the optimal plan', () => {
    // Cursor Pro for 1 seat at $20 — correct plan
    const input: AuditInput = {
      tools: [{ toolId: 'cursor', plan: 'pro', seats: 1, monthlySpend: 20 }],
      teamSize: 1,
      useCase: 'coding',
    };
    const result = runAudit(input);
    const cursorRec = result.recommendations.find((r) => r.toolId === 'cursor');
    expect(cursorRec?.action).toBe('keep');
    expect(cursorRec?.savings).toBe(0);
  });
});
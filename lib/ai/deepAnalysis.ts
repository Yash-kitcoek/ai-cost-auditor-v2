// lib/ai/deepAnalysis.ts
// Adds 3-layer AI reasoning on top of the rule-based audit
// The math (savings calculations) is NEVER touched here — rules.ts owns that
// This module adds: plan optimization insight, alternative tool, credits insight

import { AuditResult, AuditInput, ToolRecommendation, UseCase } from '../audit/types';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ToolDeepAnalysis {
  toolId: string;
  toolName: string;
  problem: string;           // seat waste OR over-tier description
  planOptimization: string;  // downgrade suggestion or "keep current"
  alternativeOption: string | null;  // only if valid alternative exists
  creditsInsight: string | null;     // only if spend > $200/mo
  reason: string;            // 1-2 lines, practical
}

export interface DeepAuditAnalysis {
  perTool: ToolDeepAnalysis[];
  finalSummary: string;      // max 100 words, direct, critical
  biggestWaste: string;      // name of top waste source
  isOverbuilt: boolean;      // stack overbuilt for team size?
  generatedAt: string;
}

// ─── Prompt builder ───────────────────────────────────────────────────────────

function buildDeepAnalysisPrompt(
  result: AuditResult,
  input: AuditInput
): string {
  const toolLines = result.recommendations.map((rec) => {
    const entry = input.tools.find((t) => t.toolId === rec.toolId);
    const unusedSeats = entry ? Math.max(0, entry.seats - input.teamSize) : 0;
    return `Tool: ${rec.toolName}
  Plan: ${rec.currentPlan}
  Seats: ${entry?.seats ?? rec.currentSpend}
  Team size: ${input.teamSize}
  Monthly cost: $${rec.currentSpend}
  Unused seats: ${unusedSeats}
  Calculated savings: $${rec.savings}/mo (DO NOT change this number)`;
  }).join('\n\n');

  return `You are an AI cost optimization analyst. The savings calculations are FINAL — do not change any dollar amounts.

Your job is to add 3 layers of reasoning per tool, then write a final summary.

INPUT:
Team size: ${input.teamSize}
Use case: ${input.useCase}

TOOLS:
${toolLines}

---
TASK:
For EACH tool above, provide exactly this structure:

Tool: [name]
- Problem: [seat waste OR over-tier — be specific, cite numbers]
- Plan Optimization: [suggest cheaper plan from SAME vendor if realistic, else "Current plan is appropriate"]
- Alternative Option: [suggest cheaper alternative ONLY if it provides similar capability for this use case — coding→Cursor/Copilot, writing/research→Claude/ChatGPT — or write "None" if no valid alternative]
- Credits Insight: [if monthly spend > $200 for this tool, note they are likely paying retail pricing and bulk procurement could reduce cost by 15-30% — else write "None"]
- Reason: [1-2 lines max, practical, no fluff, name specific dollar amounts]

---
FINAL SUMMARY (max 100 words):
Write a direct, slightly critical founder-level summary covering:
- The biggest single waste source (name it)
- Whether the stack is overbuilt for the team size
- Where most savings come from
- End with one concrete action they should take this week

RULES:
- Never change any savings dollar amounts
- Never recommend removing a tool unless it is provably redundant
- Be direct, not diplomatic
- No bullet points in the summary paragraph
- No filler phrases like "leverage", "seamlessly", "robust"`;
}

// ─── Response parser ──────────────────────────────────────────────────────────

function parseDeepAnalysisResponse(
  text: string,
  result: AuditResult
): DeepAuditAnalysis {
  const perTool: ToolDeepAnalysis[] = [];

  // Split by "Tool:" sections
  const toolSections = text.split(/\nTool:/g);

  for (const section of toolSections) {
    if (!section.trim()) continue;

    // Try to match a known tool name at the start
    const nameMatch = section.match(/^[\s]*([^\n]+)/);
    if (!nameMatch) continue;

    const toolNameRaw = nameMatch[1].trim();
    const rec = result.recommendations.find(
      (r) => section.toLowerCase().includes(r.toolName.toLowerCase())
    );
    if (!rec) continue;

    const extract = (label: string): string => {
      const regex = new RegExp(`-\\s*${label}:\\s*([^\\n-]+(?:\\n(?!\\s*-)[^\\n-]+)*)`, 'i');
      const match = section.match(regex);
      return match ? match[1].trim() : '';
    };

    const problem = extract('Problem') || `Current spend: $${rec.currentSpend}/mo`;
    const planOpt = extract('Plan Optimization') || 'Review current plan tier';
    const altRaw = extract('Alternative Option');
    const creditsRaw = extract('Credits Insight');
    const reason = extract('Reason') || rec.reason.split('.')[0];

    perTool.push({
      toolId: rec.toolId,
      toolName: rec.toolName,
      problem,
      planOptimization: planOpt,
      alternativeOption: altRaw === 'None' || !altRaw ? null : altRaw,
      creditsInsight: creditsRaw === 'None' || !creditsRaw ? null : creditsRaw,
      reason,
    });
  }

  // Extract final summary
  const summaryMatch = text.match(/FINAL SUMMARY[:\s]*([\s\S]+)$/i);
  const finalSummary = summaryMatch
    ? summaryMatch[1].trim().replace(/^[-•*]\s*/gm, '').trim()
    : generateFallbackSummaryText(result);

  // Determine biggest waste
  const topRec = result.recommendations
    .filter((r) => r.savings > 0)
    .sort((a, b) => b.savings - a.savings)[0];

  // Is stack overbuilt?
  const spendPerPerson = result.totalCurrentSpend / Math.max(result.teamSize, 1);
  const isOverbuilt = spendPerPerson > 150 || result.recommendations.length > result.teamSize;

  return {
    perTool,
    finalSummary,
    biggestWaste: topRec?.toolName ?? 'None identified',
    isOverbuilt,
    generatedAt: new Date().toISOString(),
  };
}

function generateFallbackSummaryText(result: AuditResult): string {
  const topRec = result.recommendations
    .filter((r) => r.savings > 0)
    .sort((a, b) => b.savings - a.savings)[0];

  if (result.isAlreadyOptimal) {
    return `This ${result.teamSize}-person ${result.useCase} team's AI stack is well-matched to their workflow at $${result.totalCurrentSpend}/month. No seat waste or tier overkill detected. The main action for the next quarter is reviewing API usage costs as token pricing continues to shift.`;
  }

  const spendPerPerson = Math.round(result.totalCurrentSpend / Math.max(result.teamSize, 1));
  const isOverbuilt = spendPerPerson > 150;

  return `This ${result.teamSize}-person team spends $${result.totalCurrentSpend}/month — $${spendPerPerson}/person, which is ${isOverbuilt ? `${Math.round(spendPerPerson / 80)}x above typical for a ${result.useCase} workflow` : 'within range but improvable'}. ${topRec ? `The biggest waste is ${topRec.toolName} at $${topRec.savings}/month in recoverable spend.` : ''} Total savings of $${result.totalMonthlySavings}/month require no capability trade-offs. Start with ${topRec?.toolName ?? 'the highest-savings item'} this week.`;
}

// ─── Main export ──────────────────────────────────────────────────────────────

export async function generateDeepAnalysis(
  result: AuditResult,
  input: AuditInput
): Promise<DeepAuditAnalysis> {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  // Fallback: parse from rules without AI
  if (!apiKey || apiKey === 'your_anthropic_key') {
    return buildFallbackAnalysis(result, input);
  }

  try {
    const prompt = buildDeepAnalysisPrompt(result, input);

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1500,
        messages: [{ role: 'user', content: prompt }],
      }),
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      console.error('[deepAnalysis] API error:', response.status);
      return buildFallbackAnalysis(result, input);
    }

    const data = await response.json();
    const text = data.content?.[0]?.text;
    if (!text) return buildFallbackAnalysis(result, input);

    return parseDeepAnalysisResponse(text, result);
  } catch (err) {
    console.error('[deepAnalysis] failed:', err);
    return buildFallbackAnalysis(result, input);
  }
}

// ─── Rule-based fallback (no API needed) ─────────────────────────────────────

function buildFallbackAnalysis(
  result: AuditResult,
  input: AuditInput
): DeepAuditAnalysis {
  const ALTERNATIVES: Record<string, Record<string, string>> = {
    'github-copilot': {
      coding: 'Cursor Pro ($20/seat) — same AI completions, native editor experience, 0% price premium vs Copilot Business.',
    },
    chatgpt: {
      writing: 'Claude Pro ($20/seat) — benchmarks higher on long-form writing and document analysis at identical price.',
      research: 'Claude Pro ($20/seat) — stronger on document summarization and extended context tasks.',
    },
    cursor: {
      writing: 'Claude Pro ($20/seat) — Cursor is a code editor; Claude is purpose-built for writing workflows.',
      research: 'Claude Pro ($20/seat) — Cursor adds zero value for research tasks.',
    },
  };

  const perTool: ToolDeepAnalysis[] = result.recommendations.map((rec) => {
    const entry = input.tools.find((t) => t.toolId === rec.toolId);
    const unusedSeats = entry ? Math.max(0, entry.seats - input.teamSize) : 0;
    const isHighSpend = rec.currentSpend > 200;

    const problem = unusedSeats > 0
      ? `${unusedSeats} unused seat${unusedSeats > 1 ? 's' : ''} — paying for ${entry?.seats} licenses on a ${input.teamSize}-person team`
      : rec.action === 'downgrade'
      ? `Over-tier plan — ${rec.currentPlan} adds features not justified at ${input.teamSize} seats`
      : `Spend appears appropriate for current usage`;

    const planOptimization = rec.recommendedPlan
      ? `Downgrade to ${rec.recommendedPlan} — saves $${rec.savings}/mo with no capability loss`
      : rec.action === 'keep'
      ? 'Current plan is appropriate for team size and use case'
      : `Consider ${rec.recommendedTool ?? 'reviewing tier'}`;

    const altMap = ALTERNATIVES[rec.toolId];
    const altOption = altMap ? (altMap[input.useCase] ?? altMap['mixed'] ?? null) : null;

    const creditsInsight = isHighSpend
      ? `At $${rec.currentSpend}/mo, you are likely paying retail pricing. Bulk AI credit procurement (e.g. via Credex) typically reduces this by 15–30% — saving an additional $${Math.round(rec.currentSpend * 0.2)}/mo.`
      : null;

    return {
      toolId: rec.toolId,
      toolName: rec.toolName,
      problem,
      planOptimization,
      alternativeOption: rec.action === 'switch' ? `Switch to ${rec.recommendedTool}` : altOption,
      creditsInsight,
      reason: rec.reason.split('.').slice(0, 2).join('.') + '.',
    };
  });

  return {
    perTool,
    finalSummary: generateFallbackSummaryText(result),
    biggestWaste: result.recommendations.filter(r => r.savings > 0).sort((a, b) => b.savings - a.savings)[0]?.toolName ?? 'None',
    isOverbuilt: result.totalCurrentSpend / Math.max(result.teamSize, 1) > 150,
    generatedAt: new Date().toISOString(),
  };
}
import { NextRequest, NextResponse } from 'next/server';
import { generateAuditWithSnapshot } from '@/lib/audit-engine';
import { saveAudit } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, tools, usage, honeypot } = body;

    // Honeypot spam check
    if (honeypot) {
      return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
    }

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json(
        { error: 'A valid email is required for pricing-change alerts.' },
        { status: 400 }
      );
    }

    if (!tools || typeof tools !== 'object' || Object.keys(tools).length === 0) {
      return NextResponse.json(
        { error: 'At least one tool is required.' },
        { status: 400 }
      );
    }

    const { input, output, pricingSnapshot } = generateAuditWithSnapshot({
      email,
      tools,
      usage,
    });

    // ── Map new engine output → shape the Round 1 result page expects ──
    const optimizedMonthlySpend =
      output.totalMonthlyCost - output.totalPotentialSavings;

    const score = output.totalPotentialSavings === 0
      ? 100
      : Math.max(
          0,
          Math.round(100 - (output.totalPotentialSavings / output.totalMonthlyCost) * 100)
        );

    const resultForPage = {
      // Fields the result page reads
      totalMonthlySavings: output.totalPotentialSavings,
      totalAnnualSavings: output.totalPotentialSavings * 12,
      currentMonthlySpend: output.totalMonthlyCost,
      optimizedMonthlySpend,
      score,
      isAlreadyOptimal: output.totalPotentialSavings === 0,

      // Map recommendations to Round 1 shape
      recommendations: output.recommendations.map((rec) => ({
        toolId: Object.keys(tools).find(
          (k) => tools[k] === rec.currentTier || rec.tool.toLowerCase().includes(k)
        ) || rec.tool,
        toolName: rec.tool,
        action: rec.savings > 0 ? 'switch' : 'keep',
        currentPlan: rec.currentTier,
        recommendedPlan: rec.recommendedTier,
        currentCost: rec.currentCost,
        recommendedCost: rec.recommendedCost,
        savings: rec.savings,
        annualSavings: rec.savings * 12,
        reason: rec.reason,
        priority: rec.savings > 50 ? 'high' : rec.savings > 20 ? 'medium' : 'low',
      })),
    };

    const saved = await saveAudit({
      user_email: email,
      input_stack: input,
      output_result: output,       // save raw new format to DB for reaudit flow
      pricing_snapshot: pricingSnapshot,
    });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    return NextResponse.json({
      success: true,
      id: saved.id,          // old field — result page uses this
      auditId: saved.id,     // new field — reaudit flow uses this
      result: resultForPage, // shaped for the result page
      reauditUrl: `${appUrl}/reaudit/${saved.id}`,
    });
  } catch (error: any) {
    console.error('[audit] error:', error);
    return NextResponse.json(
      { error: 'Audit failed', details: error.message },
      { status: 500 }
    );
  }
}
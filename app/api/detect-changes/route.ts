// app/api/detect-changes/route.ts
// POST /api/detect-changes
// Detects pricing changes and sends consolidated notification emails.
// Triggered by GitHub Actions cron (see .github/workflows/pricing-check.yml)
// or manually: POST /api/detect-changes with Authorization: Bearer <CRON_SECRET>

import { NextRequest, NextResponse } from 'next/server';
import {
  getAllAudits,
  logPricingChange,
  logEmail,
} from '@/lib/db';
import {
  comparePricingSnapshots,
  getPricingSnapshot,
  hasSignificantChange,
} from '@/lib/pricing';
import { runAudit } from '@/lib/audit-engine';
import { calculateAuditDiff } from '@/lib/diff-calculator';
import { sendBatchPricingEmails, PricingChangeEmail } from '@/lib/email';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  // Verify cron secret when set
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const auth = req.headers.get('authorization');
    if (auth !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  try {
    const currentSnapshot = getPricingSnapshot();
    const audits = await getAllAudits();

    if (audits.length === 0) {
      return NextResponse.json({
        message: 'No audits to check',
        affectedAudits: 0,
        emailsSent: 0,
      });
    }

    // Group affected audits by user email — one email per user no matter how many audits
    const emailGroups = new Map<string, PricingChangeEmail[]>();
    let affectedCount = 0;

    for (const audit of audits) {
      if (audit.is_unsubscribed) continue;
      if (!audit.user_email) continue;
      if (!audit.pricing_snapshot) continue;

      const changes = comparePricingSnapshots(audit.pricing_snapshot, currentSnapshot);
      if (!hasSignificantChange(changes)) continue;

      // Re-run audit with current pricing to get new recommendations
      const newResult = runAudit(audit.input_stack);
      const diff = calculateAuditDiff(audit.output_result, newResult);

      // Only notify if the change is material (>$1 savings delta or new/removed recs)
      const isMaterial =
        Math.abs(diff.savingsChange) >= 1 ||
        diff.changedRecommendations.length > 0 ||
        diff.newRecommendations.length > 0 ||
        diff.removedRecommendations.length > 0;

      if (!isMaterial) continue;

      affectedCount++;

      const emailEntry: PricingChangeEmail = {
        userEmail: audit.user_email,
        auditId: audit.id,
        changes,
        diff,
      };

      if (!emailGroups.has(audit.user_email)) {
        emailGroups.set(audit.user_email, []);
      }
      emailGroups.get(audit.user_email)!.push(emailEntry);
    }

    if (emailGroups.size === 0) {
      return NextResponse.json({
        message: 'No material changes found',
        affectedAudits: affectedCount,
        emailsSent: 0,
      });
    }

    // Send one consolidated email per user
    const emailResults = await sendBatchPricingEmails(emailGroups);

    // Log each sent email in email_logs
    for (const result of emailResults) {
      if (!result.success) continue;
      const userEntries = emailGroups.get(result.email) || [];
      for (const entry of userEntries) {
        try {
          await logEmail({
            audit_id: entry.auditId,
            user_email: result.email,
            email_type: 'pricing_change',
          });
        } catch (err) {
          console.error('[detect-changes] logEmail failed:', err);
        }
      }
    }

    // Log the pricing changes themselves for the public /changes page
    const allChanges = Array.from(emailGroups.values())
      .flat()
      .flatMap((e) => e.changes);

    const uniqueToolNames = new Set(allChanges.map((c) => c.tool));
    for (const toolName of uniqueToolNames) {
      const toolChanges = allChanges.filter((c) => c.tool === toolName);
      if (toolChanges.length === 0) continue;
      try {
        await logPricingChange({
          tool_name: toolName,
          old_pricing: toolChanges[0].oldValue ?? {},
          new_pricing: toolChanges[0].newValue ?? {},
          affected_audits_count: affectedCount,
        });
      } catch (err) {
        console.error('[detect-changes] logPricingChange failed:', err);
      }
    }

    const sent = emailResults.filter((r) => r.success).length;
    const failed = emailResults.filter((r) => !r.success).length;

    return NextResponse.json({
      success: true,
      affectedAudits: affectedCount,
      usersNotified: emailGroups.size,
      emailsSent: sent,
      emailsFailed: failed,
      pricingChangesLogged: uniqueToolNames.size,
    });
  } catch (error: any) {
    console.error('[detect-changes] error:', error);
    return NextResponse.json(
      { error: 'Detection failed', details: error.message },
      { status: 500 }
    );
  }
}

// Also support GET for manual browser triggers during testing
export async function GET(req: NextRequest) {
  return POST(req);
}
import { Resend } from 'resend';
import { AuditDiff, formatDiffSummary } from './diff-calculator';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
const DOMAIN_VERIFIED = process.env.RESEND_DOMAIN_VERIFIED === 'true';
const TEST_RECIPIENT = process.env.RESEND_TEST_RECIPIENT;

function getResendClient() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey || apiKey === 're_your-key-here') {
    throw new Error('RESEND_API_KEY is required to send pricing-change emails');
  }
  return new Resend(apiKey);
}

export interface PricingChangeEmail {
  userEmail: string;
  auditId: string;
  changes: any[];
  diff: AuditDiff;
}

export async function sendPricingChangeEmail(params: PricingChangeEmail) {
  const { userEmail, auditId, changes, diff } = params;

  const changesHtml = changes
    .map(
      (change) => `
      <li style="margin-bottom: 8px;">
        <strong>${change.tool}</strong>: ${change.details}
      </li>
    `
    )
    .join('');

  const recommendationImpactHtml = [
    ...diff.changedRecommendations.map(
      (change) => `
      <li style="margin-bottom: 10px;">
        <strong>${change.tool}</strong>:
        previously recommended <strong>${change.oldRecommendation.recommendedTier}</strong>
        with $${change.oldRecommendation.savings.toFixed(2)}/mo savings.
        Current pricing recommends <strong>${change.newRecommendation.recommendedTier}</strong>
        with $${change.newRecommendation.savings.toFixed(2)}/mo savings.
      </li>
    `
    ),
    ...diff.newRecommendations.map(
      (rec) => `
      <li style="margin-bottom: 10px;">
        <strong>${rec.tool}</strong>: new recommendation to move from
        <strong>${rec.currentTier}</strong> to <strong>${rec.recommendedTier}</strong>,
        saving $${rec.savings.toFixed(2)}/mo.
      </li>
    `
    ),
    ...diff.removedRecommendations.map(
      (rec) => `
      <li style="margin-bottom: 10px;">
        <strong>${rec.tool}</strong>: previous recommendation to move to
        <strong>${rec.recommendedTier}</strong> is no longer triggered by current pricing.
      </li>
    `
    ),
  ].join('');

  const recommendationImpactText = [
    ...diff.changedRecommendations.map(
      (change) =>
        `- ${change.tool}: previously recommended ${change.oldRecommendation.recommendedTier} with $${change.oldRecommendation.savings.toFixed(2)}/mo savings; current pricing recommends ${change.newRecommendation.recommendedTier} with $${change.newRecommendation.savings.toFixed(2)}/mo savings.`
    ),
    ...diff.newRecommendations.map(
      (rec) =>
        `- ${rec.tool}: new recommendation to move from ${rec.currentTier} to ${rec.recommendedTier}, saving $${rec.savings.toFixed(2)}/mo.`
    ),
    ...diff.removedRecommendations.map(
      (rec) =>
        `- ${rec.tool}: previous recommendation to move to ${rec.recommendedTier} is no longer triggered by current pricing.`
    ),
  ].join('\n');

  const reauditUrl = `${APP_URL}/reaudit/${auditId}`;
  const unsubscribeUrl = `${APP_URL}/api/unsubscribe?audit_id=${auditId}`;

  const recipient = DOMAIN_VERIFIED ? userEmail : TEST_RECIPIENT;
  if (!recipient) {
    throw new Error(
      'Set RESEND_TEST_RECIPIENT to your Resend account email, or set RESEND_DOMAIN_VERIFIED=true after verifying a domain.'
    );
  }

  const subjectPrefix = diff.savingsChange > 0
    ? 'More Savings Available'
    : diff.savingsChange < 0
    ? 'Pricing Changes Detected'
    : 'Update Available';

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>AI Tool Pricing Update</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f3f4f6;">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
          <tr>
            <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 28px;">AI Tool Pricing Update</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px 30px;">
              <p style="font-size: 16px; margin-bottom: 20px;">Hey there,</p>
              
              <p style="font-size: 16px; margin-bottom: 20px;">
                We detected pricing changes for AI tools in your previous audit. Here's what changed:
              </p>
              
              <div style="background: #f9fafb; border-left: 4px solid #667eea; padding: 20px; margin: 25px 0; border-radius: 4px;">
                <h3 style="margin-top: 0; color: #667eea; font-size: 18px;">What Changed:</h3>
                <ul style="margin: 10px 0; padding-left: 20px;">
                  ${changesHtml}
                </ul>
              </div>
              
              <div style="background: ${diff.savingsChange > 0 ? '#ecfdf5' : diff.savingsChange < 0 ? '#fef3c7' : '#f3f4f6'}; border-left: 4px solid ${diff.savingsChange > 0 ? '#10b981' : diff.savingsChange < 0 ? '#f59e0b' : '#6b7280'}; padding: 20px; margin: 25px 0; border-radius: 4px;">
                <h3 style="margin-top: 0; color: ${diff.savingsChange > 0 ? '#10b981' : diff.savingsChange < 0 ? '#f59e0b' : '#6b7280'}; font-size: 18px;">Impact on Your Audit:</h3>
                <p style="margin: 10px 0; font-size: 15px;">
                  ${formatDiffSummary(diff)}
                </p>
                ${
                  recommendationImpactHtml
                    ? `<ul style="margin: 14px 0 0; padding-left: 20px; font-size: 14px;">
                         ${recommendationImpactHtml}
                       </ul>`
                    : `<p style="margin: 14px 0 0; font-size: 14px;">
                         Your recommendation stayed the same, but the underlying monthly cost and savings changed.
                       </p>`
                }
                ${
                  diff.savingsChange > 0
                    ? `<p style="color: #10b981; font-weight: bold; margin: 10px 0; font-size: 16px;">
                         You could now save an additional $${diff.savingsChange.toFixed(2)}/month!
                       </p>`
                    : diff.savingsChange < 0
                    ? `<p style="color: #f59e0b; font-weight: bold; margin: 10px 0; font-size: 16px;">
                         Potential savings decreased by $${Math.abs(diff.savingsChange).toFixed(2)}/month
                       </p>`
                    : ''
                }
              </div>
              
              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                <tr>
                  <td style="text-align: center;">
                    <a href="${reauditUrl}" 
                       style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
                      View Updated Audit
                    </a>
                  </td>
                </tr>
              </table>
              
              <p style="font-size: 14px; color: #6b7280; margin-top: 30px; text-align: center;">
                This will show you a side-by-side comparison of your old vs new recommendations.
              </p>
            </td>
          </tr>
          <tr>
            <td style="background-color: #f9fafb; padding: 20px 30px; border-top: 1px solid #e5e7eb;">
              <p style="font-size: 12px; color: #9ca3af; text-align: center; margin: 0;">
                Don't want these updates? <a href="${unsubscribeUrl}" style="color: #667eea; text-decoration: underline;">Unsubscribe</a>
              </p>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;

  const text = `
AI Tool Pricing Update

We detected pricing changes for AI tools in your previous audit.

What Changed:
${changes.map((c) => `- ${c.tool}: ${c.details}`).join('\n')}

Impact: ${formatDiffSummary(diff)}

Recommendation impact:
${recommendationImpactText || '- Your recommendation stayed the same, but the underlying monthly cost and savings changed.'}

View your updated audit: ${reauditUrl}

Unsubscribe: ${unsubscribeUrl}
  `;

  try {
    const resend = getResendClient();
    const { data, error } = await resend.emails.send({
      from: 'AI Cost Auditor <onboarding@resend.dev>', // Change this after domain verification
      to: recipient,
      subject: DOMAIN_VERIFIED
        ? `AI Tool Pricing Update - ${subjectPrefix}`
        : `[Test for ${userEmail}] AI Tool Pricing Update - ${subjectPrefix}`,
      html,
      text,
    });

    if (error) {
      console.error('Email send error:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Failed to send email:', error);
    throw error;
  }
}

export async function sendBatchPricingEmails(
  emailGroups: Map<string, PricingChangeEmail[]>
) {
  const results = [];

  for (const [email, emails] of emailGroups.entries()) {
    // Consolidate multiple audits for same user
    const allChanges = emails.flatMap((e) => e.changes);
    const uniqueChanges = Array.from(
      new Map(allChanges.map((c) => [c.tool, c])).values()
    );

    // Use the most recent audit's diff
    const latestEmail = emails[0];

    try {
      const result = await sendPricingChangeEmail({
        userEmail: email,
        auditId: latestEmail.auditId,
        changes: uniqueChanges,
        diff: latestEmail.diff,
      });
      results.push({ email, success: true, result });
    } catch (error) {
      console.error(`Failed to send email to ${email}:`, error);
      results.push({ email, success: false, error });
    }
  }

  return results;
}

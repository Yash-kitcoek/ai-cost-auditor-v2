import type { NextApiRequest, NextApiResponse } from 'next';
import { generateAuditWithSnapshot } from '../../lib/audit-engine';
import { saveAudit } from '../../lib/db';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, tools, usage } = req.body;

    if (!email || !tools) {
      return res.status(400).json({ error: 'Email and tools are required' });
    }

    // Generate audit with pricing snapshot
    const { input, output, pricingSnapshot } = generateAuditWithSnapshot({
      email,
      tools,
      usage,
    });

    // Save to database
    const savedAudit = await saveAudit({
      user_email: email,
      input_stack: input,
      output_result: output,
      pricing_snapshot: pricingSnapshot,
    });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    return res.status(200).json({
      success: true,
      auditId: savedAudit.id,
      result: output,
      shareUrl: `${appUrl}/audit/${savedAudit.id}`,
    });
  } catch (error: any) {
    console.error('Audit error:', error);
    return res.status(500).json({
      error: 'Failed to process audit',
      details: error.message,
    });
  }
}
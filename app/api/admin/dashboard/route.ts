// app/api/admin/dashboard/route.ts
// GET /api/admin/dashboard
// Returns audit count, emails sent, click-through rate.
// Protected by CRON_SECRET (same secret used for detect-changes).

import { NextRequest, NextResponse } from 'next/server';
import { getEmailStats, getRecentPricingChanges } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const auth = req.headers.get('authorization');
    if (auth !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  try {
    const [stats, recentChanges] = await Promise.all([
      getEmailStats(),
      getRecentPricingChanges(10),
    ]);

    return NextResponse.json({
      stats,
      recentPricingChanges: recentChanges,
      generatedAt: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('[admin/dashboard] error:', error);
    return NextResponse.json(
      { error: 'Failed to load stats', details: error.message },
      { status: 500 }
    );
  }
}
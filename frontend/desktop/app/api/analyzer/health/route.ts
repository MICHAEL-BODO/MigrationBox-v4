/**
 * MIKE-FIRST v6.0 — Health Monitor API
 * GET /api/analyzer/health     → Get service health statuses
 */

import { NextResponse } from 'next/server';
import { getPlatform } from '../../../../../../packages/core/src/platform';

export async function GET() {
  try {
    const platform = getPlatform();
    const analysis = platform.getLastAnalysis();

    if (!analysis) {
      return NextResponse.json({
        status: 'idle',
        message: 'No analysis data. Run analysis first (POST /api/analyzer/analyze).',
      });
    }

    const statuses = analysis.healthStatuses;
    const healthy = statuses.filter(s => s.status === 'healthy').length;
    const degraded = statuses.filter(s => s.status === 'degraded').length;
    const down = statuses.filter(s => s.status === 'down').length;

    return NextResponse.json({
      status: 'ok',
      healthScore: analysis.healthScore,
      summary: {
        total: statuses.length,
        healthy,
        degraded,
        down,
        unknown: statuses.filter(s => s.status === 'unknown').length,
      },
      services: statuses,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

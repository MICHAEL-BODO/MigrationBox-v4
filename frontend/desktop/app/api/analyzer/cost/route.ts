/**
 * MIKE-FIRST v6.0 — Cost Optimizer API
 * GET /api/analyzer/cost     → Get cost optimization recommendations
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

    const optimizations = analysis.optimizations;
    const totalSavings = optimizations.reduce((sum, o) => sum + o.savingsAnnual, 0);
    const totalCurrentCost = optimizations.reduce((sum, o) => sum + (o.currentCost * 12), 0);

    return NextResponse.json({
      status: 'ok',
      summary: {
        totalOptimizations: optimizations.length,
        totalAnnualSavings: totalSavings,
        totalCurrentAnnualCost: totalCurrentCost,
        savingsPercent: totalCurrentCost > 0 ? Math.round((totalSavings / totalCurrentCost) * 100) : 0,
        byCategory: {
          rightsizing: optimizations.filter(o => o.category === 'rightsizing').length,
          waste: optimizations.filter(o => o.category === 'waste').length,
          storage: optimizations.filter(o => o.category === 'storage').length,
          architecture: optimizations.filter(o => o.category === 'architecture').length,
          reserved: optimizations.filter(o => o.category === 'reserved').length,
          schedule: optimizations.filter(o => o.category === 'schedule').length,
        },
        autoApplicable: optimizations.filter(o => o.autoApplicable).length,
      },
      optimizations,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

/**
 * MIKE-FIRST v6.0 — Analyzer API
 * POST /api/analyzer/analyze   → Run full infrastructure analysis
 * GET  /api/analyzer/analyze   → Get last analysis results
 */

import { NextRequest, NextResponse } from 'next/server';
import { getPlatform } from '../../../../../../packages/core/src/platform';

export async function GET() {
  try {
    const platform = getPlatform();
    const lastAnalysis = platform.getLastAnalysis();

    if (!lastAnalysis) {
      return NextResponse.json({
        status: 'idle',
        message: 'No analysis data. POST to /api/analyzer/analyze to start.',
      });
    }

    return NextResponse.json({
      status: 'complete',
      analysis: {
        timestamp: lastAnalysis.timestamp,
        securityGrade: lastAnalysis.securityGrade,
        costSavingsDetected: lastAnalysis.costSavingsDetected,
        healthScore: lastAnalysis.healthScore,
        findings: lastAnalysis.findings.length,
        findingsBySeverity: {
          critical: lastAnalysis.findings.filter(f => f.severity === 'critical').length,
          high: lastAnalysis.findings.filter(f => f.severity === 'high').length,
          medium: lastAnalysis.findings.filter(f => f.severity === 'medium').length,
          low: lastAnalysis.findings.filter(f => f.severity === 'low').length,
        },
        optimizations: lastAnalysis.optimizations.map(o => ({
          id: o.id,
          title: o.title,
          description: o.description,
          currentCost: o.currentCost,
          optimizedCost: o.optimizedCost,
          savingsPercent: o.savingsPercent,
          savingsAnnual: o.savingsAnnual,
          category: o.category,
          risk: o.risk,
          effort: o.effort,
          autoApplicable: o.autoApplicable,
        })),
        healthStatuses: lastAnalysis.healthStatuses,
        attackSurface: lastAnalysis.attackSurface,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const platform = getPlatform();

    if (!platform.getLastScan()) {
      return NextResponse.json(
        { error: 'No scan data. Run a network scan first (POST /api/scan).' },
        { status: 400 }
      );
    }

    const result = await platform.runAnalysis();

    return NextResponse.json({
      status: 'complete',
      analysis: {
        timestamp: result.timestamp,
        securityGrade: result.securityGrade,
        costSavingsDetected: result.costSavingsDetected,
        healthScore: result.healthScore,
        totalFindings: result.findings.length,
        totalOptimizations: result.optimizations.length,
        totalHealthChecks: result.healthStatuses.length,
        attackSurface: {
          exposedPorts: result.attackSurface.totalExposedPorts,
          exposedServices: result.attackSurface.totalExposedServices,
          unencrypted: result.attackSurface.unencryptedServices,
          attackVectors: result.attackSurface.attackVectors.length,
          criticalExposures: result.attackSurface.criticalExposures,
        },
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

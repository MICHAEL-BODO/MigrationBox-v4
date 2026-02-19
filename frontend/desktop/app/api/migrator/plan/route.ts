/**
 * MIKE-FIRST v6.0 — Migration Plan API
 * POST /api/migrator/plan      → Build a migration plan
 * GET  /api/migrator/plan      → List all plans
 */

import { NextRequest, NextResponse } from 'next/server';
import { getPlatform } from '../../../../../../packages/core/src/platform';
import type { MigrationPlan, MigrationWave, MigrationResource } from '../../../../../../packages/core/src/cloud-provider';

export async function GET() {
  try {
    const platform = getPlatform();
    const plans = platform.listMigrationPlans();

    return NextResponse.json({
      status: 'ok',
      plans: plans.map(p => ({
        id: p.id,
        name: p.name,
        source: p.source,
        target: p.target,
        totalResources: p.totalResources,
        estimatedDuration: p.estimatedDuration,
        risk: p.risk,
        status: p.status,
        waves: p.waves.length,
        waveDetails: p.waves.map(w => ({
          id: w.id,
          name: w.name,
          resources: w.resources.length,
          status: w.status,
          estimatedDuration: w.estimatedDuration,
        })),
      })),
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

    let body: any = {};
    try { body = await req.json(); } catch {}

    const target = body.target || 'azure';
    const strategy = body.strategy || 'rehost';
    const targetRegion = body.targetRegion;

    const plan = platform.buildMigrationPlan(target, strategy, targetRegion);

    return NextResponse.json({
      status: 'created',
      plan: {
        id: plan.id,
        name: plan.name,
        source: plan.source,
        target: plan.target,
        totalResources: plan.totalResources,
        estimatedDuration: plan.estimatedDuration,
        risk: plan.risk,
        status: plan.status,
        waves: plan.waves.map(w => ({
          id: w.id,
          name: w.name,
          order: w.order,
          resourceCount: w.resources.length,
          estimatedDuration: w.estimatedDuration,
          resources: w.resources.map(r => ({
            id: r.id,
            source: {
              name: r.sourceResource.name,
              type: r.sourceResource.type,
              ip: r.sourceResource.ip,
              os: r.sourceResource.os,
            },
            target: r.targetConfig,
            status: r.status,
          })),
        })),
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

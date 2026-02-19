/**
 * MIKE-FIRST v6.0 — Migration Execution API
 * POST /api/migrator/execute    → Execute a migration plan
 * GET  /api/migrator/execute    → List executions
 */

import { NextRequest, NextResponse } from 'next/server';
import { getPlatform } from '../../../../../../packages/core/src/platform';

export async function GET() {
  try {
    const platform = getPlatform();
    const executions = platform.listMigrationExecutions();

    return NextResponse.json({
      status: 'ok',
      executions: executions.map(e => ({
        id: e.id,
        planId: e.planId,
        status: e.status,
        startedAt: e.startedAt,
        completedAt: e.completedAt,
        currentWave: e.currentWave,
        totalWaves: e.totalWaves,
        progress: e.progress,
        metrics: e.metrics,
        recentLogs: e.logs.slice(-20),
      })),
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const platform = getPlatform();

    let body: any = {};
    try { body = await req.json(); } catch {}

    const planId = body.planId;
    if (!planId) {
      return NextResponse.json(
        { error: 'planId is required. Build a plan first (POST /api/migrator/plan).' },
        { status: 400 }
      );
    }

    const dryRun = body.dryRun ?? true; // Default to dry run for safety
    const logs: any[] = [];

    const execution = await platform.executeMigration(planId, dryRun, (log) => {
      logs.push(log);
    });

    return NextResponse.json({
      status: 'complete',
      execution: {
        id: execution.id,
        planId: execution.planId,
        status: execution.status,
        startedAt: execution.startedAt,
        completedAt: execution.completedAt,
        progress: execution.progress,
        metrics: execution.metrics,
        logs: execution.logs,
        dryRun,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

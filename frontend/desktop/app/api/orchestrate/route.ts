/**
 * MIKE-FIRST v6.0 — Orchestration API
 * POST /api/orchestrate     → Start full orchestration run
 * GET  /api/orchestrate     → List orchestration runs
 */

import { NextRequest, NextResponse } from 'next/server';
import { OrchestrationService } from '../../../../../services/orchestration/orchestration-service';

const orchestrator = new OrchestrationService();

export async function GET() {
  try {
    const runs = orchestrator.listRuns();
    return NextResponse.json({
      status: 'ok',
      runs: runs.map(r => ({
        id: r.id,
        status: r.status,
        startedAt: r.startedAt,
        completedAt: r.completedAt,
        totalDuration: r.totalDuration,
        steps: r.steps.map(s => ({
          id: s.id,
          name: s.name,
          status: s.status,
          duration: s.duration,
        })),
      })),
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    let body: any = {};
    try { body = await req.json(); } catch {}

    const run = await orchestrator.startRun(
      body.planId,
      {
        dryRun: body.dryRun ?? true,
        skipSteps: body.skipSteps,
      },
    );

    return NextResponse.json({
      status: 'complete',
      run: {
        id: run.id,
        status: run.status,
        startedAt: run.startedAt,
        completedAt: run.completedAt,
        totalDuration: run.totalDuration,
        steps: run.steps,
        metadata: run.metadata,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

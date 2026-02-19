/**
 * MIKE-FIRST v6.0 — Guardian Agent API
 * POST /api/auditor/guardian   → Start/Stop Guardian
 * GET  /api/auditor/guardian   → Get Guardian status & events
 */

import { NextRequest, NextResponse } from 'next/server';
import { getPlatform } from '../../../../../../packages/core/src/platform';

export async function GET() {
  try {
    const platform = getPlatform();
    const state = platform.getState();

    return NextResponse.json({
      active: state.guardianActive,
      events: platform.getGuardianEvents(50),
      stats: platform.getGuardianStats(),
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

    const action = body.action || 'toggle';

    if (action === 'start') {
      platform.startGuardian();
      return NextResponse.json({ status: 'started', message: 'Guardian Agent activated' });
    } else if (action === 'stop') {
      platform.stopGuardian();
      return NextResponse.json({ status: 'stopped', message: 'Guardian Agent deactivated' });
    } else {
      // Toggle
      if (platform.getState().guardianActive) {
        platform.stopGuardian();
        return NextResponse.json({ status: 'stopped', message: 'Guardian Agent deactivated' });
      } else {
        platform.startGuardian();
        return NextResponse.json({ status: 'started', message: 'Guardian Agent activated' });
      }
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

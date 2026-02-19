/**
 * MIKE-FIRST v6.0 — Reports API
 * GET  /api/auditor/reports     → Get generated compliance reports
 */

import { NextResponse } from 'next/server';
import { getPlatform } from '../../../../../../packages/core/src/platform';

export async function GET() {
  try {
    const platform = getPlatform();
    const lastAudit = platform.getLastAudit();
    const lastScan = platform.getLastScan();

    if (!lastAudit) {
      return NextResponse.json({
        status: 'idle',
        reports: [],
        message: 'No audit data. Run an audit first (POST /api/auditor/audit).',
      });
    }

    // Generate executive summary report
    const criticals = lastAudit.totalFindings.filter(f => f.severity === 'critical');
    const highs = lastAudit.totalFindings.filter(f => f.severity === 'high');
    const totalHosts = lastScan?.hosts?.length || 0;
    
    const reports = [
      {
        id: 'executive-summary',
        title: 'Executive Compliance Summary',
        type: 'executive',
        generatedAt: lastAudit.timestamp,
        data: {
          overallGrade: lastAudit.grade,
          overallScore: lastAudit.overallScore,
          totalFindings: lastAudit.totalFindings.length,
          criticalFindings: criticals.length,
          highFindings: highs.length,
          hostsScanned: totalHosts,
          estimatedFinesAvoided: lastAudit.estimatedFinesAvoided,
          frameworkScores: lastAudit.frameworks.map(fw => ({
            framework: fw.framework,
            score: fw.score,
            grade: scoreToGrade(fw.score),
            passingControls: fw.passingControls,
            totalControls: fw.totalControls,
            failingControls: fw.failingControls,
          })),
          topFindings: criticals.concat(highs).slice(0, 10).map(f => ({
            severity: f.severity,
            title: f.title,
            resource: f.resource,
            framework: f.framework,
            remediation: f.remediation,
            autoFixAvailable: f.autoFixAvailable,
          })),
        },
      },
      ...lastAudit.frameworks.map(fw => ({
        id: `framework-${fw.framework.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
        title: `${fw.framework} Compliance Report`,
        type: 'framework',
        generatedAt: fw.scannedAt,
        data: {
          framework: fw.framework,
          score: fw.score,
          grade: scoreToGrade(fw.score),
          totalControls: fw.totalControls,
          passingControls: fw.passingControls,
          failingControls: fw.failingControls,
          warnings: fw.warnings,
          findings: fw.findings.map(f => ({
            severity: f.severity,
            title: f.title,
            description: f.description,
            resource: f.resource,
            control: f.control,
            remediation: f.remediation,
            autoFixAvailable: f.autoFixAvailable,
          })),
        },
      })),
      {
        id: 'remediation-plan',
        title: 'Prioritized Remediation Plan',
        type: 'remediation',
        generatedAt: lastAudit.timestamp,
        data: {
          totalItems: lastAudit.remediationPlan.length,
          automatableItems: lastAudit.remediationPlan.filter(r => r.automatable).length,
          plan: lastAudit.remediationPlan.map(r => ({
            priority: r.priority,
            severity: r.finding.severity,
            title: r.finding.title,
            resource: r.finding.resource,
            framework: r.finding.framework,
            estimatedEffort: r.estimatedEffort,
            automatable: r.automatable,
            script: r.script,
            remediation: r.finding.remediation,
          })),
        },
      },
    ];

    return NextResponse.json({
      status: 'ok',
      auditId: lastAudit.id,
      reportCount: reports.length,
      reports,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

function scoreToGrade(score: number): string {
  if (score >= 95) return 'A+';
  if (score >= 90) return 'A';
  if (score >= 85) return 'A-';
  if (score >= 80) return 'B+';
  if (score >= 75) return 'B';
  if (score >= 70) return 'B-';
  if (score >= 65) return 'C+';
  if (score >= 60) return 'C';
  if (score >= 50) return 'D';
  return 'F';
}

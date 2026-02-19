/**
 * MIKE-FIRST v6.0 — Core Package
 * 
 * Enterprise-grade cloud migration platform core.
 * Provides unified abstractions for all 3 pillars:
 *   - Auditor: Compliance scanning, Guardian agent, Reports
 *   - Analyzer: Cost optimization, Security scanning, Health monitoring
 *   - Migrator: Discovery, Plan building, Migration execution
 */

// Cloud abstraction layer
export * from './cloud-provider';

// Scanners
export { OnPremNetworkScanner } from './scanners/network-scanner';
export type { NetworkScanConfig, DiscoveredHost, PortResult, DetectedService } from './scanners/network-scanner';

// Engines
export { AuditorEngine } from './engines/auditor-engine';
export type { AuditResult, RemediationItem, GuardianEvent, ComplianceFramework } from './engines/auditor-engine';

export { AnalyzerEngine } from './engines/analyzer-engine';
export type { AnalysisResult, AttackSurfaceReport, AttackVector, RightSizingRecommendation } from './engines/analyzer-engine';

export { MigratorEngine } from './engines/migrator-engine';
export type {
  MigrationConfig, MigrationStrategy, PlanBuilderInput,
  MigrationExecution, ExecutionLog, ExecutionMetrics
} from './engines/migrator-engine';

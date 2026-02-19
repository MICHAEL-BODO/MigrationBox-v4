/**
 * MIKE-FIRST v6.0 — Platform Orchestrator
 * 
 * Singleton that manages the lifecycle of all engines.
 * Called by Next.js API routes to coordinate scanning,
 * auditing, analyzing, and migrating.
 */

import { OnPremNetworkScanner } from './scanners/network-scanner';
import type { DiscoveredHost, NetworkScanConfig } from './scanners/network-scanner';
import { AuditorEngine } from './engines/auditor-engine';
import type { AuditResult, GuardianEvent, ComplianceFramework } from './engines/auditor-engine';
import { AnalyzerEngine } from './engines/analyzer-engine';
import type { AnalysisResult } from './engines/analyzer-engine';
import { MigratorEngine } from './engines/migrator-engine';
import type { MigrationPlan, MigrationConfig, MigrationExecution, ExecutionLog } from './engines/migrator-engine';
import type { CloudResource, CloudProviderType, OperatingMode } from './cloud-provider';

// ─── Types ───────────────────────────────────────────────────────────

export interface PlatformState {
  mode: OperatingMode;
  initialized: boolean;
  scanInProgress: boolean;
  lastScan?: {
    timestamp: string;
    hosts: DiscoveredHost[];
    duration: number;
  };
  lastAudit?: AuditResult;
  lastAnalysis?: AnalysisResult;
  activeMigration?: MigrationExecution;
  guardianActive: boolean;
}

// ─── Platform Orchestrator (Singleton) ───────────────────────────────

class PlatformOrchestrator {
  private scanner: OnPremNetworkScanner;
  private auditor: AuditorEngine;
  private analyzer: AnalyzerEngine;
  private migrator: MigratorEngine;
  private state: PlatformState;
  private scanListeners: ((msg: string) => void)[] = [];

  constructor() {
    this.scanner = new OnPremNetworkScanner();
    this.auditor = new AuditorEngine();
    this.analyzer = new AnalyzerEngine();
    this.migrator = new MigratorEngine();
    this.state = {
      mode: (process.env.MIKE_FIRST_MODE as OperatingMode) || 'demo',
      initialized: false,
      scanInProgress: false,
      guardianActive: false,
    };
  }

  // ─── Initialization ─────────────────────────────────────────────

  initialize(config?: Partial<NetworkScanConfig>): void {
    if (config) {
      this.scanner = new OnPremNetworkScanner(config);
    }
    this.state.initialized = true;
  }

  getState(): PlatformState {
    return { ...this.state };
  }

  getMode(): OperatingMode {
    return this.state.mode;
  }

  setMode(mode: OperatingMode): void {
    this.state.mode = mode;
  }

  // ─── Network Discovery ─────────────────────────────────────────

  async startNetworkScan(
    config?: Partial<NetworkScanConfig>,
    onProgress?: (msg: string) => void,
  ): Promise<DiscoveredHost[]> {
    if (this.state.scanInProgress) {
      throw new Error('Scan already in progress');
    }

    if (config) {
      this.scanner = new OnPremNetworkScanner(config);
    }

    this.state.scanInProgress = true;
    const startTime = Date.now();

    try {
      const hosts = await this.scanner.scan(onProgress);
      
      this.state.lastScan = {
        timestamp: new Date().toISOString(),
        hosts,
        duration: Math.round((Date.now() - startTime) / 1000),
      };

      return hosts;
    } finally {
      this.state.scanInProgress = false;
    }
  }

  getLastScan() {
    return this.state.lastScan;
  }

  getNetworkInfo() {
    return this.scanner.getLocalNetworkInfo();
  }

  // ─── Auditor ────────────────────────────────────────────────────

  async runAudit(
    frameworks?: ComplianceFramework[],
    onProgress?: (phase: string, percent: number) => void,
  ): Promise<AuditResult> {
    const hosts = this.state.lastScan?.hosts;
    if (!hosts || hosts.length === 0) {
      throw new Error('No scan data available. Run a network scan first.');
    }

    const result = await this.auditor.runOneClickAudit(hosts, [], frameworks, onProgress);
    this.state.lastAudit = result;
    return result;
  }

  getLastAudit(): AuditResult | undefined {
    return this.state.lastAudit;
  }

  // Guardian Agent
  startGuardian(): void {
    this.auditor.startGuardian();
    this.state.guardianActive = true;
  }

  stopGuardian(): void {
    this.auditor.stopGuardian();
    this.state.guardianActive = false;
  }

  getGuardianEvents(limit?: number): GuardianEvent[] {
    return this.auditor.getGuardianEvents(limit);
  }

  getGuardianStats() {
    return this.auditor.getGuardianStats();
  }

  // ─── Analyzer ───────────────────────────────────────────────────

  async runAnalysis(
    onProgress?: (phase: string, percent: number) => void,
  ): Promise<AnalysisResult> {
    const hosts = this.state.lastScan?.hosts;
    if (!hosts || hosts.length === 0) {
      throw new Error('No scan data available. Run a network scan first.');
    }

    const result = await this.analyzer.analyze(hosts, [], onProgress);
    this.state.lastAnalysis = result;
    return result;
  }

  getLastAnalysis(): AnalysisResult | undefined {
    return this.state.lastAnalysis;
  }

  // ─── Migrator ───────────────────────────────────────────────────

  buildMigrationPlan(
    target: CloudProviderType = 'azure',
    strategy: MigrationConfig['strategy'] = 'rehost',
    targetRegion?: string,
  ): MigrationPlan {
    const hosts = this.state.lastScan?.hosts;
    if (!hosts || hosts.length === 0) {
      throw new Error('No scan data available. Run a network scan first.');
    }

    const config: MigrationConfig = {
      source: 'onprem',
      target,
      targetRegion: targetRegion || (target === 'azure' ? 'westeurope' : 'europe-west4'),
      strategy,
      dryRun: false,
      parallelWaves: false,
      autoValidate: true,
      autoRollback: true,
      rollbackThreshold: 30,
    };

    return this.migrator.buildPlan({
      hosts,
      resources: [],
      config,
    });
  }

  async executeMigration(
    planId: string,
    dryRun = false,
    onProgress?: (log: ExecutionLog) => void,
  ): Promise<MigrationExecution> {
    const plan = this.migrator.getPlan(planId);
    if (!plan) throw new Error(`Plan ${planId} not found`);

    const config: MigrationConfig = {
      source: plan.source,
      target: plan.target,
      targetRegion: plan.target === 'azure' ? 'westeurope' : 'europe-west4',
      strategy: 'rehost',
      dryRun,
      parallelWaves: false,
      autoValidate: true,
      autoRollback: true,
      rollbackThreshold: 30,
    };

    const execution = await this.migrator.execute(planId, config, onProgress);
    this.state.activeMigration = execution;
    return execution;
  }

  getMigrationPlan(planId: string): MigrationPlan | undefined {
    return this.migrator.getPlan(planId);
  }

  getMigrationExecution(executionId: string): MigrationExecution | undefined {
    return this.migrator.getExecution(executionId);
  }

  listMigrationPlans(): MigrationPlan[] {
    return this.migrator.listPlans();
  }

  listMigrationExecutions(): MigrationExecution[] {
    return this.migrator.listExecutions();
  }
}

// ─── Singleton Export ────────────────────────────────────────────────

let instance: PlatformOrchestrator | null = null;

export function getPlatform(): PlatformOrchestrator {
  if (!instance) {
    instance = new PlatformOrchestrator();
  }
  return instance;
}

export function resetPlatform(): void {
  instance = null;
}

/**
 * MigrationBox V5.0 - Discovery Orchestrator
 * 
 * Coordinates all scanners across layers 1-7.
 * Manages execution order, progress tracking, and result aggregation.
 */

import { EventEmitter } from 'events';
import { ScannerRegistry, ScanContext, ScanLogger, IScanner } from './scanner-registry';
import {
  DiscoverySession,
  DiscoverySummary,
  ScannerConfig,
  ScanResult,
} from '../onprem/types/onprem-types';
import { v4 as uuidv4 } from 'uuid';

export interface OrchestratorConfig {
  tenantId: string;
  scanners: ScannerConfig[];
  /** Maximum concurrent scanners within the same layer */
  concurrency?: number;
  /** Overall timeout in seconds */
  timeoutSeconds?: number;
}

export class DiscoveryOrchestrator {
  private registry: ScannerRegistry;
  private events: EventEmitter;
  private activeSessions: Map<string, DiscoverySession> = new Map();
  private logger: ScanLogger;

  constructor(registry: ScannerRegistry, logger?: ScanLogger) {
    this.registry = registry;
    this.events = new EventEmitter();
    this.logger = logger || this.createDefaultLogger();
  }

  /**
   * Start a new discovery session. Runs all enabled scanners in layer order.
   */
  async startDiscovery(config: OrchestratorConfig): Promise<DiscoverySession> {
    const sessionId = `session-${uuidv4()}`;
    const session: DiscoverySession = {
      sessionId,
      tenantId: config.tenantId,
      startedAt: new Date().toISOString(),
      status: 'running',
      scanners: config.scanners,
      results: [],
    };

    this.activeSessions.set(sessionId, session);
    this.events.emit('session:start', { sessionId, tenantId: config.tenantId });

    const abortController = new AbortController();
    let timeoutHandle: ReturnType<typeof setTimeout> | undefined;

    if (config.timeoutSeconds) {
      timeoutHandle = setTimeout(() => {
        abortController.abort();
      }, config.timeoutSeconds * 1000);
    }

    try {
      // Get enabled scanner IDs
      const enabledIds = config.scanners
        .filter(s => s.enabled)
        .map(s => s.type);

      // Get execution order from registry
      const executionOrder = this.registry.getExecutionOrder(enabledIds);

      // Build context with shared result store
      const previousResults = new Map<string, ScanResult>();
      const context: ScanContext = {
        sessionId,
        tenantId: config.tenantId,
        previousResults,
        events: this.events,
        log: this.logger,
        signal: abortController.signal,
      };

      // Execute by layer (parallel within layer, sequential across layers)
      const layers = this.groupByLayer(executionOrder);

      for (const [layer, scanners] of layers) {
        if (abortController.signal.aborted) break;

        this.logger.info(`Executing Layer ${layer}`, {
          scanners: scanners.map(s => s.name),
        });
        this.events.emit('layer:start', { layer, scannerCount: scanners.length });

        const concurrency = config.concurrency || 3;
        const results = await this.executeParallel(scanners, config, context, concurrency);

        // Store results for subsequent scanners to reference
        for (const result of results) {
          previousResults.set(result.scannerId, result);
          session.results.push(result);
        }

        this.events.emit('layer:complete', {
          layer,
          successCount: results.filter(r => r.status === 'success').length,
          failedCount: results.filter(r => r.status === 'failed').length,
        });
      }

      session.status = 'completed';
      session.completedAt = new Date().toISOString();
      session.summary = this.buildSummary(session);

    } catch (error) {
      session.status = 'failed';
      session.completedAt = new Date().toISOString();
      this.logger.error('Discovery session failed', { error: String(error) });
    } finally {
      if (timeoutHandle) clearTimeout(timeoutHandle);
      this.events.emit('session:complete', {
        sessionId,
        status: session.status,
        duration: session.completedAt
          ? new Date(session.completedAt).getTime() - new Date(session.startedAt).getTime()
          : 0,
      });
    }

    return session;
  }

  /**
   * Get active session status.
   */
  getSession(sessionId: string): DiscoverySession | undefined {
    return this.activeSessions.get(sessionId);
  }

  /**
   * Cancel an active session.
   */
  async cancelSession(sessionId: string): Promise<void> {
    const session = this.activeSessions.get(sessionId);
    if (!session) throw new Error(`Session not found: ${sessionId}`);

    // Cancel all running scanners
    const enabledIds = session.scanners.filter(s => s.enabled).map(s => s.type);
    for (const id of enabledIds) {
      const scanner = this.registry.get(id);
      if (scanner) await scanner.cancel();
    }

    session.status = 'failed';
    session.completedAt = new Date().toISOString();
    this.events.emit('session:cancelled', { sessionId });
  }

  /**
   * Subscribe to orchestrator events.
   */
  on(event: string, listener: (...args: any[]) => void): void {
    this.events.on(event, listener);
  }

  // ──────────────────────────────────────────
  // Private helpers
  // ──────────────────────────────────────────

  private groupByLayer(scanners: IScanner[]): Map<number, IScanner[]> {
    const map = new Map<number, IScanner[]>();
    for (const s of scanners) {
      const arr = map.get(s.layer) || [];
      arr.push(s);
      map.set(s.layer, arr);
    }
    // Sort by layer key
    return new Map([...map.entries()].sort(([a], [b]) => a - b));
  }

  private async executeParallel(
    scanners: IScanner[],
    config: OrchestratorConfig,
    context: ScanContext,
    concurrency: number,
  ): Promise<ScanResult[]> {
    const results: ScanResult[] = [];
    const chunks = this.chunk(scanners, concurrency);

    for (const chunk of chunks) {
      const promises = chunk.map(async (scanner) => {
        const scannerConfig = config.scanners.find(s => s.type === scanner.id) || {
          id: scanner.id,
          type: scanner.id,
          enabled: true,
        };
        return scanner.scan(scannerConfig, context);
      });

      const chunkResults = await Promise.allSettled(promises);
      for (const result of chunkResults) {
        if (result.status === 'fulfilled') {
          results.push(result.value);
        } else {
          results.push({
            scannerId: 'unknown',
            scannerType: 'unknown',
            startedAt: new Date().toISOString(),
            completedAt: new Date().toISOString(),
            durationMs: 0,
            status: 'failed',
            data: {},
            errors: [{ target: 'scanner', message: String(result.reason), recoverable: false }],
            stats: { itemsDiscovered: 0, itemsUpdated: 0, itemsFailed: 1 },
          });
        }
      }
    }

    return results;
  }

  private buildSummary(session: DiscoverySession): DiscoverySummary {
    // Aggregate stats from all scanner results
    let totalHosts = 0;
    let totalVMs = 0;
    let totalContainers = 0;
    let totalDatabases = 0;
    let totalApplications = 0;
    let totalDependencies = 0;
    let networkDevices = 0;

    for (const result of session.results) {
      const stats = result.stats;
      if (result.scannerId === 'network-scanner') totalHosts += stats.itemsDiscovered;
      if (result.scannerId === 'vmware-scanner') totalVMs += stats.itemsDiscovered;
      if (result.scannerId === 'hyperv-scanner') totalVMs += stats.itemsDiscovered;
      if (result.scannerId === 'kvm-scanner') totalVMs += stats.itemsDiscovered;
      if (result.scannerId === 'kubernetes-scanner') totalContainers += stats.itemsDiscovered;
      if (result.scannerId === 'snmp-scanner') networkDevices += stats.itemsDiscovered;
      if (result.scannerId === 'app-fingerprinter') {
        totalDatabases += stats.itemsDiscovered;
        totalApplications += stats.itemsDiscovered;
      }
      if (result.scannerId === 'dependency-reconstructor') {
        totalDependencies += stats.itemsDiscovered;
      }
    }

    return {
      totalHosts,
      totalVMs,
      totalContainers,
      totalDatabases,
      totalApplications,
      totalDependencies,
      networkDevices,
      migrationReadiness: { rehost: 0, replatform: 0, refactor: 0, retire: 0, retain: 0 },
      estimatedCost: { onPremAnnual: 0, cloudAnnual: 0, savings: 0 },
    };
  }

  private chunk<T>(arr: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < arr.length; i += size) {
      chunks.push(arr.slice(i, i + size));
    }
    return chunks;
  }

  private createDefaultLogger(): ScanLogger {
    const ts = () => new Date().toISOString();
    return {
      info: (msg, meta) => console.log(`[${ts()}] INFO  ${msg}`, meta || ''),
      warn: (msg, meta) => console.warn(`[${ts()}] WARN  ${msg}`, meta || ''),
      error: (msg, meta) => console.error(`[${ts()}] ERROR ${msg}`, meta || ''),
      debug: (msg, meta) => console.debug(`[${ts()}] DEBUG ${msg}`, meta || ''),
    };
  }
}

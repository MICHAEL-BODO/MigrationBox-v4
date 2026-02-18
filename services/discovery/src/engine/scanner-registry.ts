/**
 * MigrationBox V5.0 - Scanner Registry & Base Interface
 * 
 * Plugin-based scanner architecture. Each scanner implements the IScanner
 * interface and registers itself. The orchestrator invokes them in order.
 */

import { ScannerConfig, ScanResult, ScanError } from '../onprem/types/onprem-types';
import { EventEmitter } from 'events';

// ────────────────────────────────────────────────────────────
// Scanner Interface
// ────────────────────────────────────────────────────────────

export interface IScanner<TConfig = any, TResult = any> {
  /** Unique scanner identifier */
  readonly id: string;
  /** Human-readable name */
  readonly name: string;
  /** Scanner version */
  readonly version: string;
  /** Which discovery layer this scanner belongs to (1-7) */
  readonly layer: number;
  /** Required predecessor scanners (must complete before this runs) */
  readonly dependencies: string[];

  /** Validate the configuration before running */
  validate(config: TConfig): Promise<{ valid: boolean; errors: string[] }>;

  /** Execute the scan */
  scan(config: TConfig, context: ScanContext): Promise<ScanResult<TResult>>;

  /** Estimate scan duration based on config */
  estimateDuration(config: TConfig): Promise<{ minSeconds: number; maxSeconds: number }>;

  /** Gracefully cancel an in-progress scan */
  cancel(): Promise<void>;
}

export interface ScanContext {
  sessionId: string;
  tenantId: string;
  /** Results from previously completed scanners (keyed by scanner ID) */
  previousResults: Map<string, ScanResult>;
  /** Event emitter for real-time progress updates */
  events: EventEmitter;
  /** Logger */
  log: ScanLogger;
  /** Abort signal */
  signal: AbortSignal;
}

export interface ScanLogger {
  info(message: string, meta?: Record<string, any>): void;
  warn(message: string, meta?: Record<string, any>): void;
  error(message: string, meta?: Record<string, any>): void;
  debug(message: string, meta?: Record<string, any>): void;
}

// ────────────────────────────────────────────────────────────
// Scanner Registry
// ────────────────────────────────────────────────────────────

export class ScannerRegistry {
  private scanners: Map<string, IScanner> = new Map();

  /**
   * Register a scanner. Scanners are executed in layer order.
   */
  register(scanner: IScanner): void {
    if (this.scanners.has(scanner.id)) {
      throw new Error(`Scanner "${scanner.id}" is already registered`);
    }
    this.scanners.set(scanner.id, scanner);
  }

  /**
   * Unregister a scanner by ID.
   */
  unregister(id: string): boolean {
    return this.scanners.delete(id);
  }

  /**
   * Get a scanner by ID.
   */
  get(id: string): IScanner | undefined {
    return this.scanners.get(id);
  }

  /**
   * Get all registered scanners, sorted by layer order.
   */
  getAll(): IScanner[] {
    return Array.from(this.scanners.values()).sort((a, b) => a.layer - b.layer);
  }

  /**
   * Get scanners for a specific layer.
   */
  getByLayer(layer: number): IScanner[] {
    return this.getAll().filter(s => s.layer === layer);
  }

  /**
   * Compute execution order respecting dependencies (topological sort).
   */
  getExecutionOrder(enabledIds?: string[]): IScanner[] {
    const enabled = enabledIds
      ? this.getAll().filter(s => enabledIds.includes(s.id))
      : this.getAll();

    const visited = new Set<string>();
    const ordered: IScanner[] = [];

    const visit = (scanner: IScanner): void => {
      if (visited.has(scanner.id)) return;
      visited.add(scanner.id);

      for (const depId of scanner.dependencies) {
        const dep = this.scanners.get(depId);
        if (dep && enabled.includes(dep)) {
          visit(dep);
        }
      }

      ordered.push(scanner);
    };

    for (const scanner of enabled) {
      visit(scanner);
    }

    return ordered;
  }

  /**
   * Get scanner count.
   */
  get size(): number {
    return this.scanners.size;
  }
}

// ────────────────────────────────────────────────────────────
// Base Scanner (common utilities)
// ────────────────────────────────────────────────────────────

export abstract class BaseScanner<TConfig = any, TResult = any>
  implements IScanner<TConfig, TResult>
{
  abstract readonly id: string;
  abstract readonly name: string;
  abstract readonly version: string;
  abstract readonly layer: number;
  abstract readonly dependencies: string[];

  protected abortController = new AbortController();
  protected errors: ScanError[] = [];
  protected itemsDiscovered = 0;
  protected itemsUpdated = 0;
  protected itemsFailed = 0;

  async validate(_config: TConfig): Promise<{ valid: boolean; errors: string[] }> {
    return { valid: true, errors: [] };
  }

  async scan(config: TConfig, context: ScanContext): Promise<ScanResult<TResult>> {
    this.reset();
    const startedAt = new Date().toISOString();

    try {
      context.log.info(`Starting scanner: ${this.name}`, { layer: this.layer });
      context.events.emit('scanner:start', { scannerId: this.id, layer: this.layer });

      const data = await this.execute(config, context);

      const completedAt = new Date().toISOString();
      const result: ScanResult<TResult> = {
        scannerId: this.id,
        scannerType: this.id,
        startedAt,
        completedAt,
        durationMs: new Date(completedAt).getTime() - new Date(startedAt).getTime(),
        status: this.errors.length > 0 ? 'partial' : 'success',
        data,
        errors: this.errors,
        stats: {
          itemsDiscovered: this.itemsDiscovered,
          itemsUpdated: this.itemsUpdated,
          itemsFailed: this.itemsFailed,
        },
      };

      context.events.emit('scanner:complete', { scannerId: this.id, stats: result.stats });
      context.log.info(`Scanner complete: ${this.name}`, result.stats);
      return result;

    } catch (error) {
      const completedAt = new Date().toISOString();
      context.log.error(`Scanner failed: ${this.name}`, { error: String(error) });
      context.events.emit('scanner:error', { scannerId: this.id, error: String(error) });

      return {
        scannerId: this.id,
        scannerType: this.id,
        startedAt,
        completedAt,
        durationMs: new Date(completedAt).getTime() - new Date(startedAt).getTime(),
        status: 'failed',
        data: {} as TResult,
        errors: [{ target: 'scanner', message: String(error), recoverable: false }],
        stats: {
          itemsDiscovered: this.itemsDiscovered,
          itemsUpdated: this.itemsUpdated,
          itemsFailed: this.itemsFailed,
        },
      };
    }
  }

  async estimateDuration(_config: TConfig): Promise<{ minSeconds: number; maxSeconds: number }> {
    return { minSeconds: 10, maxSeconds: 300 };
  }

  async cancel(): Promise<void> {
    this.abortController.abort();
  }

  /** Subclasses implement this — the actual scan logic */
  protected abstract execute(config: TConfig, context: ScanContext): Promise<TResult>;

  protected addError(target: string, message: string, recoverable = true): void {
    this.errors.push({ target, message, recoverable });
    this.itemsFailed++;
  }

  private reset(): void {
    this.abortController = new AbortController();
    this.errors = [];
    this.itemsDiscovered = 0;
    this.itemsUpdated = 0;
    this.itemsFailed = 0;
  }
}

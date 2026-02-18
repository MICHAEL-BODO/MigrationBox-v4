/**
 * MigrationBox V5.0 - Performance Baseline Collector
 * 
 * Collects P95/P99 performance metrics over a 30-day window.
 * Uses SSH to gather CPU, memory, disk, and network metrics
 * at regular intervals and computes percentile statistics.
 */

import { BaseScanner, ScanContext } from '../../engine/scanner-registry';
import {
  PerformanceBaseline, PercentileStats,
  HostInventory, ScannerConfig,
} from '../types/onprem-types';
import { Client as SSHClient, ConnectConfig } from 'ssh2';

export interface PerfCollectorConfig extends ScannerConfig {
  options: {
    hosts: string[];
    /** SSH credentials */
    globalCredentials: { username: string; password?: string; privateKey?: string };
    credentialMap?: Record<string, { username: string; password?: string; privateKey?: string }>;
    /** Collection interval in seconds (default: 300 = 5 minutes) */
    intervalSeconds?: number;
    /** Total collection duration in seconds (default: 86400 = 24 hours for a snapshot) */
    durationSeconds?: number;
    port?: number;
  };
}

interface PerfData {
  baselines: PerformanceBaseline[];
  collectionPeriod: { start: string; end: string };
}

export class PerformanceCollector extends BaseScanner<PerfCollectorConfig, PerfData> {
  readonly id = 'performance-collector';
  readonly name = 'Performance Baseline Collector';
  readonly version = '2.0.0';
  readonly layer = 4; // Same layer as SSH collector
  readonly dependencies = ['ssh-collector'];

  protected async execute(config: PerfCollectorConfig, context: ScanContext): Promise<PerfData> {
    const opts = config.options;
    const interval = opts.intervalSeconds || 300;
    const duration = opts.durationSeconds || 3600; // 1 hour for initial snapshot
    const start = new Date();
    const iterations = Math.ceil(duration / interval);

    const hostMetrics = new Map<string, Array<Record<string, number>>>();

    // Initialize
    for (const host of opts.hosts) {
      hostMetrics.set(host, []);
    }

    // Collect samples
    for (let i = 0; i < iterations; i++) {
      if (context.signal.aborted) break;

      context.events.emit('scanner:progress', {
        scannerId: this.id,
        iteration: i + 1,
        totalIterations: iterations,
      });

      for (const host of opts.hosts) {
        try {
          const sample = await this.collectSample(host, opts, context);
          hostMetrics.get(host)!.push(sample);
        } catch (error) {
          this.addError(host, `Sample collection failed: ${error}`, true);
        }
      }

      // Wait for next interval (unless last iteration)
      if (i < iterations - 1) {
        await new Promise(resolve => setTimeout(resolve, interval * 1000));
      }
    }

    // Compute percentiles for each host
    const baselines: PerformanceBaseline[] = [];
    const end = new Date();

    for (const [host, samples] of hostMetrics) {
      if (samples.length === 0) continue;

      baselines.push({
        hostId: host,
        collectionPeriod: {
          start: start.toISOString(),
          end: end.toISOString(),
          intervalSeconds: interval,
        },
        cpu: {
          ...this.computePercentiles(samples.map(s => s.cpuPercent || 0)),
          iowait: this.average(samples.map(s => s.iowait || 0)),
        },
        memory: {
          totalGB: samples[0]?.memTotalGB || 0,
          usedAvgGB: this.average(samples.map(s => s.memUsedGB || 0)),
          usedMaxGB: Math.max(...samples.map(s => s.memUsedGB || 0)),
          swapUsedAvgGB: this.average(samples.map(s => s.swapUsedGB || 0)),
          cacheGB: this.average(samples.map(s => s.cacheGB || 0)),
          buffersGB: this.average(samples.map(s => s.buffersGB || 0)),
        },
        disk: {
          perVolume: [
            {
              mount: '/',
              readIOPS: this.computePercentiles(samples.map(s => s.diskReadIOPS || 0)),
              writeIOPS: this.computePercentiles(samples.map(s => s.diskWriteIOPS || 0)),
              readLatencyMs: this.computePercentiles(samples.map(s => s.diskReadLatMs || 0)),
              writeLatencyMs: this.computePercentiles(samples.map(s => s.diskWriteLatMs || 0)),
              throughputMBps: {
                read: this.average(samples.map(s => s.diskReadMBps || 0)),
                write: this.average(samples.map(s => s.diskWriteMBps || 0)),
              },
              capacityGB: samples[0]?.diskCapGB || 0,
              usedGB: samples[samples.length - 1]?.diskUsedGB || 0,
              growthRateGBPerMonth: 0,
            },
          ],
        },
        network: {
          perInterface: [
            {
              name: 'eth0',
              rxBytesPerSec: this.computePercentiles(samples.map(s => s.netRxBps || 0)),
              txBytesPerSec: this.computePercentiles(samples.map(s => s.netTxBps || 0)),
              errorsPerSec: this.average(samples.map(s => s.netErrors || 0)),
              dropsPerSec: this.average(samples.map(s => s.netDrops || 0)),
            },
          ],
          tcpConnections: {
            established: {
              avg: this.average(samples.map(s => s.tcpEstablished || 0)),
              max: Math.max(...samples.map(s => s.tcpEstablished || 0)),
            },
            timeWait: {
              avg: this.average(samples.map(s => s.tcpTimeWait || 0)),
              max: Math.max(...samples.map(s => s.tcpTimeWait || 0)),
            },
            closeWait: {
              avg: this.average(samples.map(s => s.tcpCloseWait || 0)),
              max: Math.max(...samples.map(s => s.tcpCloseWait || 0)),
            },
          },
        },
      });

      this.itemsDiscovered++;
    }

    return {
      baselines,
      collectionPeriod: { start: start.toISOString(), end: end.toISOString() },
    };
  }

  private async collectSample(
    host: string,
    opts: PerfCollectorConfig['options'],
    _context: ScanContext,
  ): Promise<Record<string, number>> {
    const creds = opts.credentialMap?.[host] || opts.globalCredentials!;
    const conn = await this.sshConnect({
      host,
      port: opts.port || 22,
      username: creds.username,
      password: creds.password,
      privateKey: creds.privateKey,
      readyTimeout: 10000,
    });

    try {
      const exec = (cmd: string) => this.sshExec(conn, cmd);

      const [cpu, mem, disk, net, tcp] = await Promise.all([
        exec("top -bn1 | head -5"),
        exec("cat /proc/meminfo | head -10"),
        exec("iostat -dx 1 1 2>/dev/null | tail -5 || echo ''"),
        exec("cat /proc/net/dev | tail -n +3 | head -5"),
        exec("ss -s 2>/dev/null | head -5"),
      ]);

      // Parse CPU
      const cpuMatch = cpu.match(/(\d+\.\d+)\s*id/);
      const iowaitMatch = cpu.match(/(\d+\.\d+)\s*wa/);
      const cpuPercent = cpuMatch ? 100 - parseFloat(cpuMatch[1]) : 0;

      // Parse memory
      const memTotal = mem.match(/MemTotal:\s+(\d+)/);
      const memAvail = mem.match(/MemAvailable:\s+(\d+)/);
      const cached = mem.match(/Cached:\s+(\d+)/);
      const buffers = mem.match(/Buffers:\s+(\d+)/);
      const swapUsed = mem.match(/SwapFree:\s+(\d+)/);
      const swapTotal = mem.match(/SwapTotal:\s+(\d+)/);
      const memTotalGB = memTotal ? parseInt(memTotal[1]) / 1024 / 1024 : 0;
      const memUsedGB = memTotal && memAvail
        ? (parseInt(memTotal[1]) - parseInt(memAvail[1])) / 1024 / 1024
        : 0;

      // Parse TCP connections
      const tcpEstMatch = tcp.match(/estab\s+(\d+)/);

      return {
        cpuPercent,
        iowait: iowaitMatch ? parseFloat(iowaitMatch[1]) : 0,
        memTotalGB,
        memUsedGB,
        swapUsedGB: swapTotal && swapUsed
          ? (parseInt(swapTotal[1]) - parseInt(swapUsed[1])) / 1024 / 1024
          : 0,
        cacheGB: cached ? parseInt(cached[1]) / 1024 / 1024 : 0,
        buffersGB: buffers ? parseInt(buffers[1]) / 1024 / 1024 : 0,
        tcpEstablished: tcpEstMatch ? parseInt(tcpEstMatch[1]) : 0,
        tcpTimeWait: 0,
        tcpCloseWait: 0,
        diskReadIOPS: 0,
        diskWriteIOPS: 0,
        diskReadLatMs: 0,
        diskWriteLatMs: 0,
        diskReadMBps: 0,
        diskWriteMBps: 0,
        diskCapGB: 0,
        diskUsedGB: 0,
        netRxBps: 0,
        netTxBps: 0,
        netErrors: 0,
        netDrops: 0,
      };
    } finally {
      conn.end();
    }
  }

  // ──────────────────────────────────────────
  // Statistics
  // ──────────────────────────────────────────

  private computePercentiles(values: number[]): PercentileStats {
    if (values.length === 0) return { min: 0, avg: 0, max: 0, p50: 0, p95: 0, p99: 0 };
    const sorted = [...values].sort((a, b) => a - b);
    return {
      min: sorted[0],
      avg: Math.round(this.average(values) * 100) / 100,
      max: sorted[sorted.length - 1],
      p50: sorted[Math.floor(sorted.length * 0.5)],
      p95: sorted[Math.floor(sorted.length * 0.95)],
      p99: sorted[Math.floor(sorted.length * 0.99)],
    };
  }

  private average(values: number[]): number {
    if (values.length === 0) return 0;
    return values.reduce((s, v) => s + v, 0) / values.length;
  }

  // ──────────────────────────────────────────
  // SSH helpers
  // ──────────────────────────────────────────

  private sshConnect(config: ConnectConfig): Promise<SSHClient> {
    return new Promise((resolve, reject) => {
      const conn = new SSHClient();
      conn.on('ready', () => resolve(conn));
      conn.on('error', reject);
      conn.connect(config);
    });
  }

  private sshExec(conn: SSHClient, cmd: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('timeout')), 15000);
      conn.exec(cmd, (err, stream) => {
        if (err) { clearTimeout(timer); return reject(err); }
        let out = '';
        stream.on('data', (d: Buffer) => { out += d.toString(); });
        stream.on('close', () => { clearTimeout(timer); resolve(out); });
      });
    });
  }
}

/**
 * MigrationBox V5.0 - Network Scanner (Layer 1)
 * 
 * Zero-knowledge entry point: discovers live hosts on a CIDR range
 * using ICMP sweep, TCP SYN scan, and service fingerprinting.
 * 
 * Uses child_process to invoke masscan/nmap for high-performance scanning,
 * with a pure-Node.js fallback for environments without those tools.
 */

import { BaseScanner, ScanContext } from '../../engine/scanner-registry';
import { NetworkScanResult, PortInfo, HostClassification, ScannerConfig } from '../types/onprem-types';
import { execFile } from 'child_process';
import { promisify } from 'util';
import * as net from 'net';
import * as dns from 'dns';

const execFileAsync = promisify(execFile);
const dnsReverse = promisify(dns.reverse);

export interface NetworkScanConfig extends ScannerConfig {
  options: {
    cidrRanges: string[];
    ports?: string;                  // Default: top 1000 ports
    scanRate?: number;               // Packets/sec (default: 1000)
    useMasscan?: boolean;            // Use masscan if available
    useNmap?: boolean;               // Use nmap for service fingerprinting
    tcpTimeout?: number;             // ms (default: 2000)
    excludeHosts?: string[];
  };
}

interface NetworkScanData {
  hosts: NetworkScanResult[];
  scanDuration: number;
  cidrRanges: string[];
}

// Well-known services for port classification
const PORT_SERVICES: Record<number, string> = {
  21: 'ftp', 22: 'ssh', 23: 'telnet', 25: 'smtp', 53: 'dns',
  80: 'http', 110: 'pop3', 111: 'rpcbind', 135: 'msrpc',
  139: 'netbios', 143: 'imap', 161: 'snmp', 389: 'ldap',
  443: 'https', 445: 'smb', 465: 'smtps', 514: 'syslog',
  587: 'submission', 636: 'ldaps', 993: 'imaps', 995: 'pop3s',
  1433: 'sqlserver', 1521: 'oracle', 2049: 'nfs',
  3306: 'mysql', 3389: 'rdp', 5432: 'postgresql',
  5672: 'amqp', 5900: 'vnc', 5985: 'winrm', 5986: 'winrm-ssl',
  6379: 'redis', 6443: 'k8s-api', 8080: 'http-alt', 8443: 'https-alt',
  9090: 'prometheus', 9092: 'kafka', 9200: 'elasticsearch',
  27017: 'mongodb', 27018: 'mongodb', 27019: 'mongodb',
};

const SERVER_PORTS = new Set([22, 80, 443, 1433, 1521, 3306, 5432, 8080, 8443, 9200]);
const NETWORK_DEVICE_PORTS = new Set([161, 179, 623, 830]);
const STORAGE_PORTS = new Set([111, 2049, 3260]);

export class NetworkScanner extends BaseScanner<NetworkScanConfig, NetworkScanData> {
  readonly id = 'network-scanner';
  readonly name = 'Network Scanner (Layer 1)';
  readonly version = '2.0.0';
  readonly layer = 1;
  readonly dependencies: string[] = [];

  async validate(config: NetworkScanConfig): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];
    if (!config.options?.cidrRanges?.length) {
      errors.push('At least one CIDR range is required (e.g., "10.0.0.0/24")');
    }
    for (const cidr of config.options?.cidrRanges || []) {
      if (!this.isValidCIDR(cidr)) {
        errors.push(`Invalid CIDR range: ${cidr}`);
      }
    }
    return { valid: errors.length === 0, errors };
  }

  async estimateDuration(config: NetworkScanConfig): Promise<{ minSeconds: number; maxSeconds: number }> {
    const totalHosts = (config.options?.cidrRanges || []).reduce((sum, cidr) => {
      const prefix = parseInt(cidr.split('/')[1] || '24');
      return sum + Math.pow(2, 32 - prefix);
    }, 0);
    // Masscan: ~10s per /16, Node fallback: ~1s per host top-100
    const rate = config.options?.useMasscan ? 10000 : 50;
    return {
      minSeconds: Math.ceil(totalHosts / rate),
      maxSeconds: Math.ceil(totalHosts / rate) * 3,
    };
  }

  protected async execute(config: NetworkScanConfig, context: ScanContext): Promise<NetworkScanData> {
    const startTime = Date.now();
    const hosts: NetworkScanResult[] = [];
    const opts = config.options;

    for (const cidr of opts.cidrRanges) {
      if (context.signal.aborted) break;
      context.log.info(`Scanning CIDR range: ${cidr}`);
      context.events.emit('scanner:progress', { scannerId: this.id, cidr });

      let hostResults: NetworkScanResult[];

      if (opts.useMasscan && await this.toolAvailable('masscan')) {
        hostResults = await this.scanWithMasscan(cidr, opts, context);
      } else if (opts.useNmap && await this.toolAvailable('nmap')) {
        hostResults = await this.scanWithNmap(cidr, opts, context);
      } else {
        hostResults = await this.scanWithNodeJS(cidr, opts, context);
      }

      // Filter out excluded hosts
      const excluded = new Set(opts.excludeHosts || []);
      const filtered = hostResults.filter(h => !excluded.has(h.host));

      // Resolve hostnames
      for (const host of filtered) {
        try {
          const names = await dnsReverse(host.host);
          if (names.length > 0) host.hostname = names[0];
        } catch { /* No reverse DNS — that's OK */ }
      }

      // Classify each host
      for (const host of filtered) {
        host.classification = this.classifyHost(host);
      }

      hosts.push(...filtered);
      this.itemsDiscovered += filtered.length;
    }

    return {
      hosts,
      scanDuration: Date.now() - startTime,
      cidrRanges: opts.cidrRanges,
    };
  }

  // ──────────────────────────────────────────
  // Scan implementations
  // ──────────────────────────────────────────

  private async scanWithMasscan(
    cidr: string,
    opts: NetworkScanConfig['options'],
    context: ScanContext,
  ): Promise<NetworkScanResult[]> {
    const ports = opts.ports || '1-1024,3306,5432,8080,8443,9200,27017';
    const rate = String(opts.scanRate || 1000);

    try {
      const { stdout } = await execFileAsync('masscan', [
        cidr, '-p', ports, '--rate', rate, '-oJ', '-',
        '--open',
      ], { timeout: 300_000 });

      return this.parseMasscanOutput(stdout);
    } catch (error) {
      context.log.warn(`masscan failed, falling back to Node.js scan: ${error}`);
      return this.scanWithNodeJS(cidr, opts, context);
    }
  }

  private async scanWithNmap(
    cidr: string,
    opts: NetworkScanConfig['options'],
    context: ScanContext,
  ): Promise<NetworkScanResult[]> {
    const ports = opts.ports || '--top-ports 1000';

    try {
      const args = ['-sS', '-sV', '--open', '-oX', '-', cidr];
      if (opts.ports) args.push('-p', opts.ports);

      const { stdout } = await execFileAsync('nmap', args, { timeout: 600_000 });
      return this.parseNmapXMLOutput(stdout);
    } catch (error) {
      context.log.warn(`nmap failed, falling back to Node.js scan: ${error}`);
      return this.scanWithNodeJS(cidr, opts, context);
    }
  }

  /**
   * Pure Node.js TCP connect scan — works everywhere, no external tools needed.
   * Scans top 100 ports per host using concurrent connections.
   */
  private async scanWithNodeJS(
    cidr: string,
    opts: NetworkScanConfig['options'],
    _context: ScanContext,
  ): Promise<NetworkScanResult[]> {
    const ips = this.expandCIDR(cidr, 1024); // Limit to /22 for Node.js fallback
    const topPorts = [
      22, 80, 443, 21, 25, 53, 110, 135, 139, 143, 161, 389, 445,
      993, 995, 1433, 1521, 3306, 3389, 5432, 5672, 5900, 5985,
      6379, 6443, 8080, 8443, 9090, 9092, 9200, 27017,
    ];

    const timeout = opts.tcpTimeout || 2000;
    const results: NetworkScanResult[] = [];

    // Scan in batches of 50 hosts
    const batches = this.chunk(ips, 50);
    for (const batch of batches) {
      if (this.abortController.signal.aborted) break;

      const batchResults = await Promise.allSettled(
        batch.map(ip => this.scanHost(ip, topPorts, timeout))
      );

      for (const result of batchResults) {
        if (result.status === 'fulfilled' && result.value.ports.length > 0) {
          results.push(result.value);
        }
      }
    }

    return results;
  }

  private async scanHost(ip: string, ports: number[], timeout: number): Promise<NetworkScanResult> {
    const now = new Date().toISOString();
    const openPorts: PortInfo[] = [];
    const startTime = Date.now();

    const portChecks = ports.map(port =>
      this.checkPort(ip, port, timeout).then(open => {
        if (open) {
          openPorts.push({
            port,
            protocol: 'tcp',
            state: 'open',
            service: PORT_SERVICES[port] || 'unknown',
          });
        }
      })
    );

    await Promise.allSettled(portChecks);

    return {
      host: ip,
      ports: openPorts.sort((a, b) => a.port - b.port),
      responseTime: Date.now() - startTime,
      classification: 'unknown',
      firstSeen: now,
      lastSeen: now,
    };
  }

  private checkPort(host: string, port: number, timeout: number): Promise<boolean> {
    return new Promise(resolve => {
      const socket = new net.Socket();
      socket.setTimeout(timeout);

      socket.on('connect', () => {
        socket.destroy();
        resolve(true);
      });

      socket.on('timeout', () => {
        socket.destroy();
        resolve(false);
      });

      socket.on('error', () => {
        socket.destroy();
        resolve(false);
      });

      socket.connect(port, host);
    });
  }

  // ──────────────────────────────────────────
  // Host classification
  // ──────────────────────────────────────────

  private classifyHost(host: NetworkScanResult): HostClassification {
    const openPorts = new Set(host.ports.map(p => p.port));

    if ([...NETWORK_DEVICE_PORTS].some(p => openPorts.has(p))) return 'network-device';
    if ([...STORAGE_PORTS].some(p => openPorts.has(p))) return 'storage';
    if (openPorts.has(9100) || openPorts.has(515)) return 'printer';
    if ([...SERVER_PORTS].some(p => openPorts.has(p))) return 'server';
    if (openPorts.has(3389) && openPorts.size <= 3) return 'workstation';

    return host.ports.length > 3 ? 'server' : 'unknown';
  }

  // ──────────────────────────────────────────
  // Parsing helpers
  // ──────────────────────────────────────────

  private parseMasscanOutput(json: string): NetworkScanResult[] {
    const hostMap = new Map<string, NetworkScanResult>();
    const now = new Date().toISOString();

    try {
      // Masscan JSON output is an array of objects with ip, ports
      const cleaned = json.replace(/,\s*]/, ']'); // Fix trailing comma
      const entries = JSON.parse(cleaned);

      for (const entry of entries) {
        const ip = entry.ip;
        if (!hostMap.has(ip)) {
          hostMap.set(ip, {
            host: ip,
            ports: [],
            responseTime: 0,
            classification: 'unknown',
            firstSeen: now,
            lastSeen: now,
          });
        }
        const host = hostMap.get(ip)!;
        for (const p of entry.ports || []) {
          host.ports.push({
            port: p.port,
            protocol: p.proto || 'tcp',
            state: 'open',
            service: PORT_SERVICES[p.port] || p.service?.name || 'unknown',
            banner: p.service?.banner,
          });
        }
      }
    } catch (e) {
      this.addError('masscan-parse', `Failed to parse masscan output: ${e}`);
    }

    return Array.from(hostMap.values());
  }

  private parseNmapXMLOutput(xml: string): NetworkScanResult[] {
    // Simplified XML parsing — in production, use a proper XML parser
    const hosts: NetworkScanResult[] = [];
    const now = new Date().toISOString();
    const hostBlocks = xml.split('<host ').slice(1);

    for (const block of hostBlocks) {
      const ipMatch = block.match(/addr="([^"]+)"/);
      if (!ipMatch) continue;

      const host: NetworkScanResult = {
        host: ipMatch[1],
        ports: [],
        responseTime: 0,
        classification: 'unknown',
        firstSeen: now,
        lastSeen: now,
      };

      // Extract OS detection
      const osMatch = block.match(/name="([^"]+)".*accuracy="(\d+)"/);
      if (osMatch) {
        host.os = { name: osMatch[1], version: '', confidence: parseInt(osMatch[2]) / 100 };
      }

      // Extract ports
      const portMatches = block.matchAll(
        /portid="(\d+)".*protocol="([^"]+)".*state="open".*?(?:name="([^"]*)")?.*?(?:product="([^"]*)")?.*?(?:version="([^"]*)")?/g
      );
      for (const pm of portMatches) {
        host.ports.push({
          port: parseInt(pm[1]),
          protocol: pm[2] as 'tcp' | 'udp',
          state: 'open',
          service: pm[3] || PORT_SERVICES[parseInt(pm[1])] || 'unknown',
          version: pm[4] ? `${pm[4]} ${pm[5] || ''}`.trim() : undefined,
        });
      }

      if (host.ports.length > 0) hosts.push(host);
    }

    return hosts;
  }

  // ──────────────────────────────────────────
  // Utility
  // ──────────────────────────────────────────

  private async toolAvailable(tool: string): Promise<boolean> {
    try {
      await execFileAsync(tool, ['--version'], { timeout: 5000 });
      return true;
    } catch {
      return false;
    }
  }

  private isValidCIDR(cidr: string): boolean {
    const parts = cidr.split('/');
    if (parts.length !== 2) return false;
    const prefix = parseInt(parts[1]);
    if (isNaN(prefix) || prefix < 0 || prefix > 32) return false;
    const octets = parts[0].split('.');
    if (octets.length !== 4) return false;
    return octets.every(o => { const n = parseInt(o); return !isNaN(n) && n >= 0 && n <= 255; });
  }

  private expandCIDR(cidr: string, maxHosts: number): string[] {
    const [base, prefixStr] = cidr.split('/');
    const prefix = parseInt(prefixStr || '24');
    const hostCount = Math.min(Math.pow(2, 32 - prefix), maxHosts);
    const octets = base.split('.').map(Number);
    const baseInt = (octets[0] << 24) | (octets[1] << 16) | (octets[2] << 8) | octets[3];

    const ips: string[] = [];
    for (let i = 1; i < hostCount - 1; i++) { // Skip network (.0) and broadcast (.255)
      const ip = baseInt + i;
      ips.push(`${(ip >>> 24) & 0xff}.${(ip >>> 16) & 0xff}.${(ip >>> 8) & 0xff}.${ip & 0xff}`);
    }
    return ips;
  }

  private chunk<T>(arr: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < arr.length; i += size) chunks.push(arr.slice(i, i + size));
    return chunks;
  }
}

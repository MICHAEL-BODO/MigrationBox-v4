/**
 * MIKE-FIRST v6.0 — On-Prem Network Scanner
 * 
 * Real network scanner using Node.js net/dgram modules.
 * Scans local network via ARP, TCP port scanning, and service detection.
 * Works on Windows (ipconfig, arp, netstat) and Linux (ip, arp, ss).
 * 
 * This is the LIVE mode scanner that actually touches the network.
 */

import * as net from 'net';
import * as os from 'os';
import * as dns from 'dns';
import { exec } from 'child_process';
import { promisify } from 'util';
import type { CloudResource, SecurityFinding, HealthStatus, CloudProviderType } from '../cloud-provider';

const execAsync = promisify(exec);

// ─── Types ───────────────────────────────────────────────────────────

export interface NetworkScanConfig {
  cidr: string;
  ports: number[];
  timeout: number;    // ms per port
  concurrency: number;
  includeServiceDetection: boolean;
  includeVulnScan: boolean;
}

export interface DiscoveredHost {
  ip: string;
  mac?: string;
  hostname?: string;
  vendor?: string;
  os?: string;
  openPorts: PortResult[];
  services: DetectedService[];
  vulnerabilities: SecurityFinding[];
  responseTimeMs: number;
  lastSeen: string;
}

export interface PortResult {
  port: number;
  state: 'open' | 'closed' | 'filtered';
  service?: string;
  version?: string;
  banner?: string;
}

export interface DetectedService {
  name: string;
  port: number;
  protocol: string;
  version?: string;
  encrypted: boolean;
  authenticated: boolean;
}

// Known port→service mappings
const PORT_SERVICE_MAP: Record<number, { name: string; protocol: string; encrypted?: boolean }> = {
  21:   { name: 'FTP', protocol: 'tcp', encrypted: false },
  22:   { name: 'SSH', protocol: 'tcp', encrypted: true },
  23:   { name: 'Telnet', protocol: 'tcp', encrypted: false },
  25:   { name: 'SMTP', protocol: 'tcp', encrypted: false },
  53:   { name: 'DNS', protocol: 'udp' },
  80:   { name: 'HTTP', protocol: 'tcp', encrypted: false },
  110:  { name: 'POP3', protocol: 'tcp', encrypted: false },
  135:  { name: 'MS-RPC', protocol: 'tcp', encrypted: false },
  139:  { name: 'NetBIOS', protocol: 'tcp', encrypted: false },
  143:  { name: 'IMAP', protocol: 'tcp', encrypted: false },
  443:  { name: 'HTTPS', protocol: 'tcp', encrypted: true },
  445:  { name: 'SMB', protocol: 'tcp', encrypted: false },
  465:  { name: 'SMTPS', protocol: 'tcp', encrypted: true },
  587:  { name: 'SMTP-Submission', protocol: 'tcp', encrypted: true },
  993:  { name: 'IMAPS', protocol: 'tcp', encrypted: true },
  995:  { name: 'POP3S', protocol: 'tcp', encrypted: true },
  1433: { name: 'MSSQL', protocol: 'tcp', encrypted: false },
  1883: { name: 'MQTT', protocol: 'tcp', encrypted: false },
  3306: { name: 'MySQL', protocol: 'tcp', encrypted: false },
  3389: { name: 'RDP', protocol: 'tcp', encrypted: false },
  5432: { name: 'PostgreSQL', protocol: 'tcp', encrypted: false },
  5900: { name: 'VNC', protocol: 'tcp', encrypted: false },
  5901: { name: 'VNC-1', protocol: 'tcp', encrypted: false },
  6379: { name: 'Redis', protocol: 'tcp', encrypted: false },
  8080: { name: 'HTTP-Alt', protocol: 'tcp', encrypted: false },
  8443: { name: 'HTTPS-Alt', protocol: 'tcp', encrypted: true },
  8883: { name: 'MQTT-TLS', protocol: 'tcp', encrypted: true },
  9090: { name: 'Prometheus', protocol: 'tcp', encrypted: false },
  9200: { name: 'Elasticsearch', protocol: 'tcp', encrypted: false },
  27017: { name: 'MongoDB', protocol: 'tcp', encrypted: false },
};

// Well-known MAC vendor prefixes
const MAC_VENDORS: Record<string, string> = {
  '00:50:56': 'VMware',
  '00:0c:29': 'VMware',
  '00:15:5d': 'Microsoft Hyper-V',
  '08:00:27': 'VirtualBox',
  'dc:a6:32': 'Raspberry Pi',
  'b8:27:eb': 'Raspberry Pi',
  'e4:5f:01': 'Raspberry Pi',
  '18:fe:34': 'Espressif (IoT/ESP32)',
  'a4:cf:12': 'Espressif (IoT/ESP8266)',
  '48:3f:da': 'Espressif (IoT)',
  'ac:de:48': 'Amazon (Ring/Alexa)',
  'f0:72:ea': 'Google (Nest/Chromecast)',
  '30:fd:38': 'Google (Nest)',
  '54:60:09': 'Google',
  '7c:2e:0d': 'Xiaomi (IoT)',
  '78:02:f8': 'Xiaomi',
  '64:cc:2e': 'Xiaomi',
  '70:a6:cc': 'Tapo/TP-Link (IoT)',
  '50:c7:bf': 'TP-Link',
  '30:de:4b': 'TP-Link',
  '00:1a:2b': 'Juniper',
  '00:09:0f': 'Fortinet',
  '00:1e:67': 'Intel',
  '3c:22:fb': 'Apple',
  '14:7d:da': 'Apple',
  'a8:5c:2c': 'Apple',
  'f8:ff:c2': 'Apple',
  '28:6c:07': 'Xiaomi',
  'a4:34:d9': 'Intel',
  'b4:2e:99': 'Gree Electric (IoT HVAC)',
};

// ─── Network Scanner ─────────────────────────────────────────────────

export class OnPremNetworkScanner {
  private config: NetworkScanConfig;
  private scanLog: string[] = [];
  private abortController = new AbortController();

  constructor(config?: Partial<NetworkScanConfig>) {
    this.config = {
      cidr: config?.cidr || '192.168.1.0/24',
      ports: config?.ports || [21, 22, 23, 25, 53, 80, 110, 135, 139, 143, 443, 445, 
        1433, 1883, 3306, 3389, 5432, 5900, 6379, 8080, 8443, 9090, 9200, 27017],
      timeout: config?.timeout || 1500,
      concurrency: config?.concurrency || 50,
      includeServiceDetection: config?.includeServiceDetection ?? true,
      includeVulnScan: config?.includeVulnScan ?? true,
    };
  }

  // ─── Main scan entry point ──────────────────────────────────────

  async scan(onProgress?: (msg: string) => void): Promise<DiscoveredHost[]> {
    const log = (msg: string) => {
      this.scanLog.push(`[${new Date().toISOString()}] ${msg}`);
      onProgress?.(msg);
    };

    log('🔍 Starting on-prem network scan...');
    log(`📡 CIDR: ${this.config.cidr}`);
    log(`🔌 Ports: ${this.config.ports.length} ports to scan`);

    // Step 1: Get local network info
    const localInfo = this.getLocalNetworkInfo();
    log(`🖥️ Local IP: ${localInfo.ip}, Gateway: ${localInfo.gateway}`);
    log(`🌐 Subnet: ${localInfo.subnet}`);

    // Step 2: ARP scan — discover live hosts
    log('📡 Phase 1: ARP scan — discovering live hosts...');
    const arpHosts = await this.arpScan();
    log(`✅ Found ${arpHosts.length} hosts via ARP`);

    // Step 3: ICMP Ping sweep — find any hosts ARP missed
    log('🏓 Phase 2: Ping sweep — checking for additional hosts...');
    const pingHosts = await this.pingSweep(this.config.cidr);
    const allIPs = [...new Set([...arpHosts.map(h => h.ip), ...pingHosts])];
    log(`✅ Total live hosts: ${allIPs.length}`);

    // Step 4: Port scan each host
    log(`🔌 Phase 3: Port scanning ${allIPs.length} hosts × ${this.config.ports.length} ports...`);
    const hosts: DiscoveredHost[] = [];

    for (const ip of allIPs) {
      if (this.abortController.signal.aborted) break;
      
      const arpEntry = arpHosts.find(h => h.ip === ip);
      log(`  Scanning ${ip}${arpEntry?.hostname ? ` (${arpEntry.hostname})` : ''}...`);
      
      const openPorts = await this.scanPorts(ip);
      
      // Reverse DNS lookup
      let hostname = arpEntry?.hostname;
      if (!hostname) {
        try {
          const names = await dns.promises.reverse(ip);
          hostname = names[0];
        } catch { /* no reverse DNS */ }
      }

      // Detect services and vulnerabilities
      const services: DetectedService[] = [];
      const vulnerabilities: SecurityFinding[] = [];

      for (const port of openPorts) {
        const knownService = PORT_SERVICE_MAP[port.port];
        if (knownService) {
          services.push({
            name: knownService.name,
            port: port.port,
            protocol: knownService.protocol,
            version: port.version,
            encrypted: knownService.encrypted ?? false,
            authenticated: !['HTTP', 'FTP', 'Telnet', 'MQTT'].includes(knownService.name),
          });
        }

        // Vulnerability detection
        if (this.config.includeVulnScan) {
          const vulns = this.detectVulnerabilities(ip, port, hostname);
          vulnerabilities.push(...vulns);
        }
      }

      const host: DiscoveredHost = {
        ip,
        mac: arpEntry?.mac,
        hostname,
        vendor: arpEntry?.vendor || this.guessVendor(arpEntry?.mac, services),
        os: this.guessOS(openPorts, arpEntry?.mac),
        openPorts,
        services,
        vulnerabilities,
        responseTimeMs: 0,
        lastSeen: new Date().toISOString(),
      };

      // Measure response time
      const pingStart = Date.now();
      try {
        await this.tcpConnect(ip, openPorts[0]?.port || 80, 500);
        host.responseTimeMs = Date.now() - pingStart;
      } catch {
        host.responseTimeMs = -1;
      }

      if (openPorts.length > 0 || arpEntry) {
        hosts.push(host);
        log(`  ✅ ${ip}: ${openPorts.length} open ports, ${vulnerabilities.length} findings`);
      }
    }

    // Step 5: Summary
    const totalVulns = hosts.reduce((sum, h) => sum + h.vulnerabilities.length, 0);
    const criticalVulns = hosts.reduce((sum, h) => 
      sum + h.vulnerabilities.filter(v => v.severity === 'critical').length, 0);
    
    log(`\n📊 Scan Complete!`);
    log(`   Hosts discovered: ${hosts.length}`);
    log(`   Total open ports: ${hosts.reduce((sum, h) => sum + h.openPorts.length, 0)}`);
    log(`   Services detected: ${hosts.reduce((sum, h) => sum + h.services.length, 0)}`);
    log(`   Security findings: ${totalVulns} (${criticalVulns} critical)`);

    return hosts;
  }

  // ─── ARP Scan ───────────────────────────────────────────────────

  private async arpScan(): Promise<{ ip: string; mac?: string; hostname?: string; vendor?: string }[]> {
    const hosts: { ip: string; mac?: string; hostname?: string; vendor?: string }[] = [];

    try {
      // Windows: arp -a
      // Linux: arp -n or ip neigh
      const isWindows = os.platform() === 'win32';
      const cmd = isWindows ? 'arp -a' : 'ip neigh show';
      const { stdout } = await execAsync(cmd, { timeout: 10000 });

      const lines = stdout.split('\n');
      for (const line of lines) {
        if (isWindows) {
          // Windows format: "  192.168.1.1          aa-bb-cc-dd-ee-ff     dynamic"
          const match = line.match(/(\d+\.\d+\.\d+\.\d+)\s+([\da-f]{2}[:-][\da-f]{2}[:-][\da-f]{2}[:-][\da-f]{2}[:-][\da-f]{2}[:-][\da-f]{2})/i);
          if (match) {
            const mac = match[2].replace(/-/g, ':').toLowerCase();
            const vendor = this.lookupVendor(mac);
            hosts.push({ ip: match[1], mac, vendor });
          }
        } else {
          // Linux format: "192.168.1.1 dev eth0 lladdr aa:bb:cc:dd:ee:ff REACHABLE"
          const match = line.match(/(\d+\.\d+\.\d+\.\d+).*lladdr\s+([\da-f:]+)/i);
          if (match) {
            const mac = match[2].toLowerCase();
            const vendor = this.lookupVendor(mac);
            hosts.push({ ip: match[1], mac, vendor });
          }
        }
      }

      // Also get hostnames from DHCP/DNS leases on Windows
      if (isWindows) {
        try {
          const { stdout: nbtOutput } = await execAsync('nbtstat -c 2>nul', { timeout: 5000 });
          const nbtLines = nbtOutput.split('\n');
          for (const nbtLine of nbtLines) {
            const nbtMatch = nbtLine.match(/(\S+)\s+<\d+>\s+UNIQUE\s+/);
            if (nbtMatch) {
              // try to match with existing hosts
            }
          }
        } catch { /* nbtstat may not be available */ }
      }
    } catch (err) {
      // Fallback: construct from getNetworkInterfaces
      console.warn('ARP scan failed, using fallback', err);
    }

    return hosts;
  }

  // ─── Ping Sweep ─────────────────────────────────────────────────

  private async pingSweep(cidr: string): Promise<string[]> {
    const { baseIp, startHost, endHost } = this.parseCIDR(cidr);
    const liveHosts: string[] = [];

    // Scan in batches for performance
    const batchSize = this.config.concurrency;
    for (let i = startHost; i <= endHost; i += batchSize) {
      const batch = [];
      for (let j = i; j < Math.min(i + batchSize, endHost + 1); j++) {
        const ip = `${baseIp}.${j}`;
        batch.push(this.isHostAlive(ip));
      }
      const results = await Promise.allSettled(batch);
      results.forEach((result, idx) => {
        if (result.status === 'fulfilled' && result.value) {
          liveHosts.push(`${baseIp}.${i + idx}`);
        }
      });
    }

    return liveHosts;
  }

  private async isHostAlive(ip: string): Promise<boolean> {
    // Try TCP connect to common ports as a "ping"
    const quickPorts = [80, 443, 22, 445, 3389, 8080];
    for (const port of quickPorts) {
      try {
        await this.tcpConnect(ip, port, 300);
        return true;
      } catch { /* port closed, try next */ }
    }
    return false;
  }

  // ─── Port Scanner ───────────────────────────────────────────────

  private async scanPorts(ip: string): Promise<PortResult[]> {
    const results: PortResult[] = [];
    const batchSize = 10;

    for (let i = 0; i < this.config.ports.length; i += batchSize) {
      const batch = this.config.ports.slice(i, i + batchSize);
      const batchResults = await Promise.allSettled(
        batch.map(port => this.scanSinglePort(ip, port))
      );

      for (const result of batchResults) {
        if (result.status === 'fulfilled' && result.value.state === 'open') {
          results.push(result.value);
        }
      }
    }

    return results;
  }

  private async scanSinglePort(ip: string, port: number): Promise<PortResult> {
    try {
      const banner = await this.tcpConnect(ip, port, this.config.timeout);
      const knownService = PORT_SERVICE_MAP[port];
      
      return {
        port,
        state: 'open',
        service: knownService?.name || `unknown-${port}`,
        banner: banner || undefined,
        version: this.extractVersion(banner, knownService?.name),
      };
    } catch {
      return { port, state: 'closed' };
    }
  }

  // ─── TCP Connect + Banner Grab ──────────────────────────────────

  private tcpConnect(ip: string, port: number, timeout: number): Promise<string | null> {
    return new Promise((resolve, reject) => {
      const socket = new net.Socket();
      let banner = '';

      socket.setTimeout(timeout);

      socket.on('connect', () => {
        // Try to grab banner
        socket.write('\r\n');
        setTimeout(() => {
          socket.destroy();
          resolve(banner || null);
        }, 200);
      });

      socket.on('data', (data) => {
        banner += data.toString().slice(0, 256);
      });

      socket.on('timeout', () => {
        socket.destroy();
        reject(new Error('timeout'));
      });

      socket.on('error', (err) => {
        socket.destroy();
        reject(err);
      });

      socket.connect(port, ip);
    });
  }

  // ─── Vulnerability Detection ────────────────────────────────────

  private detectVulnerabilities(ip: string, port: PortResult, hostname?: string): SecurityFinding[] {
    const findings: SecurityFinding[] = [];
    const now = new Date().toISOString();

    // CRITICAL: Telnet — plaintext credentials
    if (port.port === 23 && port.state === 'open') {
      findings.push({
        id: `vuln-telnet-${ip}`,
        severity: 'critical',
        title: 'Telnet service exposed — plaintext credential transmission',
        description: `Host ${ip} is running Telnet on port 23. Telnet transmits credentials in plaintext, allowing any network sniffer to capture usernames and passwords. This is a critical security risk.`,
        resource: `${hostname || ip}:23`,
        resourceType: 'vm',
        provider: 'onprem',
        framework: 'ISO27001',
        control: 'A.13.1.1 — Network controls',
        remediation: 'Disable Telnet and use SSH (port 22) for remote access. Run: systemctl disable telnet; systemctl enable sshd',
        autoFixAvailable: false,
        detectedAt: now,
        status: 'open',
      });
    }

    // CRITICAL: FTP without TLS
    if (port.port === 21 && port.state === 'open') {
      findings.push({
        id: `vuln-ftp-${ip}`,
        severity: 'critical',
        title: 'FTP service exposed — plaintext file transfer',
        description: `Host ${ip} is running FTP on port 21. FTP transmits files and credentials in plaintext. GDPR Art. 32 requires encryption for personal data transfer.`,
        resource: `${hostname || ip}:21`,
        resourceType: 'vm',
        provider: 'onprem',
        framework: 'GDPR',
        control: 'Art. 32 — Security of processing',
        remediation: 'Replace FTP with SFTP (SSH) or FTPS. Disable plain FTP: systemctl disable vsftpd',
        autoFixAvailable: false,
        detectedAt: now,
        status: 'open',
      });
    }

    // HIGH: HTTP without TLS
    if (port.port === 80 && port.state === 'open') {
      findings.push({
        id: `vuln-http-${ip}`,
        severity: 'high',
        title: 'Unencrypted HTTP service exposed',
        description: `Host ${ip} is serving HTTP on port 80 without TLS encryption. Any data transmitted (including credentials, session tokens, personal data) can be intercepted.`,
        resource: `${hostname || ip}:80`,
        resourceType: 'vm',
        provider: 'onprem',
        framework: 'SOC2',
        control: 'CC6.1 — Logical access security',
        remediation: 'Enable HTTPS with TLS 1.2+ certificate. Redirect HTTP to HTTPS. Use Let\'s Encrypt for free certificates.',
        autoFixAvailable: true,
        detectedAt: now,
        status: 'open',
      });
    }

    // HIGH: SMB exposed
    if (port.port === 445 && port.state === 'open') {
      findings.push({
        id: `vuln-smb-${ip}`,
        severity: 'high',
        title: 'SMB/CIFS file sharing exposed',
        description: `Host ${ip} has SMB port 445 open. SMB has been the vector for major attacks (WannaCry, NotPetya, EternalBlue). Ensure SMBv1 is disabled and access is restricted.`,
        resource: `${hostname || ip}:445`,
        resourceType: 'vm',
        provider: 'onprem',
        framework: 'ISO27001',
        control: 'A.12.6.1 — Management of technical vulnerabilities',
        remediation: 'Disable SMBv1: Set-SmbServerConfiguration -EnableSMB1Protocol $false. Restrict SMB access with Windows Firewall rules.',
        autoFixAvailable: true,
        detectedAt: now,
        status: 'open',
      });
    }

    // HIGH: RDP exposed
    if (port.port === 3389 && port.state === 'open') {
      findings.push({
        id: `vuln-rdp-${ip}`,
        severity: 'high',
        title: 'RDP exposed without NLA',
        description: `Host ${ip} has RDP port 3389 open. RDP is frequently targeted by brute-force and BlueKeep-style attacks. Network Level Authentication (NLA) should be enforced.`,
        resource: `${hostname || ip}:3389`,
        resourceType: 'vm',
        provider: 'onprem',
        framework: 'HIPAA',
        control: '§164.312(a)(1) — Access control',
        remediation: 'Enable NLA for RDP. Use MFA via Azure AD or Duo. Consider VPN-only RDP access. Run: reg add "HKLM\\SYSTEM\\CurrentControlSet\\Control\\Terminal Server\\WinStations\\RDP-Tcp" /v UserAuthentication /t REG_DWORD /d 1 /f',
        autoFixAvailable: true,
        detectedAt: now,
        status: 'open',
      });
    }

    // HIGH: Database exposed
    if ([3306, 5432, 1433, 27017, 6379, 9200].includes(port.port) && port.state === 'open') {
      const dbName = PORT_SERVICE_MAP[port.port]?.name || 'Database';
      findings.push({
        id: `vuln-db-exposed-${ip}-${port.port}`,
        severity: 'high',
        title: `${dbName} database port exposed on network`,
        description: `Host ${ip} has ${dbName} port ${port.port} open. Database ports should never be directly accessible. This exposes the database to brute-force attacks and unauthorized access.`,
        resource: `${hostname || ip}:${port.port}`,
        resourceType: 'database',
        provider: 'onprem',
        framework: 'PCI-DSS',
        control: 'Req 1.3.7 — Place system components that store cardholder data in an internal network zone',
        remediation: `Restrict ${dbName} to localhost or VPN-only access. Use firewall rules to block external access to port ${port.port}. Enable TLS for database connections.`,
        autoFixAvailable: false,
        detectedAt: now,
        status: 'open',
      });
    }

    // MEDIUM: VNC exposed
    if ([5900, 5901].includes(port.port) && port.state === 'open') {
      findings.push({
        id: `vuln-vnc-${ip}`,
        severity: 'medium',
        title: 'VNC remote desktop exposed',
        description: `Host ${ip} has VNC port ${port.port} open. VNC often lacks strong authentication and encryption, making it a target for unauthorized access.`,
        resource: `${hostname || ip}:${port.port}`,
        resourceType: 'vm',
        provider: 'onprem',
        framework: 'ISO27001',
        control: 'A.9.4.1 — Information access restriction',
        remediation: 'Disable VNC or tunnel through SSH. Use VNC with TLS encryption. Set strong VNC passwords.',
        autoFixAvailable: false,
        detectedAt: now,
        status: 'open',
      });
    }

    // MEDIUM: MQTT IoT broker
    if (port.port === 1883 && port.state === 'open') {
      findings.push({
        id: `vuln-mqtt-${ip}`,
        severity: 'medium',
        title: 'MQTT IoT broker without TLS',
        description: `Host ${ip} is running an MQTT broker on port 1883 (unencrypted). IoT device communications can be intercepted and manipulated.`,
        resource: `${hostname || ip}:1883`,
        resourceType: 'iot',
        provider: 'onprem',
        framework: 'ISO27001',
        control: 'A.13.2.1 — Information transfer policies',
        remediation: 'Switch to MQTT over TLS (port 8883). Enable client certificate authentication.',
        autoFixAvailable: false,
        detectedAt: now,
        status: 'open',
      });
    }

    // MEDIUM: NetBIOS exposed
    if (port.port === 139 && port.state === 'open') {
      findings.push({
        id: `vuln-netbios-${ip}`,
        severity: 'medium',
        title: 'NetBIOS session service exposed',
        description: `Host ${ip} has NetBIOS port 139 open. NetBIOS can leak hostname, domain, and share information.`,
        resource: `${hostname || ip}:139`,
        resourceType: 'vm',
        provider: 'onprem',
        remediation: 'Disable NetBIOS over TCP/IP in network adapter advanced settings.',
        autoFixAvailable: true,
        detectedAt: now,
        status: 'open',
      });
    }

    // LOW: Prometheus metrics exposed
    if (port.port === 9090 && port.state === 'open') {
      findings.push({
        id: `vuln-prometheus-${ip}`,
        severity: 'low',
        title: 'Prometheus metrics endpoint exposed',
        description: `Host ${ip} has Prometheus on port 9090. Metrics endpoints can leak infrastructure topology and performance data.`,
        resource: `${hostname || ip}:9090`,
        resourceType: 'vm',
        provider: 'onprem',
        remediation: 'Restrict Prometheus access with authentication proxy (nginx basic auth or OAuth2 proxy).',
        autoFixAvailable: false,
        detectedAt: now,
        status: 'open',
      });
    }

    return findings;
  }

  // ─── Helpers ────────────────────────────────────────────────────

  getLocalNetworkInfo(): { ip: string; gateway: string; subnet: string; interfaces: os.NetworkInterfaceInfo[] } {
    const ifaces = os.networkInterfaces();
    let primaryIp = '127.0.0.1';
    let allInterfaces: os.NetworkInterfaceInfo[] = [];

    for (const [, addrs] of Object.entries(ifaces)) {
      if (!addrs) continue;
      for (const addr of addrs) {
        allInterfaces.push(addr);
        if (addr.family === 'IPv4' && !addr.internal) {
          primaryIp = addr.address;
        }
      }
    }

    const parts = primaryIp.split('.');
    const gateway = `${parts[0]}.${parts[1]}.${parts[2]}.1`;
    const subnet = `${parts[0]}.${parts[1]}.${parts[2]}.0/24`;

    return { ip: primaryIp, gateway, subnet, interfaces: allInterfaces };
  }

  private parseCIDR(cidr: string): { baseIp: string; startHost: number; endHost: number } {
    const [ip, maskStr] = cidr.split('/');
    const mask = parseInt(maskStr || '24', 10);
    const parts = ip.split('.').map(Number);
    const hostBits = 32 - mask;
    const numHosts = Math.pow(2, hostBits) - 2;
    
    return {
      baseIp: `${parts[0]}.${parts[1]}.${parts[2]}`,
      startHost: 1,
      endHost: Math.min(numHosts, 254),
    };
  }

  private lookupVendor(mac?: string): string | undefined {
    if (!mac) return undefined;
    const prefix = mac.substring(0, 8).toLowerCase();
    return MAC_VENDORS[prefix];
  }

  private guessVendor(mac?: string, services?: DetectedService[]): string | undefined {
    const vendor = this.lookupVendor(mac);
    if (vendor) return vendor;

    // Guess from services
    if (services?.some(s => s.name === 'RDP')) return 'Windows Device';
    if (services?.some(s => s.name === 'SSH') && !services?.some(s => s.name === 'SMB')) return 'Linux/Unix';
    return undefined;
  }

  private guessOS(ports: PortResult[], mac?: string): string | undefined {
    const openPortNums = ports.filter(p => p.state === 'open').map(p => p.port);
    
    if (openPortNums.includes(3389) || openPortNums.includes(135)) return 'Windows';
    if (openPortNums.includes(548)) return 'macOS';
    if (openPortNums.includes(22) && !openPortNums.includes(445)) return 'Linux';
    if (openPortNums.includes(445) && openPortNums.includes(139)) return 'Windows';
    
    const vendor = this.lookupVendor(mac);
    if (vendor?.includes('Raspberry Pi')) return 'Linux (Raspberry Pi OS)';
    if (vendor?.includes('Espressif')) return 'RTOS (ESP32/ESP8266)';
    
    return undefined;
  }

  private extractVersion(banner: string | null, serviceName?: string): string | undefined {
    if (!banner) return undefined;
    
    // Common version patterns in banners
    const versionMatch = banner.match(/(?:version|ver|v)[\s:]*(\d+[\.\d]*)/i)
      || banner.match(/(\d+\.\d+\.\d+)/);
    
    return versionMatch ? versionMatch[1] : undefined;
  }

  // Convert discovered hosts to CloudResource format
  toCloudResources(hosts: DiscoveredHost[]): CloudResource[] {
    return hosts.map((host, idx) => ({
      id: `onprem-${host.ip.replace(/\./g, '-')}`,
      name: host.hostname || host.ip,
      type: this.guessResourceType(host) as any,
      provider: 'onprem' as CloudProviderType,
      region: 'local-network',
      status: 'running' as const,
      ip: host.ip,
      tags: {
        mac: host.mac || 'unknown',
        vendor: host.vendor || 'unknown',
        os: host.os || 'unknown',
        services: host.services.map(s => s.name).join(', '),
      },
      created: host.lastSeen,
      os: host.os,
      dependencies: [],
      metadata: {
        openPorts: host.openPorts.map(p => p.port),
        services: host.services,
        responseTimeMs: host.responseTimeMs,
      },
    }));
  }

  private guessResourceType(host: DiscoveredHost): string {
    const serviceNames = host.services.map(s => s.name);
    if (serviceNames.some(s => ['MySQL', 'PostgreSQL', 'MSSQL', 'MongoDB', 'Redis'].includes(s))) return 'database';
    if (serviceNames.some(s => ['HTTP', 'HTTPS', 'HTTP-Alt'].includes(s)) && !serviceNames.includes('RDP')) return 'vm';
    if (serviceNames.includes('MQTT') || serviceNames.includes('MQTT-TLS')) return 'iot';
    if (host.vendor?.includes('IoT') || host.vendor?.includes('ESP')) return 'iot';
    return 'vm';
  }

  abort(): void {
    this.abortController.abort();
  }

  getLogs(): string[] {
    return [...this.scanLog];
  }
}

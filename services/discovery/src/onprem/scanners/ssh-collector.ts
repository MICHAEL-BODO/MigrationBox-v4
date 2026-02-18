/**
 * MigrationBox V5.0 - SSH Host Collector (Layer 4)
 * 
 * Deep OS & software inventory collection via SSH.
 * Connects to Linux/Unix hosts and collects:
 *   - OS info (distro, kernel, arch, uptime)
 *   - Hardware (CPU, memory, disks, NICs, serial)
 *   - Packages (RPM/DEB/Snap)
 *   - Running services and their ports
 *   - Scheduled tasks (cron)
 *   - SSL certificates
 *   - Firewall rules (iptables/firewalld/ufw)
 *   - Local users & groups
 */

import { BaseScanner, ScanContext } from '../../engine/scanner-registry';
import {
  HostInventory, OSInfo, HardwareInfo, SoftwareInventory,
  ServiceInfo, DiskInfo, NICInfo, CertificateInfo,
  FirewallRule, UserInfo, ScheduledTask, ScannerConfig,
} from '../types/onprem-types';
import { Client as SSHClient, ConnectConfig } from 'ssh2';

export interface SSHScanConfig extends ScannerConfig {
  options: {
    /** IP addresses or hostnames to collect from */
    hosts: string[];
    /** Credentials (can also be per-host via credentialMap) */
    globalCredentials?: {
      username: string;
      password?: string;
      privateKey?: string;
    };
    /** Per-host credentials override (key = IP or hostname) */
    credentialMap?: Record<string, { username: string; password?: string; privateKey?: string }>;
    /** SSH port (default: 22) */
    port?: number;
    /** Connection timeout in ms (default: 10000) */
    timeout?: number;
    /** Commands timeout in ms (default: 30000) */
    commandTimeout?: number;
    /** Max concurrent SSH sessions (default: 10) */
    concurrency?: number;
  };
}

interface SSHCollectionData {
  hosts: HostInventory[];
  failed: Array<{ host: string; error: string }>;
}

export class SSHCollector extends BaseScanner<SSHScanConfig, SSHCollectionData> {
  readonly id = 'ssh-collector';
  readonly name = 'SSH Host Collector (Layer 4)';
  readonly version = '2.0.0';
  readonly layer = 4;
  readonly dependencies = ['network-scanner'];

  async validate(config: SSHScanConfig): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];
    if (!config.options?.hosts?.length) errors.push('At least one host is required');
    if (!config.options?.globalCredentials && !config.options?.credentialMap) {
      errors.push('Credentials are required (globalCredentials or credentialMap)');
    }
    return { valid: errors.length === 0, errors };
  }

  async estimateDuration(config: SSHScanConfig): Promise<{ minSeconds: number; maxSeconds: number }> {
    const hosts = config.options?.hosts?.length || 0;
    const concurrency = config.options?.concurrency || 10;
    const perHost = 15; // ~15s per host for full collection
    return {
      minSeconds: Math.ceil(hosts / concurrency) * perHost,
      maxSeconds: Math.ceil(hosts / concurrency) * perHost * 2,
    };
  }

  protected async execute(config: SSHScanConfig, context: ScanContext): Promise<SSHCollectionData> {
    const hosts: HostInventory[] = [];
    const failed: Array<{ host: string; error: string }> = [];
    const opts = config.options;
    const concurrency = opts.concurrency || 10;

    // Process hosts in batches
    const batches = this.chunk(opts.hosts, concurrency);

    for (const batch of batches) {
      if (context.signal.aborted) break;

      const results = await Promise.allSettled(
        batch.map(host => this.collectHost(host, opts, context))
      );

      for (let i = 0; i < results.length; i++) {
        const result = results[i];
        if (result.status === 'fulfilled') {
          hosts.push(result.value);
          this.itemsDiscovered++;
        } else {
          failed.push({ host: batch[i], error: String(result.reason) });
          this.addError(batch[i], String(result.reason));
        }
      }

      context.events.emit('scanner:progress', {
        scannerId: this.id,
        completed: hosts.length + failed.length,
        total: opts.hosts.length,
      });
    }

    return { hosts, failed };
  }

  // ──────────────────────────────────────────
  // Per-host collection
  // ──────────────────────────────────────────

  private async collectHost(host: string, opts: SSHScanConfig['options'], context: ScanContext): Promise<HostInventory> {
    const creds = opts.credentialMap?.[host] || opts.globalCredentials!;
    const port = opts.port || 22;
    const timeout = opts.timeout || 10000;
    const cmdTimeout = opts.commandTimeout || 30000;

    context.log.info(`Collecting inventory from ${host}`);

    const conn = await this.connect({
      host,
      port,
      username: creds.username,
      password: creds.password,
      privateKey: creds.privateKey,
      readyTimeout: timeout,
      algorithms: {
        kex: [
          'ecdh-sha2-nistp256', 'ecdh-sha2-nistp384', 'ecdh-sha2-nistp521',
          'diffie-hellman-group-exchange-sha256', 'diffie-hellman-group14-sha256',
          'diffie-hellman-group14-sha1',
        ],
      },
    });

    try {
      const exec = (cmd: string) => this.sshExec(conn, cmd, cmdTimeout);

      // Parallel collection of all data points
      const [
        osInfo, hwInfo, packages, services,
        crontabs, certs, firewallRules, users,
        hostname, envVars,
      ] = await Promise.allSettled([
        this.collectOS(exec),
        this.collectHardware(exec),
        this.collectPackages(exec),
        this.collectServices(exec),
        this.collectCrontabs(exec),
        this.collectCertificates(exec),
        this.collectFirewall(exec),
        this.collectUsers(exec),
        exec('hostname -f 2>/dev/null || hostname'),
        exec('env 2>/dev/null | head -200'),
      ]);

      const resolveOrDefault = <T>(r: PromiseSettledResult<T>, def: T): T =>
        r.status === 'fulfilled' ? r.value : def;

      const envObj: Record<string, string> = {};
      if (envVars.status === 'fulfilled') {
        for (const line of envVars.value.split('\n')) {
          const eq = line.indexOf('=');
          if (eq > 0) envObj[line.slice(0, eq)] = line.slice(eq + 1);
        }
      }

      return {
        hostId: host,
        hostname: resolveOrDefault(hostname, host).trim(),
        ip: host,
        os: resolveOrDefault(osInfo, this.defaultOS()),
        hardware: resolveOrDefault(hwInfo, this.defaultHW()),
        software: {
          packages: resolveOrDefault(packages, []),
          services: resolveOrDefault(services, []),
          scheduledTasks: resolveOrDefault(crontabs, []),
          certificates: resolveOrDefault(certs, []),
          environmentVariables: envObj,
          firewallRules: resolveOrDefault(firewallRules, []),
          users: resolveOrDefault(users, []),
        },
        collectedAt: new Date().toISOString(),
        collectionMethod: 'ssh',
      };

    } finally {
      conn.end();
    }
  }

  // ──────────────────────────────────────────
  // Collection methods
  // ──────────────────────────────────────────

  private async collectOS(exec: (cmd: string) => Promise<string>): Promise<OSInfo> {
    const [osRelease, kernel, arch, uptime] = await Promise.all([
      exec('cat /etc/os-release 2>/dev/null || cat /etc/redhat-release 2>/dev/null'),
      exec('uname -r'),
      exec('uname -m'),
      exec("awk '{print $1}' /proc/uptime 2>/dev/null || uptime"),
    ]);

    // Parse os-release
    const osFields: Record<string, string> = {};
    for (const line of osRelease.split('\n')) {
      const m = line.match(/^(\w+)="?([^"]*)"?$/);
      if (m) osFields[m[1]] = m[2];
    }

    return {
      family: 'linux',
      distribution: osFields['ID'] || osFields['NAME'] || 'unknown',
      version: osFields['VERSION_ID'] || osFields['VERSION'] || 'unknown',
      kernel: kernel.trim(),
      architecture: arch.trim() as any,
      uptime: parseFloat(uptime) || 0,
    };
  }

  private async collectHardware(exec: (cmd: string) => Promise<string>): Promise<HardwareInfo> {
    const [dmidecode, cpuInfo, memInfo, lsblk, ipAddr] = await Promise.all([
      exec('sudo dmidecode -t system 2>/dev/null || echo ""'),
      exec('lscpu 2>/dev/null || cat /proc/cpuinfo | head -40'),
      exec('cat /proc/meminfo | head -10'),
      exec('lsblk -Jb 2>/dev/null || df -B1'),
      exec("ip -j addr show 2>/dev/null || ip addr show"),
    ]);

    // Parse CPU
    const coresMatch = cpuInfo.match(/CPU\(s\):\s+(\d+)/);
    const threadsMatch = cpuInfo.match(/Thread\(s\) per core:\s+(\d+)/);
    const modelMatch = cpuInfo.match(/Model name:\s+(.+)/);

    // Parse memory
    const memMatch = memInfo.match(/MemTotal:\s+(\d+)/);
    const memGB = memMatch ? Math.round(parseInt(memMatch[1]) / 1024 / 1024) : 0;

    // Parse disks from lsblk JSON
    let disks: DiskInfo[] = [];
    try {
      const lsblkJson = JSON.parse(lsblk);
      disks = (lsblkJson.blockdevices || [])
        .filter((d: any) => d.type === 'disk')
        .map((d: any) => ({
          device: `/dev/${d.name}`,
          type: d.rota === '0' ? 'ssd' : 'hdd',
          sizeGB: Math.round(parseInt(d.size) / 1024 / 1024 / 1024),
          model: d.model || 'unknown',
          filesystem: d.fstype || '',
          mountPoint: d.mountpoint || '',
          usedPercent: 0,
        }));
    } catch { /* Fallback — not JSON */ }

    // Parse NICs
    let nics: NICInfo[] = [];
    try {
      const ipJson = JSON.parse(ipAddr);
      nics = ipJson
        .filter((iface: any) => iface.ifname !== 'lo')
        .map((iface: any) => ({
          name: iface.ifname,
          mac: iface.address || '',
          ipv4: (iface.addr_info || [])
            .filter((a: any) => a.family === 'inet')
            .map((a: any) => a.local),
          ipv6: (iface.addr_info || [])
            .filter((a: any) => a.family === 'inet6')
            .map((a: any) => a.local),
          speed: '',
          driver: '',
          duplex: '',
        }));
    } catch { /* Fallback — not JSON */ }

    // Parse DMI for manufacturer/model
    const manufacturer = dmidecode.match(/Manufacturer:\s+(.+)/)?.[1] || 'unknown';
    const model = dmidecode.match(/Product Name:\s+(.+)/)?.[1] || 'unknown';
    const serial = dmidecode.match(/Serial Number:\s+(.+)/)?.[1] || 'unknown';

    return {
      manufacturer: manufacturer.trim(),
      model: model.trim(),
      serialNumber: serial.trim(),
      biosVersion: '',
      cpuModel: modelMatch?.[1]?.trim() || 'unknown',
      cpuCores: parseInt(coresMatch?.[1] || '0'),
      cpuThreads: parseInt(threadsMatch?.[1] || '1') * parseInt(coresMatch?.[1] || '0'),
      memoryGB: memGB,
      memoryModules: [],
      disks,
      networkInterfaces: nics,
    };
  }

  private async collectPackages(exec: (cmd: string) => Promise<string>): Promise<SoftwareInventory['packages']> {
    // Try RPM first, then DEB
    const rpm = await exec("rpm -qa --qf '%{NAME} %{VERSION}\\n' 2>/dev/null | head -500");
    if (rpm.trim()) {
      return rpm.trim().split('\n').map(line => {
        const [name, version] = line.split(' ');
        return { name, version: version || '', source: 'rpm' as const };
      });
    }

    const deb = await exec("dpkg-query -W -f='${Package} ${Version}\\n' 2>/dev/null | head -500");
    if (deb.trim()) {
      return deb.trim().split('\n').map(line => {
        const [name, version] = line.split(' ');
        return { name, version: version || '', source: 'deb' as const };
      });
    }

    return [];
  }

  private async collectServices(exec: (cmd: string) => Promise<string>): Promise<ServiceInfo[]> {
    const systemctl = await exec(
      "systemctl list-units --type=service --all --no-pager --plain 2>/dev/null | head -200"
    );
    const services: ServiceInfo[] = [];

    for (const line of systemctl.split('\n').slice(1)) {
      const parts = line.trim().split(/\s+/);
      if (parts.length < 4) continue;
      const name = parts[0].replace('.service', '');
      const status = parts[2] === 'active' ? 'running' : parts[2] === 'inactive' ? 'stopped' : 'disabled';

      services.push({
        name,
        displayName: name,
        status: status as any,
        startType: 'auto',
        user: '',
        binary: '',
      });
    }

    // Enrich with listening ports from ss
    const ss = await exec("ss -tlnp 2>/dev/null | tail -n +2 | head -100");
    for (const line of ss.split('\n')) {
      const portMatch = line.match(/:(\d+)\s/);
      const pidMatch = line.match(/pid=(\d+)/);
      const nameMatch = line.match(/users:\(\("([^"]+)"/);
      if (portMatch && nameMatch) {
        const svc = services.find(s => s.name === nameMatch[1]);
        if (svc) {
          svc.ports = svc.ports || [];
          svc.ports.push(parseInt(portMatch[1]));
          if (pidMatch) svc.pid = parseInt(pidMatch[1]);
        }
      }
    }

    return services;
  }

  private async collectCrontabs(exec: (cmd: string) => Promise<string>): Promise<ScheduledTask[]> {
    const crontab = await exec("cat /etc/crontab 2>/dev/null; ls /etc/cron.d/ 2>/dev/null | head -50");
    const userCrontab = await exec("crontab -l 2>/dev/null | head -50");
    const tasks: ScheduledTask[] = [];

    for (const line of [...crontab.split('\n'), ...userCrontab.split('\n')]) {
      if (line.startsWith('#') || !line.trim()) continue;
      const m = line.match(/^(\S+\s+\S+\s+\S+\s+\S+\s+\S+)\s+(.+)$/);
      if (m) {
        tasks.push({
          name: m[2].slice(0, 60),
          schedule: m[1],
          command: m[2],
          enabled: true,
        });
      }
    }

    return tasks;
  }

  private async collectCertificates(exec: (cmd: string) => Promise<string>): Promise<CertificateInfo[]> {
    const findCerts = await exec(
      "find /etc/ssl /etc/pki -name '*.pem' -o -name '*.crt' 2>/dev/null | head -20"
    );
    const certs: CertificateInfo[] = [];

    for (const path of findCerts.split('\n').filter(Boolean)) {
      const info = await exec(
        `openssl x509 -in "${path}" -noout -subject -issuer -dates -text 2>/dev/null | head -20`
      );
      const subject = info.match(/subject\s*=\s*(.*)/i)?.[1] || path;
      const issuer = info.match(/issuer\s*=\s*(.*)/i)?.[1] || '';
      const notBefore = info.match(/notBefore\s*=\s*(.*)/i)?.[1] || '';
      const notAfter = info.match(/notAfter\s*=\s*(.*)/i)?.[1] || '';

      const expiryDate = notAfter ? new Date(notAfter) : new Date();
      const daysUntilExpiry = Math.ceil((expiryDate.getTime() - Date.now()) / 86400000);

      certs.push({
        subject: subject.trim(),
        issuer: issuer.trim(),
        validFrom: notBefore.trim(),
        validTo: notAfter.trim(),
        keySize: 0,
        selfSigned: subject === issuer,
        daysUntilExpiry,
        path,
      });
    }

    return certs;
  }

  private async collectFirewall(exec: (cmd: string) => Promise<string>): Promise<FirewallRule[]> {
    const iptables = await exec("sudo iptables -L -n --line-numbers 2>/dev/null | head -50");
    const rules: FirewallRule[] = [];

    for (const line of iptables.split('\n')) {
      const m = line.match(/^\d+\s+(ACCEPT|DROP|REJECT)\s+(\S+)\s+--\s+(\S+)\s+(\S+)\s*(.*)/);
      if (m) {
        const portMatch = m[5]?.match(/dpt:(\d+)/);
        rules.push({
          direction: 'inbound',
          action: m[1] === 'ACCEPT' ? 'allow' : 'deny',
          protocol: m[2],
          port: portMatch?.[1] || '*',
          source: m[3],
          destination: m[4],
        });
      }
    }

    return rules;
  }

  private async collectUsers(exec: (cmd: string) => Promise<string>): Promise<UserInfo[]> {
    const passwd = await exec("getent passwd 2>/dev/null || cat /etc/passwd");
    const lastlog = await exec("lastlog 2>/dev/null | tail -n +2 | head -50");
    const users: UserInfo[] = [];

    for (const line of passwd.split('\n')) {
      const parts = line.split(':');
      if (parts.length < 7) continue;
      const [name, , uidStr, , , , shell] = parts;
      const uid = parseInt(uidStr);

      // Get groups
      const groupsOut = await exec(`groups ${name} 2>/dev/null`);
      const groups = groupsOut.includes(':')
        ? groupsOut.split(':')[1].trim().split(/\s+/)
        : [];

      const isServiceAccount = uid < 1000 || shell.includes('nologin') || shell.includes('false');

      users.push({
        name,
        uid,
        groups,
        shell,
        isServiceAccount,
      });
    }

    return users.slice(0, 100); // Cap at 100
  }

  // ──────────────────────────────────────────
  // SSH connection helpers
  // ──────────────────────────────────────────

  private connect(config: ConnectConfig): Promise<SSHClient> {
    return new Promise((resolve, reject) => {
      const conn = new SSHClient();
      conn.on('ready', () => resolve(conn));
      conn.on('error', reject);
      conn.connect(config);
    });
  }

  private sshExec(conn: SSHClient, command: string, timeout: number): Promise<string> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error(`Command timed out: ${command.slice(0, 60)}`)), timeout);

      conn.exec(command, (err, stream) => {
        if (err) { clearTimeout(timer); return reject(err); }

        let stdout = '';
        let stderr = '';

        stream.on('data', (data: Buffer) => { stdout += data.toString(); });
        stream.stderr.on('data', (data: Buffer) => { stderr += data.toString(); });
        stream.on('close', () => {
          clearTimeout(timer);
          resolve(stdout || stderr);
        });
      });
    });
  }

  private defaultOS(): OSInfo {
    return { family: 'linux', distribution: 'unknown', version: '', kernel: '', architecture: 'x86_64', uptime: 0 };
  }

  private defaultHW(): HardwareInfo {
    return { manufacturer: '', model: '', serialNumber: '', biosVersion: '', cpuModel: '', cpuCores: 0, cpuThreads: 0, memoryGB: 0, memoryModules: [], disks: [], networkInterfaces: [] };
  }

  private chunk<T>(arr: T[], size: number): T[][] {
    const c: T[][] = [];
    for (let i = 0; i < arr.length; i += size) c.push(arr.slice(i, i + size));
    return c;
  }
}

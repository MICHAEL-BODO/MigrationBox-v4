/**
 * MigrationBox V5.0 - Application Fingerprinter (Layer 5)
 * 
 * Identifies databases, web servers, middleware, CI/CD, and monitoring tools
 * using a 5-signal detection approach:
 *   1. Port fingerprint (from Layer 1)
 *   2. Process name matching (from Layer 4)
 *   3. Package inventory check (from Layer 4)
 *   4. Config file detection (from Layer 4)
 *   5. AI classification (deferred to Layer 7)
 * 
 * Each detection is scored with a confidence level and multiple signal
 * confirmations raise confidence, reducing false positives.
 */

import { BaseScanner, ScanContext } from '../../engine/scanner-registry';
import {
  ApplicationDiscovery, DiscoveredDatabase, DiscoveredWebServer,
  DiscoveredMiddleware, DiscoveredCICD, DiscoveredMonitoring,
  DetectionSignal, DatabaseEngine, WebServerEngine,
  NetworkScanResult, HostInventory, ScannerConfig,
} from '../types/onprem-types';

export interface AppFingerprinterConfig extends ScannerConfig {
  options?: {
    /** Minimum confidence to report a detection (0.0 - 1.0) */
    minConfidence?: number;
  };
}

// ────────────────────────────────────────────────────────────
// Signature database: maps signals to application identities
// ────────────────────────────────────────────────────────────

interface AppSignature {
  type: 'database' | 'webserver' | 'middleware' | 'cicd' | 'monitoring';
  engine: string;
  ports: number[];
  processNames: string[];
  packageNames: string[];
  configPaths: string[];
  cloudEquivalent: string;
}

const SIGNATURES: AppSignature[] = [
  // ─── Databases ───
  { type: 'database', engine: 'mysql', ports: [3306], processNames: ['mysqld', 'mariadbd'],
    packageNames: ['mysql-server', 'mariadb-server', 'mysql-community-server'],
    configPaths: ['/etc/mysql/', '/etc/my.cnf'], cloudEquivalent: 'Cloud SQL / RDS MySQL' },
  { type: 'database', engine: 'postgresql', ports: [5432], processNames: ['postgres', 'postmaster'],
    packageNames: ['postgresql', 'postgresql-server', 'postgresql-15'],
    configPaths: ['/etc/postgresql/', '/var/lib/pgsql/'], cloudEquivalent: 'Cloud SQL / RDS PostgreSQL' },
  { type: 'database', engine: 'sqlserver', ports: [1433, 1434], processNames: ['sqlservr'],
    packageNames: ['mssql-server'], configPaths: ['/opt/mssql/'], cloudEquivalent: 'Azure SQL / RDS SQL Server' },
  { type: 'database', engine: 'oracle', ports: [1521, 1522], processNames: ['ora_pmon', 'tnslsnr'],
    packageNames: ['oracle-database'], configPaths: ['/opt/oracle/'], cloudEquivalent: 'Oracle Cloud DB / RDS Oracle' },
  { type: 'database', engine: 'mongodb', ports: [27017, 27018, 27019], processNames: ['mongod', 'mongos'],
    packageNames: ['mongodb-server', 'mongodb-org-server'],
    configPaths: ['/etc/mongod.conf'], cloudEquivalent: 'MongoDB Atlas / DocumentDB' },
  { type: 'database', engine: 'redis', ports: [6379, 6380], processNames: ['redis-server'],
    packageNames: ['redis', 'redis-server'],
    configPaths: ['/etc/redis/'], cloudEquivalent: 'Memorystore / ElastiCache Redis' },
  { type: 'database', engine: 'elasticsearch', ports: [9200, 9300], processNames: ['java'],
    packageNames: ['elasticsearch'],
    configPaths: ['/etc/elasticsearch/'], cloudEquivalent: 'Elastic Cloud / OpenSearch' },
  { type: 'database', engine: 'cassandra', ports: [9042, 9160], processNames: ['java'],
    packageNames: ['cassandra'],
    configPaths: ['/etc/cassandra/'], cloudEquivalent: 'Bigtable / Keyspaces' },

  // ─── Web Servers ───
  { type: 'webserver', engine: 'nginx', ports: [80, 443], processNames: ['nginx'],
    packageNames: ['nginx', 'nginx-common'],
    configPaths: ['/etc/nginx/'], cloudEquivalent: 'Cloud Load Balancer / ALB' },
  { type: 'webserver', engine: 'apache', ports: [80, 443], processNames: ['httpd', 'apache2'],
    packageNames: ['httpd', 'apache2'],
    configPaths: ['/etc/httpd/', '/etc/apache2/'], cloudEquivalent: 'Cloud Load Balancer / ALB' },
  { type: 'webserver', engine: 'iis', ports: [80, 443], processNames: ['w3wp'],
    packageNames: [], configPaths: [], cloudEquivalent: 'Azure App Service' },
  { type: 'webserver', engine: 'tomcat', ports: [8080, 8443], processNames: ['java'],
    packageNames: ['tomcat', 'tomcat9'],
    configPaths: ['/etc/tomcat/', '/opt/tomcat/'], cloudEquivalent: 'App Engine / Elastic Beanstalk' },

  // ─── Middleware ───
  { type: 'middleware', engine: 'rabbitmq', ports: [5672, 15672], processNames: ['beam.smp', 'rabbitmq'],
    packageNames: ['rabbitmq-server'],
    configPaths: ['/etc/rabbitmq/'], cloudEquivalent: 'Pub/Sub / SQS' },
  { type: 'middleware', engine: 'kafka', ports: [9092, 9093], processNames: ['java'],
    packageNames: ['kafka'],
    configPaths: ['/opt/kafka/', '/etc/kafka/'], cloudEquivalent: 'Pub/Sub / MSK' },
  { type: 'middleware', engine: 'activemq', ports: [61616, 8161], processNames: ['java'],
    packageNames: ['activemq'],
    configPaths: ['/opt/activemq/'], cloudEquivalent: 'Pub/Sub / Amazon MQ' },

  // ─── CI/CD ───
  { type: 'cicd', engine: 'jenkins', ports: [8080, 8443], processNames: ['java'],
    packageNames: ['jenkins'],
    configPaths: ['/var/lib/jenkins/', '/etc/default/jenkins'], cloudEquivalent: 'Cloud Build / CodePipeline' },
  { type: 'cicd', engine: 'gitlab', ports: [80, 443], processNames: ['gitlab-workhorse', 'unicorn'],
    packageNames: ['gitlab-ce', 'gitlab-ee'],
    configPaths: ['/etc/gitlab/'], cloudEquivalent: 'GitHub Actions / GitLab SaaS' },

  // ─── Monitoring ───
  { type: 'monitoring', engine: 'prometheus', ports: [9090], processNames: ['prometheus'],
    packageNames: ['prometheus'],
    configPaths: ['/etc/prometheus/'], cloudEquivalent: 'Cloud Monitoring / CloudWatch' },
  { type: 'monitoring', engine: 'grafana', ports: [3000], processNames: ['grafana-server'],
    packageNames: ['grafana'],
    configPaths: ['/etc/grafana/'], cloudEquivalent: 'Cloud Monitoring / CloudWatch Dashboards' },
  { type: 'monitoring', engine: 'nagios', ports: [5666], processNames: ['nagios'],
    packageNames: ['nagios', 'nagios-core'],
    configPaths: ['/etc/nagios/'], cloudEquivalent: 'Cloud Monitoring / CloudWatch' },
  { type: 'monitoring', engine: 'zabbix', ports: [10050, 10051], processNames: ['zabbix_server', 'zabbix_agentd'],
    packageNames: ['zabbix-server', 'zabbix-agent'],
    configPaths: ['/etc/zabbix/'], cloudEquivalent: 'Cloud Monitoring / CloudWatch' },
];

export class AppFingerprinter extends BaseScanner<AppFingerprinterConfig, ApplicationDiscovery> {
  readonly id = 'app-fingerprinter';
  readonly name = 'Application Fingerprinter (Layer 5)';
  readonly version = '2.0.0';
  readonly layer = 5;
  readonly dependencies = ['network-scanner', 'ssh-collector'];

  protected async execute(config: AppFingerprinterConfig, context: ScanContext): Promise<ApplicationDiscovery> {
    const minConfidence = config.options?.minConfidence ?? 0.3;

    // Get Layer 1 and Layer 4 results
    const networkResult = context.previousResults.get('network-scanner');
    const sshResult = context.previousResults.get('ssh-collector');
    const winrmResult = context.previousResults.get('winrm-collector');

    const networkHosts: NetworkScanResult[] = networkResult?.data?.hosts || [];
    const inventoryHosts: HostInventory[] = [
      ...(sshResult?.data?.hosts || []),
      ...(winrmResult?.data?.hosts || []),
    ];

    const discovery: ApplicationDiscovery = {
      databases: [],
      webServers: [],
      middleware: [],
      containers: [],
      cicd: [],
      monitoring: [],
    };

    // For each discovered host, check all signatures
    for (const netHost of networkHosts) {
      const inventory = inventoryHosts.find(h => h.ip === netHost.host);

      for (const sig of SIGNATURES) {
        const signals: DetectionSignal[] = [];

        // Signal 1: Port fingerprint
        const matchedPorts = sig.ports.filter(p =>
          netHost.ports.some(hp => hp.port === p && hp.state === 'open')
        );
        if (matchedPorts.length > 0) {
          signals.push({
            method: 'port-fingerprint',
            confidence: 0.4,
            evidence: `Open ports: ${matchedPorts.join(', ')}`,
          });
        }

        if (inventory) {
          // Signal 2: Process name
          const matchedProcesses = sig.processNames.filter(pn =>
            inventory.software.services.some(s => s.name.includes(pn) && s.status === 'running')
          );
          if (matchedProcesses.length > 0) {
            signals.push({
              method: 'process-name',
              confidence: 0.6,
              evidence: `Running processes: ${matchedProcesses.join(', ')}`,
            });
          }

          // Signal 3: Package check
          const matchedPackages = sig.packageNames.filter(pkg =>
            inventory.software.packages.some(p => p.name.includes(pkg))
          );
          if (matchedPackages.length > 0) {
            signals.push({
              method: 'package-check',
              confidence: 0.7,
              evidence: `Installed packages: ${matchedPackages.join(', ')}`,
            });
          }

          // Signal 4: Config file detection (check env vars for paths)
          const matchedConfigs = sig.configPaths.filter(path =>
            inventory.software.packages.some(p => p.name.includes(sig.engine)) ||
            Object.values(inventory.software.environmentVariables || {}).some(v => v.includes(path))
          );
          if (matchedConfigs.length > 0) {
            signals.push({
              method: 'config-file',
              confidence: 0.5,
              evidence: `Config paths detected: ${matchedConfigs.join(', ')}`,
            });
          }
        }

        // If no signals found, skip this signature
        if (signals.length === 0) continue;

        // Calculate combined confidence (each confirming signal raises it)
        const confidence = this.combinedConfidence(signals);
        if (confidence < minConfidence) continue;

        // Determine version from package or service info
        const version = this.detectVersion(sig, inventory);

        // Create the discovered application
        switch (sig.type) {
          case 'database':
            discovery.databases.push({
              engine: sig.engine as DatabaseEngine,
              version,
              port: matchedPorts[0] || sig.ports[0],
              host: netHost.host,
              databases: [],
              sizeGB: 0,
              connectionCount: 0,
              cloudEquivalent: sig.cloudEquivalent,
              detectionSignals: signals,
            } as DiscoveredDatabase);
            break;

          case 'webserver':
            discovery.webServers.push({
              engine: sig.engine as WebServerEngine,
              version,
              host: netHost.host,
              vhosts: [],
              cloudEquivalent: sig.cloudEquivalent,
              detectionSignals: signals,
            } as DiscoveredWebServer);
            break;

          case 'middleware':
            discovery.middleware.push({
              type: sig.engine === 'kafka' ? 'streaming' : sig.engine === 'rabbitmq' || sig.engine === 'activemq' ? 'mq' : 'cache',
              engine: sig.engine,
              version,
              host: netHost.host,
              port: matchedPorts[0] || sig.ports[0],
              cloudEquivalent: sig.cloudEquivalent,
              detectionSignals: signals,
            } as DiscoveredMiddleware);
            break;

          case 'cicd':
            discovery.cicd.push({
              engine: sig.engine as any,
              version,
              host: netHost.host,
              jobCount: 0,
              agentCount: 0,
            } as DiscoveredCICD);
            break;

          case 'monitoring':
            discovery.monitoring.push({
              engine: sig.engine as any,
              version,
              host: netHost.host,
              targets: 0,
              cloudEquivalent: sig.cloudEquivalent,
            } as DiscoveredMonitoring);
            break;
        }

        this.itemsDiscovered++;
      }
    }

    context.log.info('Application fingerprinting complete', {
      databases: discovery.databases.length,
      webServers: discovery.webServers.length,
      middleware: discovery.middleware.length,
      cicd: discovery.cicd.length,
      monitoring: discovery.monitoring.length,
    });

    return discovery;
  }

  /**
   * Combined confidence: each confirming signal increases confidence.
   * Formula: 1 - Π(1 - confidence_i)
   * e.g., port(0.4) + process(0.6) = 1 - 0.6*0.4 = 0.76
   *        port(0.4) + process(0.6) + package(0.7) = 1 - 0.6*0.4*0.3 = 0.928
   */
  private combinedConfidence(signals: DetectionSignal[]): number {
    if (signals.length === 0) return 0;
    const complement = signals.reduce((acc, s) => acc * (1 - s.confidence), 1);
    return Math.round((1 - complement) * 1000) / 1000;
  }

  private detectVersion(sig: AppSignature, inventory?: HostInventory): string {
    if (!inventory) return 'unknown';

    // Check package version
    for (const pkgName of sig.packageNames) {
      const pkg = inventory.software.packages.find(p => p.name.includes(pkgName));
      if (pkg?.version) return pkg.version;
    }

    return 'unknown';
  }
}

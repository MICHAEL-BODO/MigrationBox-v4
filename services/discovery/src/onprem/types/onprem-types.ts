/**
 * MigrationBox V5.0 - On-Premises Discovery Types
 * 
 * Comprehensive type definitions for 7-layer deep scan architecture.
 * Covers network, infrastructure, virtualization, OS, applications,
 * dependencies, and AI intelligence.
 */

// ────────────────────────────────────────────────────────────
// Layer 1: Network Scan
// ────────────────────────────────────────────────────────────

export interface NetworkScanResult {
  host: string;
  mac?: string;
  hostname?: string;
  os?: { name: string; version: string; confidence: number };
  ports: PortInfo[];
  responseTime: number;
  classification: HostClassification;
  firstSeen: string;
  lastSeen: string;
}

export interface PortInfo {
  port: number;
  protocol: 'tcp' | 'udp';
  state: 'open' | 'filtered' | 'closed';
  service: string;
  version?: string;
  banner?: string;
}

export type HostClassification =
  | 'server'
  | 'workstation'
  | 'network-device'
  | 'storage'
  | 'printer'
  | 'iot'
  | 'unknown';

// ────────────────────────────────────────────────────────────
// Layer 2: Network Infrastructure
// ────────────────────────────────────────────────────────────

export interface NetworkDevice {
  id: string;
  type: NetworkDeviceType;
  vendor: string;
  model: string;
  firmware: string;
  hostname: string;
  managementIp: string;
  serialNumber?: string;
  interfaces: NetworkInterface[];
  vlans: VLAN[];
  routes: Route[];
  aclRules?: ACLRule[];
  snmpCommunity?: string;
  discoveredAt: string;
}

export type NetworkDeviceType =
  | 'switch'
  | 'router'
  | 'firewall'
  | 'load-balancer'
  | 'wireless-ap'
  | 'storage-array'
  | 'unknown';

export interface NetworkInterface {
  name: string;
  speed: string;
  status: 'up' | 'down' | 'admin-down';
  vlan?: number;
  ipAddress?: string;
  subnetMask?: string;
  connectedTo?: { deviceName: string; port: string };
  trafficStats: {
    inBytesPerSec: number;
    outBytesPerSec: number;
    inPacketsPerSec: number;
    outPacketsPerSec: number;
    errors: number;
    discards: number;
  };
}

export interface VLAN {
  id: number;
  name: string;
  subnets: string[];
  memberPorts: string[];
}

export interface Route {
  destination: string;
  nextHop: string;
  metric: number;
  protocol: 'static' | 'ospf' | 'bgp' | 'connected' | 'eigrp';
  interface?: string;
}

export interface ACLRule {
  id: string;
  action: 'permit' | 'deny';
  protocol: string;
  source: string;
  destination: string;
  port?: string;
  hitCount?: number;
}

export interface NetFlowRecord {
  sourceIp: string;
  destinationIp: string;
  sourcePort: number;
  destinationPort: number;
  protocol: 'tcp' | 'udp' | 'icmp' | 'other';
  bytesTransferred: number;
  packetsTransferred: number;
  startTime: string;
  endTime: string;
  tcpFlags?: number;
  exporterIp: string;
}

// ────────────────────────────────────────────────────────────
// Layer 3: Virtualization Platforms
// ────────────────────────────────────────────────────────────

export type VirtualizationPlatform =
  | 'vmware'
  | 'hyperv'
  | 'kvm'
  | 'proxmox'
  | 'nutanix'
  | 'kubernetes'
  | 'openshift'
  | 'docker-swarm';

export interface VMwareInventory {
  datacenters: VMwareDatacenter[];
  totalHosts: number;
  totalVMs: number;
  totalDatastores: number;
}

export interface VMwareDatacenter {
  name: string;
  clusters: VMwareCluster[];
  datastores: VMwareDatastore[];
}

export interface VMwareCluster {
  name: string;
  hosts: VMwareHost[];
  drsEnabled: boolean;
  drsAutomationLevel: 'fullyAutomated' | 'partiallyAutomated' | 'manual';
  haEnabled: boolean;
  resourcePools: string[];
}

export interface VMwareDatastore {
  name: string;
  type: string;
  capacityGB: number;
  freeGB: number;
  url: string;
  maintenanceMode: string;
  accessible: boolean;
  hosts: string[];
  vms: string[];
}

export interface VMwareHost {
  name: string;
  version: string;
  cpuModel: string;
  cpuCores: number;
  cpuThreads: number;
  memoryGB: number;
  datastores: string[];
  maintenanceMode: boolean;
  connectionState: 'connected' | 'disconnected' | 'notResponding';
  vms: VMwareVM[];
}

export interface VMwareVM {
  name: string;
  uuid: string;
  guestFullName: string;
  guestId: string;
  numCpu: number;
  memoryMB: number;
  ipAddress?: string;
  powerState: 'poweredOn' | 'poweredOff' | 'suspended';
  vmHardwareVersion: number;
  toolsStatus: 'running' | 'notRunning' | 'notInstalled';
  toolsVersion?: string;
  cbtEnabled: boolean;
  faultToleranceEnabled: boolean;
  haProtected: boolean;
  snapshots: Array<{ name: string; created: string; sizeGB: number }>;
  customAttributes: Record<string, string>;
  storage: Array<{
    label: string;
    capacityGB: number;
    thinProvisioned: boolean;
    datastore: string;
  }>;
  networks: Array<{
    network: string;
    ipAddress: string;
    macAddress: string;
  }>;
  performanceCounters?: VMPerformanceCounters;
}

export interface VMPerformanceCounters {
  cpuUsageMHz: number;
  cpuReady: number;
  memoryActiveKB: number;
  memorySwappedKB: number;
  diskReadLatencyMs: number;
  diskWriteLatencyMs: number;
  networkRxKBps: number;
  networkTxKBps: number;
}

export interface HyperVInventory {
  hosts: HyperVHost[];
  totalVMs: number;
}

export interface HyperVHost {
  name: string;
  version: string;
  cpuCores: number;
  memoryGB: number;
  vms: HyperVVM[];
  virtualSwitches: Array<{
    name: string;
    type: 'external' | 'internal' | 'private';
    vlanId?: number;
  }>;
}

export interface HyperVVM {
  name: string;
  id: string;
  generation: 1 | 2;
  state: 'Running' | 'Off' | 'Saved' | 'Paused';
  cpuCount: number;
  memoryMB: number;
  dynamicMemory: boolean;
  ipAddresses: string[];
  guestOs?: string;
  replicationEnabled: boolean;
  replicationState?: string;
  checkpoints: Array<{ name: string; created: string }>;
  disks: Array<{
    path: string;
    sizeGB: number;
    type: 'dynamic' | 'fixed' | 'differencing';
  }>;
}

export interface KubernetesInventory {
  clusterName: string;
  version: string;
  platform: 'kubernetes' | 'openshift' | 'rancher' | 'k3s';
  nodes: K8sNode[];
  namespaces: K8sNamespace[];
  persistentVolumes: K8sPV[];
  ingresses: K8sIngress[];
}

export interface K8sNode {
  name: string;
  role: 'control-plane' | 'worker';
  os: string;
  kernelVersion: string;
  containerRuntime: string;
  cpuCapacity: number;
  memoryCapacityGB: number;
  podsCapacity: number;
  conditions: Array<{ type: string; status: string }>;
}

export interface K8sNamespace {
  name: string;
  deployments: Array<{
    name: string;
    replicas: number;
    containers: Array<{ image: string; ports: number[]; resources: any }>;
  }>;
  services: Array<{
    name: string;
    type: 'ClusterIP' | 'NodePort' | 'LoadBalancer';
    ports: Array<{ port: number; targetPort: number; protocol: string }>;
    selector: Record<string, string>;
  }>;
  configMaps: number;
  secrets: number;
}

export interface K8sPV {
  name: string;
  capacity: string;
  storageClass: string;
  status: 'Available' | 'Bound' | 'Released';
  accessModes: string[];
  claimRef?: { namespace: string; name: string };
}

export interface K8sIngress {
  name: string;
  namespace: string;
  hosts: string[];
  paths: Array<{ path: string; backend: string; port: number }>;
  tls: boolean;
}

// ────────────────────────────────────────────────────────────
// Layer 4: OS & Software Inventory
// ────────────────────────────────────────────────────────────

export interface HostInventory {
  hostId: string;
  hostname: string;
  ip: string;
  os: OSInfo;
  hardware: HardwareInfo;
  software: SoftwareInventory;
  collectedAt: string;
  collectionMethod: 'ssh' | 'winrm' | 'wmi' | 'agent';
}

export interface OSInfo {
  family: 'linux' | 'windows' | 'unix' | 'mainframe';
  distribution: string;
  version: string;
  kernel: string;
  architecture: 'x86_64' | 'aarch64' | 'ppc64le' | 's390x';
  uptime: number;
  lastPatched?: string;
  pendingUpdates?: number;
}

export interface HardwareInfo {
  manufacturer: string;
  model: string;
  serialNumber: string;
  biosVersion: string;
  cpuModel: string;
  cpuCores: number;
  cpuThreads: number;
  memoryGB: number;
  memoryModules: Array<{
    slot: string;
    type: string;
    speedMHz: number;
    sizeGB: number;
  }>;
  disks: DiskInfo[];
  networkInterfaces: NICInfo[];
  gpus?: Array<{ model: string; vram: string }>;
  raidController?: { model: string; level: string; disks: number };
}

export interface DiskInfo {
  device: string;
  type: 'hdd' | 'ssd' | 'nvme';
  sizeGB: number;
  model: string;
  smartHealth?: string;
  filesystem: string;
  mountPoint: string;
  usedPercent: number;
}

export interface NICInfo {
  name: string;
  mac: string;
  ipv4: string[];
  ipv6: string[];
  speed: string;
  driver: string;
  duplex: string;
  bonding?: { mode: string; slaves: string[] };
}

export interface SoftwareInventory {
  packages: Array<{
    name: string;
    version: string;
    source: 'rpm' | 'deb' | 'msi' | 'choco' | 'snap' | 'flatpak';
  }>;
  services: ServiceInfo[];
  scheduledTasks: ScheduledTask[];
  certificates: CertificateInfo[];
  environmentVariables: Record<string, string>;
  firewallRules: FirewallRule[];
  users: UserInfo[];
}

export interface ServiceInfo {
  name: string;
  displayName: string;
  status: 'running' | 'stopped' | 'disabled';
  startType: 'auto' | 'manual' | 'disabled';
  user: string;
  pid?: number;
  ports?: number[];
  binary: string;
  memoryMB?: number;
  cpuPercent?: number;
}

export interface ScheduledTask {
  name: string;
  schedule: string;
  command: string;
  lastRun?: string;
  nextRun?: string;
  enabled: boolean;
}

export interface CertificateInfo {
  subject: string;
  issuer: string;
  validFrom: string;
  validTo: string;
  keySize: number;
  selfSigned: boolean;
  daysUntilExpiry: number;
  path?: string;
}

export interface FirewallRule {
  direction: 'inbound' | 'outbound';
  action: 'allow' | 'deny';
  protocol: string;
  port: string;
  source: string;
  destination?: string;
}

export interface UserInfo {
  name: string;
  uid?: number;
  groups: string[];
  lastLogin?: string;
  shell?: string;
  isServiceAccount: boolean;
}

// ────────────────────────────────────────────────────────────
// Layer 5: Application Discovery
// ────────────────────────────────────────────────────────────

export type DatabaseEngine =
  | 'mysql' | 'mariadb' | 'postgresql' | 'sqlserver' | 'oracle'
  | 'mongodb' | 'redis' | 'elasticsearch' | 'cassandra'
  | 'db2' | 'informix' | 'couchdb' | 'neo4j';

export type WebServerEngine =
  | 'apache' | 'nginx' | 'iis' | 'tomcat' | 'wildfly'
  | 'weblogic' | 'websphere' | 'caddy' | 'traefik';

export type MiddlewareType = 'mq' | 'cache' | 'esb' | 'etl' | 'search' | 'streaming';

export interface DiscoveredDatabase {
  engine: DatabaseEngine;
  version: string;
  port: number;
  host: string;
  databases: string[];
  sizeGB: number;
  tableCount?: number;
  connectionCount: number;
  replication?: {
    role: 'primary' | 'replica' | 'standalone';
    peers: string[];
    lag?: number;
  };
  backup?: {
    lastBackup?: string;
    schedule?: string;
    retentionDays?: number;
  };
  cloudEquivalent: string;
  detectionSignals: DetectionSignal[];
}

export interface DiscoveredWebServer {
  engine: WebServerEngine;
  version: string;
  host: string;
  vhosts: Array<{
    serverName: string;
    port: number;
    documentRoot?: string;
    ssl: boolean;
    proxyPass?: string;
  }>;
  modules?: string[];
  cloudEquivalent: string;
  detectionSignals: DetectionSignal[];
}

export interface DiscoveredMiddleware {
  type: MiddlewareType;
  engine: string;
  version: string;
  host: string;
  port: number;
  queues?: string[];
  topics?: string[];
  clusterNodes?: string[];
  cloudEquivalent: string;
  detectionSignals: DetectionSignal[];
}

export interface DiscoveredContainer {
  platform: 'kubernetes' | 'openshift' | 'docker-swarm' | 'docker-compose';
  version: string;
  nodes: number;
  pods: number;
  namespaces: string[];
  persistentVolumes: number;
  cloudEquivalent: string;
}

export interface DiscoveredCICD {
  engine: 'jenkins' | 'gitlab' | 'teamcity' | 'bamboo' | 'argo' | 'github-actions';
  version: string;
  host: string;
  jobCount: number;
  agentCount: number;
}

export interface DiscoveredMonitoring {
  engine: 'prometheus' | 'nagios' | 'zabbix' | 'datadog-agent' | 'splunk' | 'grafana';
  version: string;
  host: string;
  targets: number;
  retentionDays?: number;
  cloudEquivalent: string;
}

export type DetectionSignal = {
  method: 'port-fingerprint' | 'process-name' | 'package-check' | 'config-file' | 'ai-classification';
  confidence: number;
  evidence: string;
};

export interface ApplicationDiscovery {
  databases: DiscoveredDatabase[];
  webServers: DiscoveredWebServer[];
  middleware: DiscoveredMiddleware[];
  containers: DiscoveredContainer[];
  cicd: DiscoveredCICD[];
  monitoring: DiscoveredMonitoring[];
}

// ────────────────────────────────────────────────────────────
// Layer 6: Dependency Reconstruction
// ────────────────────────────────────────────────────────────

export type DependencyDetectionMethod =
  | 'netflow'
  | 'connection-state'
  | 'dns'
  | 'config-file'
  | 'iam'
  | 'ai-inference';

export interface DependencyEdge {
  id: string;
  source: string;
  target: string;
  protocol: string;
  port: number;
  direction: 'unidirectional' | 'bidirectional';
  trafficVolume: {
    bytesPerDay: number;
    requestsPerDay: number;
    peakBytesPerSecond: number;
  };
  latency?: {
    avgMs: number;
    p95Ms: number;
    p99Ms: number;
  };
  detectionMethods: DependencyDetectionMethod[];
  confidence: number;
  criticality: 'critical' | 'high' | 'medium' | 'low';
  dataClassification?: 'pii' | 'financial' | 'health' | 'internal' | 'public';
  firstObserved: string;
  lastObserved: string;
}

// ────────────────────────────────────────────────────────────
// Layer 7: AI Intelligence
// ────────────────────────────────────────────────────────────

export type MigrationStrategy = 'rehost' | 'replatform' | 'refactor' | 'retire' | 'retain' | 'repurchase';

export interface AIClassification {
  workloadId: string;
  applicationStack: string;
  description: string;
  recommendedStrategy: MigrationStrategy;
  strategyConfidence: number;
  reasoning: string[];
  estimatedEffort: {
    hours: number;
    complexity: 'low' | 'medium' | 'high' | 'very-high';
  };
  risks: Array<{
    category: string;
    description: string;
    severity: 'critical' | 'high' | 'medium' | 'low';
    mitigation: string;
  }>;
  costEstimate: {
    onPremAnnual: number;
    cloudAnnual: number;
    cloudOptimized: number;
    savingsPercent: number;
  };
}

export interface MigrationWave {
  waveNumber: number;
  name: string;
  description: string;
  workloadIds: string[];
  estimatedDuration: string;
  risk: 'low' | 'medium' | 'high';
  prerequisites: string[];
}

// ────────────────────────────────────────────────────────────
// Performance Baseline
// ────────────────────────────────────────────────────────────

export interface PerformanceBaseline {
  hostId: string;
  collectionPeriod: { start: string; end: string; intervalSeconds: number };
  cpu: PercentileStats & { coreDistribution?: number[]; iowait: number; stealTime?: number };
  memory: {
    totalGB: number;
    usedAvgGB: number;
    usedMaxGB: number;
    swapUsedAvgGB: number;
    cacheGB: number;
    buffersGB: number;
  };
  disk: {
    perVolume: Array<{
      mount: string;
      readIOPS: PercentileStats;
      writeIOPS: PercentileStats;
      readLatencyMs: PercentileStats;
      writeLatencyMs: PercentileStats;
      throughputMBps: { read: number; write: number };
      capacityGB: number;
      usedGB: number;
      growthRateGBPerMonth: number;
    }>;
  };
  network: {
    perInterface: Array<{
      name: string;
      rxBytesPerSec: PercentileStats;
      txBytesPerSec: PercentileStats;
      errorsPerSec: number;
      dropsPerSec: number;
    }>;
    tcpConnections: {
      established: { avg: number; max: number };
      timeWait: { avg: number; max: number };
      closeWait: { avg: number; max: number };
    };
  };
}

export interface PercentileStats {
  min: number;
  avg: number;
  max: number;
  p50: number;
  p95: number;
  p99: number;
}

// ────────────────────────────────────────────────────────────
// Right-Sizing
// ────────────────────────────────────────────────────────────

export interface CloudRecommendation {
  workloadId: string;
  gcp: CloudInstanceMatch;
  aws: CloudInstanceMatch;
  azure: CloudInstanceMatch;
  selectedCloud: 'gcp' | 'aws' | 'azure';
  reasoning: string;
}

export interface CloudInstanceMatch {
  instanceType: string;
  vcpus: number;
  memoryGB: number;
  diskType: string;
  diskSizeGB: number;
  estimatedMonthlyCost: number;
  fitScore: number;
}

// ────────────────────────────────────────────────────────────
// Scanner Infrastructure
// ────────────────────────────────────────────────────────────

export interface ScannerConfig {
  id: string;
  type: 'network' | 'snmp' | 'netflow' | 'vmware' | 'hyperv' | 'kvm' |
        'proxmox' | 'kubernetes' | 'ssh' | 'winrm' | 'app-fingerprint';
  enabled: boolean;
  credentials?: ScannerCredentials;
  targets?: string[];
  options?: Record<string, any>;
}

export interface ScannerCredentials {
  type: 'ssh-key' | 'ssh-password' | 'winrm' | 'snmp-v2c' | 'snmp-v3' |
        'vcenter' | 'api-token' | 'kubeconfig';
  username?: string;
  password?: string;
  privateKey?: string;
  community?: string;
  token?: string;
  host?: string;
  port?: number;
}

export interface ScanResult<T = any> {
  scannerId: string;
  scannerType: string;
  startedAt: string;
  completedAt: string;
  durationMs: number;
  status: 'success' | 'partial' | 'failed';
  data: T;
  errors: ScanError[];
  stats: {
    itemsDiscovered: number;
    itemsUpdated: number;
    itemsFailed: number;
  };
}

export interface ScanError {
  target: string;
  message: string;
  code?: string;
  recoverable: boolean;
}

// ────────────────────────────────────────────────────────────
// Discovery Session
// ────────────────────────────────────────────────────────────

export interface DiscoverySession {
  sessionId: string;
  tenantId: string;
  startedAt: string;
  completedAt?: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  scanners: ScannerConfig[];
  results: ScanResult[];
  summary?: DiscoverySummary;
}

export interface DiscoverySummary {
  totalHosts: number;
  totalVMs: number;
  totalContainers: number;
  totalDatabases: number;
  totalApplications: number;
  totalDependencies: number;
  networkDevices: number;
  migrationReadiness: {
    rehost: number;
    replatform: number;
    refactor: number;
    retire: number;
    retain: number;
  };
  estimatedCost: {
    onPremAnnual: number;
    cloudAnnual: number;
    savings: number;
  };
}

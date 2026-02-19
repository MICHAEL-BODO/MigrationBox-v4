/**
 * MIKE-FIRST v6.0 — Auditor Engine
 * 
 * Enterprise compliance scanning engine supporting:
 * - ISO 27001, GDPR, SOX, HIPAA, SOC2, PCI-DSS
 * - Real-time Guardian agent for violation blocking
 * - One-click audit orchestration
 * - Report generation with remediation plans
 */

import type { SecurityFinding, ComplianceResult, CloudResource } from '../cloud-provider';
import type { DiscoveredHost } from '../scanners/network-scanner';

// ─── Types ───────────────────────────────────────────────────────────

export type ComplianceFramework = 'ISO27001' | 'GDPR' | 'SOX' | 'HIPAA' | 'SOC2' | 'PCI-DSS';

export interface AuditResult {
  id: string;
  timestamp: string;
  duration: number;  // seconds
  frameworks: ComplianceResult[];
  totalFindings: SecurityFinding[];
  overallScore: number;
  grade: string;
  remediationPlan: RemediationItem[];
  estimatedFinesAvoided: number;
}

export interface RemediationItem {
  id: string;
  finding: SecurityFinding;
  priority: number;  // 1=highest
  estimatedEffort: string;
  automatable: boolean;
  script?: string;
}

export interface GuardianEvent {
  id: string;
  timestamp: string;
  type: 'violation' | 'warning' | 'info';
  severity: SecurityFinding['severity'];
  title: string;
  description: string;
  resource: string;
  action: 'blocked' | 'remediated' | 'alerted' | 'logged';
  framework?: string;
  control?: string;
  estimatedFineAvoided?: number;
}

// ─── Framework Control Maps ──────────────────────────────────────────

const FRAMEWORK_CONTROLS: Record<ComplianceFramework, { totalControls: number; name: string; categories: string[] }> = {
  ISO27001: {
    totalControls: 114,
    name: 'ISO/IEC 27001:2022',
    categories: ['Information Security Policies', 'Organization of IS', 'Human Resource Security',
      'Asset Management', 'Access Control', 'Cryptography', 'Physical Security',
      'Operations Security', 'Communications Security', 'System Acquisition',
      'Supplier Relationships', 'IS Incident Management', 'Business Continuity', 'Compliance'],
  },
  GDPR: {
    totalControls: 99,
    name: 'EU GDPR (2016/679)',
    categories: ['Lawfulness', 'Consent', 'Transparency', 'Data Minimization',
      'Purpose Limitation', 'Storage Limitation', 'Integrity & Confidentiality',
      'Accountability', 'Data Subject Rights', 'Data Protection by Design',
      'Records of Processing', 'DPIA', 'DPO', 'International Transfers', 'Breach Notification'],
  },
  SOX: {
    totalControls: 68,
    name: 'Sarbanes-Oxley Act',
    categories: ['Management Assessment', 'IT General Controls', 'Access Controls',
      'Change Management', 'Computer Operations', 'System Development', 'Segregation of Duties',
      'Financial Reporting Controls', 'Audit Trail'],
  },
  HIPAA: {
    totalControls: 75,
    name: 'HIPAA Security Rule',
    categories: ['Administrative Safeguards', 'Physical Safeguards', 'Technical Safeguards',
      'Organizational Requirements', 'Policies & Procedures', 'ePHI Access', 'Audit Controls',
      'Integrity Controls', 'Transmission Security'],
  },
  SOC2: {
    totalControls: 64,
    name: 'SOC 2 Type II',
    categories: ['Security', 'Availability', 'Processing Integrity', 'Confidentiality', 'Privacy',
      'Logical Access', 'System Operations', 'Change Management', 'Risk Mitigation'],
  },
  'PCI-DSS': {
    totalControls: 78,
    name: 'PCI DSS v4.0',
    categories: ['Install/Maintain Firewall', 'Default Passwords', 'Protect Stored Data',
      'Encrypt Transmissions', 'Anti-virus', 'Secure Systems', 'Restrict Access',
      'Unique IDs', 'Physical Access', 'Track/Monitor Access', 'Test Security', 'IS Policy'],
  },
};

// ─── Fine Estimations ────────────────────────────────────────────────

const FINE_ESTIMATES: Record<string, number> = {
  'GDPR-critical':   20_000_000,  // GDPR: up to €20M or 4% of global turnover
  'GDPR-high':       5_000_000,
  'GDPR-medium':     1_000_000,
  'HIPAA-critical':  1_500_000,   // HIPAA: up to $1.5M per violation category per year
  'HIPAA-high':      500_000,
  'PCI-DSS-critical': 500_000,    // PCI: up to $500K per incident
  'PCI-DSS-high':    100_000,
  'SOX-critical':    5_000_000,   // SOX: up to $5M and 20 years imprisonment
  'SOX-high':        1_000_000,
  'SOC2-critical':   2_000_000,
  'ISO27001-critical': 500_000,
};

// ─── Auditor Engine ──────────────────────────────────────────────────

export class AuditorEngine {
  private guardianActive = false;
  private guardianEvents: GuardianEvent[] = [];

  /**
   * Run a full compliance audit across all frameworks.
   * Analyzes discovered hosts and cloud resources for compliance violations.
   */
  async runOneClickAudit(
    hosts: DiscoveredHost[],
    resources: CloudResource[] = [],
    frameworks: ComplianceFramework[] = ['ISO27001', 'GDPR', 'SOX', 'HIPAA', 'SOC2', 'PCI-DSS'],
    onProgress?: (phase: string, percent: number) => void,
  ): Promise<AuditResult> {
    const startTime = Date.now();
    const allFindings: SecurityFinding[] = [];

    // Collect all vulnerabilities from network scan
    for (const host of hosts) {
      allFindings.push(...host.vulnerabilities);
    }

    // Add infrastructure-level findings
    const infraFindings = this.analyzeInfrastructure(hosts, resources);
    allFindings.push(...infraFindings);

    onProgress?.('Analyzing network topology', 20);

    // Run each framework assessment
    const frameworkResults: ComplianceResult[] = [];
    for (let i = 0; i < frameworks.length; i++) {
      const fw = frameworks[i];
      onProgress?.(`Assessing ${fw} compliance`, 20 + (i / frameworks.length) * 60);
      
      const result = this.assessFramework(fw, allFindings, hosts, resources);
      frameworkResults.push(result);
    }

    onProgress?.('Generating remediation plan', 85);

    // Generate prioritized remediation plan
    const remediationPlan = this.generateRemediationPlan(allFindings);

    // Calculate fines avoided
    const estimatedFinesAvoided = this.calculateFinesAvoided(allFindings);

    // Calculate overall score
    const totalControls = frameworkResults.reduce((sum, r) => sum + r.totalControls, 0);
    const passingControls = frameworkResults.reduce((sum, r) => sum + r.passingControls, 0);
    const overallScore = Math.round((passingControls / totalControls) * 100);

    onProgress?.('Audit complete', 100);

    return {
      id: `audit-${Date.now()}`,
      timestamp: new Date().toISOString(),
      duration: Math.round((Date.now() - startTime) / 1000),
      frameworks: frameworkResults,
      totalFindings: allFindings,
      overallScore,
      grade: this.scoreToGrade(overallScore),
      remediationPlan,
      estimatedFinesAvoided,
    };
  }

  /**
   * Assess compliance against a specific framework.
   */
  private assessFramework(
    framework: ComplianceFramework,
    findings: SecurityFinding[],
    hosts: DiscoveredHost[],
    resources: CloudResource[],
  ): ComplianceResult {
    const frameworkInfo = FRAMEWORK_CONTROLS[framework];
    const relevantFindings = findings.filter(f => 
      f.framework === framework || this.findingAppliesToFramework(f, framework)
    );

    // Calculate passing controls based on findings
    const criticalCount = relevantFindings.filter(f => f.severity === 'critical').length;
    const highCount = relevantFindings.filter(f => f.severity === 'high').length;
    const mediumCount = relevantFindings.filter(f => f.severity === 'medium').length;

    // Each critical finding fails ~3 controls, high fails ~2, medium fails ~1
    const failingControls = Math.min(
      frameworkInfo.totalControls,
      criticalCount * 3 + highCount * 2 + mediumCount
    );
    const warnings = Math.min(
      frameworkInfo.totalControls - failingControls,
      relevantFindings.filter(f => f.severity === 'low' || f.severity === 'info').length * 2
    );
    const passingControls = frameworkInfo.totalControls - failingControls - warnings;
    const score = Math.round((passingControls / frameworkInfo.totalControls) * 100);

    return {
      framework: frameworkInfo.name,
      score,
      totalControls: frameworkInfo.totalControls,
      passingControls,
      failingControls,
      warnings,
      findings: relevantFindings,
      scannedAt: new Date().toISOString(),
    };
  }

  /**
   * Analyze infrastructure-level compliance issues.
   */
  private analyzeInfrastructure(hosts: DiscoveredHost[], resources: CloudResource[]): SecurityFinding[] {
    const findings: SecurityFinding[] = [];
    const now = new Date().toISOString();

    // Check for lack of network segmentation
    const hasIoT = hosts.some(h => h.vendor?.includes('IoT') || h.vendor?.includes('ESP') || h.vendor?.includes('Tapo'));
    const hasServers = hosts.some(h => h.services.length > 2);
    if (hasIoT && hasServers) {
      findings.push({
        id: 'infra-no-segmentation',
        severity: 'high',
        title: 'No network segmentation between IoT devices and servers',
        description: 'IoT devices and servers share the same network segment. A compromised IoT device could be used as a pivot point to attack servers. GDPR and ISO27001 require network segmentation.',
        resource: 'network-topology',
        resourceType: 'network',
        provider: 'onprem',
        framework: 'ISO27001',
        control: 'A.13.1.3 — Segregation in networks',
        remediation: 'Implement VLAN segmentation: IoT devices on separate VLAN (e.g., VLAN 10), servers on server VLAN (e.g., VLAN 20). Configure firewall rules between VLANs.',
        autoFixAvailable: false,
        detectedAt: now,
        status: 'open',
      });
    }

    // Check for too many admin services exposed
    const adminPorts = hosts.filter(h => 
      h.openPorts.some(p => [22, 3389, 5900].includes(p.port) && p.state === 'open')
    );
    if (adminPorts.length > 3) {
      findings.push({
        id: 'infra-excessive-admin',
        severity: 'medium',
        title: `${adminPorts.length} devices with exposed admin access`,
        description: `${adminPorts.length} hosts have SSH, RDP, or VNC open. Remote admin access should be centralized through a jump box / bastion host.`,
        resource: 'network-admin-access',
        resourceType: 'network',
        provider: 'onprem',
        framework: 'SOC2',
        control: 'CC6.1 — Logical access',
        remediation: 'Deploy a bastion host. Disable direct SSH/RDP access. Route all admin access through the bastion with MFA.',
        autoFixAvailable: false,
        detectedAt: now,
        status: 'open',
      });
    }

    // Check for missing encryption
    const unencryptedServices = hosts.flatMap(h => 
      h.services.filter(s => !s.encrypted && !['DNS'].includes(s.name))
    );
    if (unencryptedServices.length > 0) {
      findings.push({
        id: 'infra-unencrypted-services',
        severity: 'high',
        title: `${unencryptedServices.length} services transmitting data without encryption`,
        description: `Found ${unencryptedServices.length} services operating without TLS/SSL encryption. This includes: ${[...new Set(unencryptedServices.map(s => s.name))].join(', ')}. GDPR Art. 32 mandates appropriate encryption.`,
        resource: 'network-encryption',
        resourceType: 'network',
        provider: 'onprem',
        framework: 'GDPR',
        control: 'Art. 32(1)(a) — Encryption of personal data',
        remediation: 'Enable TLS 1.2+ on all services. Replace HTTP→HTTPS, FTP→SFTP, MQTT→MQTTS. Use Let\'s Encrypt or internal CA for certificates.',
        autoFixAvailable: false,
        detectedAt: now,
        status: 'open',
      });
    }

    // Missing backup validation
    findings.push({
      id: 'infra-no-backup-validation',
      severity: 'medium',
      title: 'No automated backup validation detected',
      description: 'No backup validation service was detected on the network. SOX and ISO27001 require regular backup testing.',
      resource: 'backup-system',
      resourceType: 'storage',
      provider: 'onprem',
      framework: 'SOX',
      control: 'IT-GC-4 — Computer Operations',
      remediation: 'Implement automated backup testing. Use tools like Veeam, Commvault, or Restic with scheduled restore tests.',
      autoFixAvailable: false,
      detectedAt: now,
      status: 'open',
    });

    // Missing intrusion detection
    const hasIDS = hosts.some(h => h.services.some(s => 
      ['Snort', 'Suricata', 'OSSEC', 'Wazuh'].includes(s.name)
    ));
    if (!hasIDS) {
      findings.push({
        id: 'infra-no-ids',
        severity: 'medium',
        title: 'No intrusion detection system (IDS/IPS) detected',
        description: 'No IDS/IPS service was found on the network. HIPAA and PCI-DSS require network intrusion detection.',
        resource: 'network-security',
        resourceType: 'firewall',
        provider: 'onprem',
        framework: 'PCI-DSS',
        control: 'Req 11.4 — Use intrusion-detection/prevention techniques',
        remediation: 'Deploy Snort, Suricata, or Wazuh for network intrusion detection. Configure alerting for suspicious patterns.',
        autoFixAvailable: false,
        detectedAt: now,
        status: 'open',
      });
    }

    // Missing centralized logging
    const hasSyslog = hosts.some(h => h.openPorts.some(p => p.port === 514));
    const hasElastic = hosts.some(h => h.openPorts.some(p => p.port === 9200));
    if (!hasSyslog && !hasElastic) {
      findings.push({
        id: 'infra-no-centralized-logging',
        severity: 'medium',
        title: 'No centralized logging system detected',
        description: 'No syslog server or Elasticsearch instance found. SOX and HIPAA require centralized audit logging with retention.',
        resource: 'logging-system',
        resourceType: 'vm',
        provider: 'onprem',
        framework: 'HIPAA',
        control: '§164.312(b) — Audit controls',
        remediation: 'Deploy ELK Stack (Elasticsearch + Logstash + Kibana) or Grafana Loki for centralized logging. Configure 1+ year retention.',
        autoFixAvailable: false,
        detectedAt: now,
        status: 'open',
      });
    }

    return findings;
  }

  /**
   * Generate prioritized remediation plan.
   */
  private generateRemediationPlan(findings: SecurityFinding[]): RemediationItem[] {
    const sorted = [...findings].sort((a, b) => {
      const severityOrder = { critical: 0, high: 1, medium: 2, low: 3, info: 4 };
      return severityOrder[a.severity] - severityOrder[b.severity];
    });

    return sorted.map((finding, idx) => ({
      id: `rem-${idx + 1}`,
      finding,
      priority: idx + 1,
      estimatedEffort: finding.severity === 'critical' ? '1-2 hours' :
                       finding.severity === 'high' ? '2-4 hours' :
                       finding.severity === 'medium' ? '4-8 hours' : '1-2 days',
      automatable: finding.autoFixAvailable,
      script: finding.autoFixAvailable ? this.generateFixScript(finding) : undefined,
    }));
  }

  /**
   * Calculate estimated fines avoided by fixing findings.
   */
  private calculateFinesAvoided(findings: SecurityFinding[]): number {
    let total = 0;
    for (const finding of findings) {
      const key = `${finding.framework}-${finding.severity}`;
      total += FINE_ESTIMATES[key] || 0;
    }
    return total;
  }

  /**
   * Generate auto-fix script for a finding.
   */
  private generateFixScript(finding: SecurityFinding): string {
    switch (true) {
      case finding.id.includes('smb'):
        return `# Disable SMBv1 on Windows\nSet-SmbServerConfiguration -EnableSMB1Protocol $false -Force\n# Block SMB from external access\nNew-NetFirewallRule -DisplayName "Block External SMB" -Direction Inbound -LocalPort 445 -Protocol TCP -RemoteAddress "!LocalSubnet" -Action Block`;
      case finding.id.includes('rdp'):
        return `# Enable NLA for RDP\nreg add "HKLM\\SYSTEM\\CurrentControlSet\\Control\\Terminal Server\\WinStations\\RDP-Tcp" /v UserAuthentication /t REG_DWORD /d 1 /f\n# Restrict RDP to specific IPs\nNew-NetFirewallRule -DisplayName "Restrict RDP" -Direction Inbound -LocalPort 3389 -Protocol TCP -RemoteAddress "192.168.1.0/24" -Action Allow`;
      case finding.id.includes('http') && !finding.id.includes('https'):
        return `# Install certbot for Let's Encrypt\nsudo apt install certbot python3-certbot-nginx -y\nsudo certbot --nginx -d $(hostname -f) --agree-tos --email admin@example.com\n# Redirect HTTP to HTTPS\nsudo sed -i 's/listen 80;/listen 80; return 301 https:\\/\\/$host$request_uri;/' /etc/nginx/sites-enabled/default`;
      case finding.id.includes('netbios'):
        return `# Disable NetBIOS over TCP/IP\n$adapters = Get-WmiObject Win32_NetworkAdapterConfiguration -Filter "IPEnabled=True"\nforeach ($adapter in $adapters) {\n  $adapter.SetTcpipNetbios(2)  # 2 = Disable\n}`;
      default:
        return `# Manual remediation required\n# See: ${finding.remediation}`;
    }
  }

  private findingAppliesToFramework(finding: SecurityFinding, framework: ComplianceFramework): boolean {
    // Map severity to framework relevance
    const universalFrameworks: ComplianceFramework[] = ['ISO27001', 'SOC2'];
    if (universalFrameworks.includes(framework)) return true;
    
    if (framework === 'GDPR' && (finding.title.includes('encrypt') || finding.title.includes('plaintext') || finding.title.includes('PII'))) return true;
    if (framework === 'HIPAA' && (finding.title.includes('access') || finding.title.includes('ePHI') || finding.title.includes('RDP'))) return true;
    if (framework === 'PCI-DSS' && (finding.title.includes('database') || finding.title.includes('firewall') || finding.title.includes('encrypt'))) return true;
    if (framework === 'SOX' && (finding.title.includes('access') || finding.title.includes('audit'))) return true;
    
    return false;
  }

  private scoreToGrade(score: number): string {
    if (score >= 95) return 'A+';
    if (score >= 90) return 'A';
    if (score >= 85) return 'A-';
    if (score >= 80) return 'B+';
    if (score >= 75) return 'B';
    if (score >= 70) return 'B-';
    if (score >= 65) return 'C+';
    if (score >= 60) return 'C';
    if (score >= 55) return 'C-';
    if (score >= 50) return 'D';
    return 'F';
  }

  // ─── Guardian Agent ────────────────────────────────────────────

  startGuardian(): void {
    this.guardianActive = true;
  }

  stopGuardian(): void {
    this.guardianActive = false;
  }

  isGuardianActive(): boolean {
    return this.guardianActive;
  }

  recordGuardianEvent(event: Omit<GuardianEvent, 'id' | 'timestamp'>): GuardianEvent {
    const fullEvent: GuardianEvent = {
      ...event,
      id: `guardian-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      timestamp: new Date().toISOString(),
    };
    this.guardianEvents.push(fullEvent);
    return fullEvent;
  }

  getGuardianEvents(limit = 50): GuardianEvent[] {
    return this.guardianEvents.slice(-limit);
  }

  getGuardianStats() {
    const events = this.guardianEvents;
    return {
      totalViolations: events.filter(e => e.type === 'violation').length,
      blocked: events.filter(e => e.action === 'blocked').length,
      remediated: events.filter(e => e.action === 'remediated').length,
      alerted: events.filter(e => e.action === 'alerted').length,
      finesAvoided: events.reduce((sum, e) => sum + (e.estimatedFineAvoided || 0), 0),
      byFramework: this.groupBy(events.filter(e => e.framework), 'framework'),
    };
  }

  private groupBy<T>(items: T[], key: keyof T): Record<string, number> {
    return items.reduce((acc, item) => {
      const k = String(item[key]);
      acc[k] = (acc[k] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }
}

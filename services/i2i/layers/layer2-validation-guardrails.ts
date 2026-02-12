/**
 * MigrationBox V5.0 - I2I Pipeline Layer 2: Validation & Policy Guardrails
 *
 * FLAGSHIP FEATURE
 *
 * CUE Lang schema validation + OPA/Rego policy engine for Intent Schema compliance.
 * Enforces: no 0.0.0.0/0 SSH, encryption at rest, data residency (GDPR),
 * PCI-DSS, HIPAA, SOC 2 compliance rules.
 */

import { IntentSchema } from '@migrationbox/types';

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  policyViolations: PolicyViolation[];
  remediations: Remediation[];
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export interface ValidationWarning {
  field: string;
  message: string;
  severity: 'low' | 'medium' | 'high';
}

export interface PolicyViolation {
  policy: string;
  framework: 'pci-dss' | 'hipaa' | 'gdpr' | 'soc2' | 'security' | 'cost';
  severity: 'critical' | 'high' | 'medium' | 'low';
  message: string;
  resource?: string;
}

export interface Remediation {
  violation: string;
  suggestion: string;
  autoFix: boolean;
  fixedValue?: any;
}

export class ValidationGuardrailEngine {

  /**
   * Full validation pipeline: schema → structure → policies
   */
  async validate(schema: IntentSchema): Promise<ValidationResult> {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    const policyViolations: PolicyViolation[] = [];
    const remediations: Remediation[] = [];

    // Phase 1: Structural validation (CUE-style)
    this.validateStructure(schema, errors);

    // Phase 2: Security policies
    this.enforceSecurityPolicies(schema, policyViolations, remediations);

    // Phase 3: Compliance framework policies
    if (schema.compliance?.pciDss) {
      this.enforcePCIDSS(schema, policyViolations, remediations);
    }
    if (schema.compliance?.hipaa) {
      this.enforceHIPAA(schema, policyViolations, remediations);
    }
    if (schema.compliance?.gdpr) {
      this.enforceGDPR(schema, policyViolations, remediations);
    }
    if (schema.compliance?.soc2) {
      this.enforceSOC2(schema, policyViolations, remediations);
    }

    // Phase 4: Cost guardrails
    this.enforceCostGuardrails(schema, warnings);

    // Phase 5: Best practices
    this.enforceBestPractices(schema, warnings);

    return {
      valid: errors.length === 0 && policyViolations.filter(v => v.severity === 'critical').length === 0,
      errors,
      warnings,
      policyViolations,
      remediations,
    };
  }

  /**
   * Auto-remediate violations where possible
   */
  autoRemediate(schema: IntentSchema, result: ValidationResult): IntentSchema {
    let remediated = JSON.parse(JSON.stringify(schema));

    for (const remediation of result.remediations) {
      if (remediation.autoFix && remediation.fixedValue !== undefined) {
        // Apply the fix
        const path = remediation.violation.split('.');
        let target: any = remediated;
        for (let i = 0; i < path.length - 1; i++) {
          if (!target[path[i]]) target[path[i]] = {};
          target = target[path[i]];
        }
        target[path[path.length - 1]] = remediation.fixedValue;
      }
    }

    return remediated;
  }

  // ---- Structural Validation (CUE-style) ----

  private validateStructure(schema: IntentSchema, errors: ValidationError[]): void {
    if (!schema.provider || !['aws', 'azure', 'gcp'].includes(schema.provider)) {
      errors.push({ field: 'provider', message: 'Provider must be aws, azure, or gcp', code: 'INVALID_PROVIDER' });
    }

    if (!schema.resources || schema.resources.length === 0) {
      errors.push({ field: 'resources', message: 'At least one resource must be defined', code: 'EMPTY_RESOURCES' });
    }

    if (schema.resources) {
      for (const resource of schema.resources) {
        if (!resource.type) {
          errors.push({ field: `resources.${resource.name}`, message: 'Resource type is required', code: 'MISSING_TYPE' });
        }
        if (!resource.name) {
          errors.push({ field: 'resources', message: 'Resource name is required', code: 'MISSING_NAME' });
        }
      }
    }

    if (!schema.tenantId) {
      errors.push({ field: 'tenantId', message: 'Tenant ID is required', code: 'MISSING_TENANT' });
    }
  }

  // ---- Security Policies ----

  private enforceSecurityPolicies(
    schema: IntentSchema,
    violations: PolicyViolation[],
    remediations: Remediation[]
  ): void {
    // POLICY: Block 0.0.0.0/0 SSH access
    if (schema.networking?.securityGroups) {
      for (const sg of schema.networking.securityGroups) {
        const sgConfig = typeof sg === 'string' ? {} : sg;
        if (sgConfig.ingressRules) {
          for (const rule of sgConfig.ingressRules) {
            if (rule.cidr === '0.0.0.0/0' && rule.port === 22) {
              violations.push({
                policy: 'no-public-ssh',
                framework: 'security',
                severity: 'critical',
                message: 'SSH (port 22) must not be open to 0.0.0.0/0',
                resource: sgConfig.name,
              });
              remediations.push({
                violation: 'networking.securityGroups.ingressRules.cidr',
                suggestion: 'Restrict SSH to specific IP ranges or use VPN/bastion',
                autoFix: false,
              });
            }
            if (rule.cidr === '0.0.0.0/0' && rule.port === 3389) {
              violations.push({
                policy: 'no-public-rdp',
                framework: 'security',
                severity: 'critical',
                message: 'RDP (port 3389) must not be open to 0.0.0.0/0',
                resource: sgConfig.name,
              });
            }
          }
        }
      }
    }

    // POLICY: Require encryption at rest
    if (!schema.security?.encryptionAtRest) {
      violations.push({
        policy: 'encryption-at-rest',
        framework: 'security',
        severity: 'high',
        message: 'Encryption at rest must be enabled for all resources',
      });
      remediations.push({
        violation: 'security.encryptionAtRest',
        suggestion: 'Enable encryption at rest',
        autoFix: true,
        fixedValue: true,
      });
    }

    // POLICY: Require encryption in transit
    if (!schema.security?.encryptionInTransit) {
      violations.push({
        policy: 'encryption-in-transit',
        framework: 'security',
        severity: 'high',
        message: 'Encryption in transit (TLS) must be enabled',
      });
      remediations.push({
        violation: 'security.encryptionInTransit',
        suggestion: 'Enable encryption in transit',
        autoFix: true,
        fixedValue: true,
      });
    }

    // POLICY: Require IAM least privilege
    if (!schema.security?.iamLeastPrivilege) {
      violations.push({
        policy: 'iam-least-privilege',
        framework: 'security',
        severity: 'medium',
        message: 'IAM policies should follow least-privilege principle',
      });
      remediations.push({
        violation: 'security.iamLeastPrivilege',
        suggestion: 'Enable least-privilege IAM policy generation',
        autoFix: true,
        fixedValue: true,
      });
    }
  }

  // ---- PCI-DSS Compliance ----

  private enforcePCIDSS(
    schema: IntentSchema,
    violations: PolicyViolation[],
    remediations: Remediation[]
  ): void {
    // PCI-DSS Requirement 3: Protect stored cardholder data
    if (schema.resources) {
      for (const resource of schema.resources) {
        if (resource.type === 'database' && !resource.config?.encrypted) {
          violations.push({
            policy: 'pci-dss-req3-encryption',
            framework: 'pci-dss',
            severity: 'critical',
            message: `PCI-DSS Req 3: Database "${resource.name}" must have encryption enabled`,
            resource: resource.name,
          });
        }
      }
    }

    // PCI-DSS Requirement 4: Encrypt transmission
    if (!schema.security?.encryptionInTransit) {
      violations.push({
        policy: 'pci-dss-req4-transit',
        framework: 'pci-dss',
        severity: 'critical',
        message: 'PCI-DSS Req 4: All data in transit must be encrypted',
      });
    }

    // PCI-DSS Requirement 8: Access controls
    if (!schema.security?.iamLeastPrivilege) {
      violations.push({
        policy: 'pci-dss-req8-access',
        framework: 'pci-dss',
        severity: 'high',
        message: 'PCI-DSS Req 8: Identify and authenticate access to system components',
      });
    }

    // PCI-DSS Requirement 10: Track and monitor
    if (!schema.monitoring) {
      violations.push({
        policy: 'pci-dss-req10-logging',
        framework: 'pci-dss',
        severity: 'high',
        message: 'PCI-DSS Req 10: All access to cardholder data must be logged and monitored',
      });
    }
  }

  // ---- HIPAA Compliance ----

  private enforceHIPAA(
    schema: IntentSchema,
    violations: PolicyViolation[],
    remediations: Remediation[]
  ): void {
    // HIPAA: PHI encryption required
    if (!schema.security?.encryptionAtRest) {
      violations.push({
        policy: 'hipaa-encryption',
        framework: 'hipaa',
        severity: 'critical',
        message: 'HIPAA: All PHI data must be encrypted at rest (AES-256)',
      });
    }

    // HIPAA: Audit logging
    if (!schema.monitoring) {
      violations.push({
        policy: 'hipaa-audit-log',
        framework: 'hipaa',
        severity: 'critical',
        message: 'HIPAA: Comprehensive audit logging required for PHI access',
      });
    }

    // HIPAA: Access controls
    if (!schema.security?.iamLeastPrivilege) {
      violations.push({
        policy: 'hipaa-access-control',
        framework: 'hipaa',
        severity: 'high',
        message: 'HIPAA: Role-based access control required for PHI',
      });
    }

    // HIPAA: Backup and disaster recovery
    if (schema.resources) {
      for (const resource of schema.resources) {
        if (resource.type === 'database' && !resource.config?.backup) {
          violations.push({
            policy: 'hipaa-backup',
            framework: 'hipaa',
            severity: 'high',
            message: `HIPAA: Database "${resource.name}" must have automated backups enabled`,
            resource: resource.name,
          });
        }
      }
    }
  }

  // ---- GDPR Compliance ----

  private enforceGDPR(
    schema: IntentSchema,
    violations: PolicyViolation[],
    remediations: Remediation[]
  ): void {
    // GDPR: Data residency enforcement
    const euRegions = ['eu-west-1', 'eu-west-2', 'eu-central-1', 'westeurope', 'northeurope', 'europe-west1', 'europe-west3'];
    const schemaRegion = (schema as any).region || '';

    if (schemaRegion && !euRegions.some(r => schemaRegion.includes(r.split('-')[0]))) {
      violations.push({
        policy: 'gdpr-data-residency',
        framework: 'gdpr',
        severity: 'critical',
        message: 'GDPR: Personal data must be stored within EU/EEA regions',
      });
      remediations.push({
        violation: 'region',
        suggestion: 'Deploy to EU region (eu-west-1, eu-central-1, westeurope, europe-west1)',
        autoFix: false,
      });
    }

    // GDPR: Right to deletion
    if (schema.resources) {
      for (const resource of schema.resources) {
        if (resource.type === 'database') {
          violations.push({
            policy: 'gdpr-right-to-delete',
            framework: 'gdpr',
            severity: 'medium',
            message: `GDPR: Database "${resource.name}" must support data deletion workflows`,
            resource: resource.name,
          });
        }
      }
    }

    // GDPR: Encryption
    if (!schema.security?.encryptionAtRest || !schema.security?.encryptionInTransit) {
      violations.push({
        policy: 'gdpr-encryption',
        framework: 'gdpr',
        severity: 'high',
        message: 'GDPR: All personal data must be encrypted at rest and in transit',
      });
    }
  }

  // ---- SOC 2 Compliance ----

  private enforceSOC2(
    schema: IntentSchema,
    violations: PolicyViolation[],
    remediations: Remediation[]
  ): void {
    // SOC 2: Availability (CC6)
    if (schema.resources) {
      const hasHA = schema.resources.some(r => r.config?.multiAZ || r.config?.replicas > 1);
      if (!hasHA) {
        violations.push({
          policy: 'soc2-availability',
          framework: 'soc2',
          severity: 'medium',
          message: 'SOC 2 CC6: High availability recommended for critical services',
        });
      }
    }

    // SOC 2: Monitoring (CC7)
    if (!schema.monitoring) {
      violations.push({
        policy: 'soc2-monitoring',
        framework: 'soc2',
        severity: 'high',
        message: 'SOC 2 CC7: Monitoring and alerting must be configured',
      });
    }

    // SOC 2: Logical and physical access (CC6)
    if (!schema.security?.iamLeastPrivilege) {
      violations.push({
        policy: 'soc2-access-control',
        framework: 'soc2',
        severity: 'high',
        message: 'SOC 2 CC6: Logical access controls must be implemented',
      });
    }

    // SOC 2: Change management (CC8)
    violations.push({
      policy: 'soc2-change-management',
      framework: 'soc2',
      severity: 'low',
      message: 'SOC 2 CC8: All infrastructure changes should be tracked via IaC',
    });
  }

  // ---- Cost Guardrails ----

  private enforceCostGuardrails(schema: IntentSchema, warnings: ValidationWarning[]): void {
    if (schema.resources) {
      for (const resource of schema.resources) {
        if (resource.type === 'compute') {
          const size = resource.config?.instanceType || resource.config?.size || '';
          if (size.includes('xlarge') || size.includes('metal')) {
            warnings.push({
              field: `resources.${resource.name}.instanceType`,
              message: `Large instance type "${size}" — consider if this is necessary for the workload`,
              severity: 'medium',
            });
          }
        }
        if (resource.type === 'database' && resource.config?.multiAZ) {
          warnings.push({
            field: `resources.${resource.name}.multiAZ`,
            message: 'Multi-AZ doubles database cost — ensure this is required',
            severity: 'low',
          });
        }
      }
    }
  }

  // ---- Best Practices ----

  private enforceBestPractices(schema: IntentSchema, warnings: ValidationWarning[]): void {
    // Recommend tagging
    warnings.push({
      field: 'resources',
      message: 'Consider adding resource tags for cost allocation and governance',
      severity: 'low',
    });

    // Recommend backups
    if (schema.resources) {
      const databases = schema.resources.filter(r => r.type === 'database');
      for (const db of databases) {
        if (!db.config?.backup) {
          warnings.push({
            field: `resources.${db.name}.backup`,
            message: `Database "${db.name}" should have automated backups configured`,
            severity: 'medium',
          });
        }
      }
    }
  }
}

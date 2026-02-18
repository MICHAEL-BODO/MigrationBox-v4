# MigrationBox V5.0 — Design-to-Code Tracker

> **Purpose**: Maps every file in the architecture design to its implementation status.
> **Updated**: 2026-02-18 07:12 CET

## Legend

- ✅ **Implemented** — File exists, compiles, functional
- 🔨 **Stub** — File exists but incomplete
- 📋 **Designed** — Architecture complete, not yet coded
- ❌ **Not Started** — No design exists

---

## Discovery Engine V2 — On-Prem

| Design File                         | Status | Actual Path                                        | Notes                                 |
| ----------------------------------- | ------ | -------------------------------------------------- | ------------------------------------- |
| Engine: `scanner-registry.ts`       | ✅     | `src/engine/scanner-registry.ts`                   | Plugin registry with topological sort |
| Engine: `discovery-orchestrator.ts` | ✅     | `src/engine/discovery-orchestrator.ts`             | Session management, parallel layers   |
| Engine: `discovery-engine.ts`       | ✅     | `src/discovery-engine.ts`                          | Bootstrap factory                     |
| Engine: `replay-engine.ts`          | 📋     | `src/engine/replay-engine.ts`                      | Invention #1                          |
| Engine: `smart-scheduler.ts`        | 📋     | `src/engine/smart-scheduler.ts`                    | Invention #2                          |
| Engine: `discovery-diff-engine.ts`  | 📋     | `src/engine/discovery-diff-engine.ts`              | Invention #4                          |
| Engine: `runbook-generator.ts`      | 📋     | `src/engine/runbook-generator.ts`                  | Invention #5                          |
| Types: `onprem-types.ts`            | ✅     | `src/onprem/types/onprem-types.ts`                 | 800+ lines                            |
| L1: `network-scanner.ts`            | ✅     | `src/onprem/scanners/network-scanner.ts`           | masscan → nmap → TCP                  |
| L2: `snmp-scanner.ts`               | 📋     | `src/onprem/scanners/snmp-scanner.ts`              | SNMP walk + CDP/LLDP                  |
| L2: `netflow-collector.ts`          | 📋     | `src/onprem/scanners/netflow-collector.ts`         | NetFlow/sFlow/IPFIX                   |
| L3: `vmware-scanner.ts`             | ✅     | `src/onprem/scanners/vmware-scanner.ts`            | vSphere REST API                      |
| L3: `hyperv-scanner.ts`             | 📋     | `src/onprem/scanners/hyperv-scanner.ts`            | PowerShell/WinRM                      |
| L3: `kvm-scanner.ts`                | 📋     | `src/onprem/scanners/kvm-scanner.ts`               | libvirt/virsh                         |
| L3: `kubernetes-scanner.ts`         | 📋     | `src/onprem/scanners/kubernetes-scanner.ts`        | K8s/OpenShift                         |
| L4: `ssh-collector.ts`              | ✅     | `src/onprem/scanners/ssh-collector.ts`             | Linux host inventory                  |
| L4: `winrm-collector.ts`            | 📋     | `src/onprem/scanners/winrm-collector.ts`           | Windows WMI                           |
| L4: `performance-collector.ts`      | ✅     | `src/onprem/performance/performance-collector.ts`  | P95/P99 metrics                       |
| L5: `app-fingerprinter.ts`          | ✅     | `src/onprem/scanners/app-fingerprinter.ts`         | 5-signal detection                    |
| L6: `dependency-reconstructor.ts`   | ✅     | `src/onprem/inference/dependency-reconstructor.ts` | Multi-method confidence               |
| L6: `netflow-analyzer.ts`           | 📋     | `src/onprem/inference/netflow-analyzer.ts`         | Flow → dependency edges               |
| L6: `config-parser.ts`              | 📋     | `src/onprem/inference/config-parser.ts`            | Config → connections                  |
| L7: `ai-classifier.ts`              | ✅     | `src/onprem/inference/ai-classifier.ts`            | Bedrock Claude                        |
| Perf: `right-sizer.ts`              | 📋     | `src/onprem/performance/right-sizer.ts`            | Cloud instance matching               |
| Perf: `cost-calculator.ts`          | 📋     | `src/onprem/performance/cost-calculator.ts`        | TCO comparison                        |

## Discovery Engine V2 — Cloud

| Design File                  | Status | Actual Path                                 | Notes                  |
| ---------------------------- | ------ | ------------------------------------------- | ---------------------- |
| `cloud-control-scanner.ts`   | 📋     | `src/aws/scanners/cloud-control-scanner.ts` | Replaces 16 legacy     |
| `cloudtrail-miner.ts`        | 📋     | `src/aws/scanners/cloudtrail-miner.ts`      | Runtime deps           |
| `ec2-scanner.ts`             | ✅     | `src/aws/scanners/ec2-scanner.ts`           | EC2-specific deep scan |
| `resource-graph-scanner.ts`  | 📋     | `src/azure/resource-graph-scanner.ts`       | Azure KQL              |
| `asset-inventory-scanner.ts` | 📋     | `src/gcp/asset-inventory-scanner.ts`        | GCP CAI                |

## Discovery Integration

| Design File               | Status | Actual Path                       | Notes             |
| ------------------------- | ------ | --------------------------------- | ----------------- |
| `discovery-bridge.ts`     | 📋     | `src/bridge/discovery-bridge.ts`  | V1↔V2 adapter     |
| `result-translator.ts`    | 📋     | `src/bridge/result-translator.ts` | Format translator |
| `discovery-mcp-server.ts` | 📋     | `src/mcp/discovery-mcp-server.ts` | MCP for AI agents |

## Shared Infrastructure

| Design File              | Status | Actual Path                         | Notes             |
| ------------------------ | ------ | ----------------------------------- | ----------------- |
| `rate-limiter.ts`        | 📋     | `src/shared/rate-limiter.ts`        | Token bucket      |
| `credential-vault.ts`    | 📋     | `src/shared/credential-vault.ts`    | Secret management |
| `toolchain-validator.ts` | 📋     | `src/shared/toolchain-validator.ts` | Binary deps check |
| `ai-budget-manager.ts`   | 📋     | `src/shared/ai-budget-manager.ts`   | Cost control      |

## Other Services

| Service            | Status | Path                          | Notes            |
| ------------------ | ------ | ----------------------------- | ---------------- |
| Assessment Service | ✅     | `services/assessment/`        | 9/9 tests        |
| I2I Pipeline       | ✅     | `services/i2i/`               | 14/14 tests      |
| Data Transfer      | ✅     | `services/data-transfer/`     | 14/14 tests      |
| Validation         | ✅     | `services/validation/`        | 14/14 tests      |
| Agents (6)         | ✅     | `services/agents/`            | Framework done   |
| Orchestration      | 🔨     | `services/orchestration/`     | 9 stub steps     |
| Extended Thinking  | 📋     | `services/extended-thinking/` | Not created yet  |
| Cost Engine        | 🔨     | `services/cost-engine/`       | 1 file           |
| Knowledge (CRDT)   | 🔨     | `services/knowledge/`         | 1 file, isolated |
| ML Models          | 🔨     | `services/ml/`                | Definitions only |

---

## Summary

| Status         | Count  | %    |
| -------------- | ------ | ---- |
| ✅ Implemented | 17     | 35%  |
| 🔨 Stub        | 5      | 10%  |
| 📋 Designed    | 26     | 53%  |
| ❌ Not Started | 1      | 2%   |
| **Total**      | **49** | 100% |

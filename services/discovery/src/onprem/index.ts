/**
 * MigrationBox V5.0 - On-Prem Discovery Module
 * 
 * Barrel exports for the 7-layer deep scan architecture.
 */

// Types
export * from './types/onprem-types';

// Engine
export { ScannerRegistry, BaseScanner, type IScanner, type ScanContext, type ScanLogger } from '../engine/scanner-registry';
export { DiscoveryOrchestrator, type OrchestratorConfig } from '../engine/discovery-orchestrator';

// Layer 1: Network Scan
export { NetworkScanner, type NetworkScanConfig } from './scanners/network-scanner';

// Layer 3: Virtualization
export { VMwareScanner, type VMwareScanConfig } from './scanners/vmware-scanner';

// Layer 4: OS Inventory
export { SSHCollector, type SSHScanConfig } from './scanners/ssh-collector';

// Layer 5: Application Discovery
export { AppFingerprinter, type AppFingerprinterConfig } from './scanners/app-fingerprinter';

// Layer 6: Dependency Reconstruction
export { DependencyReconstructor, type DependencyConfig } from './inference/dependency-reconstructor';

// Layer 7: AI Intelligence
export { AIClassifier, type AIClassifierConfig } from './inference/ai-classifier';

// Performance Baseline
export { PerformanceCollector, type PerfCollectorConfig } from './performance/performance-collector';

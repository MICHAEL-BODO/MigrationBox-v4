/**
 * MigrationBox V5.0 - On-Prem Discovery Bootstrap
 * 
 * Factory function that registers all scanners and returns
 * a configured orchestrator ready to run discovery sessions.
 */

import { ScannerRegistry } from './engine/scanner-registry';
import { DiscoveryOrchestrator } from './engine/discovery-orchestrator';
import { NetworkScanner } from './onprem/scanners/network-scanner';
import { VMwareScanner } from './onprem/scanners/vmware-scanner';
import { SSHCollector } from './onprem/scanners/ssh-collector';
import { AppFingerprinter } from './onprem/scanners/app-fingerprinter';
import { DependencyReconstructor } from './onprem/inference/dependency-reconstructor';
import { AIClassifier } from './onprem/inference/ai-classifier';
import { PerformanceCollector } from './onprem/performance/performance-collector';

export { ScannerRegistry } from './engine/scanner-registry';
export { DiscoveryOrchestrator, type OrchestratorConfig } from './engine/discovery-orchestrator';
export * from './onprem/index';

/**
 * Create a fully configured Discovery Orchestrator with all scanners registered.
 * 
 * @example
 * ```typescript
 * import { createDiscoveryEngine } from './discovery-engine';
 * 
 * const engine = createDiscoveryEngine();
 * 
 * const session = await engine.startDiscovery({
 *   tenantId: 'tenant-123',
 *   scanners: [
 *     { id: 'net', type: 'network-scanner', enabled: true,
 *       options: { cidrRanges: ['10.0.0.0/24'] } },
 *     { id: 'vmw', type: 'vmware-scanner', enabled: true,
 *       credentials: { type: 'vcenter', host: 'vcenter.local',
 *                      username: 'admin', password: 'secret' } },
 *     { id: 'ssh', type: 'ssh-collector', enabled: true,
 *       options: { hosts: ['10.0.0.10', '10.0.0.11'],
 *                  globalCredentials: { username: 'root', privateKey: '...' } } },
 *     { id: 'app', type: 'app-fingerprinter', enabled: true },
 *     { id: 'dep', type: 'dependency-reconstructor', enabled: true },
 *     { id: 'ai',  type: 'ai-classifier', enabled: true },
 *   ],
 * });
 * 
 * console.log(session.summary);
 * ```
 */
export function createDiscoveryEngine(): DiscoveryOrchestrator {
  const registry = new ScannerRegistry();

  // Layer 1
  registry.register(new NetworkScanner());

  // Layer 3
  registry.register(new VMwareScanner());

  // Layer 4
  registry.register(new SSHCollector());
  registry.register(new PerformanceCollector());

  // Layer 5
  registry.register(new AppFingerprinter());

  // Layer 6
  registry.register(new DependencyReconstructor());

  // Layer 7
  registry.register(new AIClassifier());

  return new DiscoveryOrchestrator(registry);
}

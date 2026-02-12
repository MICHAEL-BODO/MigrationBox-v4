/**
 * MigrationBox V5.0 - Cloud Abstraction Layer Interfaces
 * 
 * These TypeScript interfaces define the contract for all cloud provider adapters.
 * Business logic imports ONLY these interfaces, never cloud-specific SDKs.
 * 
 * All adapters support AWS, Azure, and GCP through a unified interface.
 */

// Re-export all interfaces from the consolidated interfaces file
export * from '../../../libs/cloud-abstraction/interfaces';

// Re-export CloudProvider from types
export type { CloudProvider } from '../../../packages/shared/types/src/index';

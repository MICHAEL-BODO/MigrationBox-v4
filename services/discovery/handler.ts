/**
 * MigrationBox V5.0 - Discovery Service Handler Index
 *
 * Exports all Lambda handler functions for serverless.yml
 */

export { handler as startDiscovery } from './handlers/start-discovery';
export { handler as getDiscovery } from './handlers/get-discovery';
export { handler as listWorkloads } from './handlers/list-workloads';
export { handler as getDependencies } from './handlers/get-dependencies';
export { handler as processAwsDiscovery } from './handlers/process-aws-discovery';

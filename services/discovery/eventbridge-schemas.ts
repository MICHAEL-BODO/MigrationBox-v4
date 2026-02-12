/**
 * MigrationBox V5.0 - EventBridge Event Schemas for Discovery
 * 
 * Defines event schemas for discovery-related events.
 */

export interface DiscoveryEvent {
  eventId: string;
  eventType: DiscoveryEventType;
  tenantId: string;
  discoveryId: string;
  timestamp: string;
  payload: Record<string, any>;
}

export type DiscoveryEventType =
  | 'DiscoveryInitiated'
  | 'DiscoveryStarted'
  | 'WorkloadDiscovered'
  | 'DiscoveryCompleted'
  | 'DiscoveryFailed'
  | 'AgentStarted'
  | 'AgentStopped'
  | 'AgentHeartbeat'
  | 'DependencyGraphUpdated';

export const DiscoveryEventSchemas = {
  DiscoveryInitiated: {
    type: 'DiscoveryInitiated',
    required: ['discoveryId', 'tenantId', 'sourceEnvironment'],
    properties: {
      discoveryId: { type: 'string' },
      tenantId: { type: 'string' },
      sourceEnvironment: { type: 'string', enum: ['aws', 'azure', 'gcp'] },
      scope: { type: 'string', enum: ['full', 'partial'] },
    },
  },

  DiscoveryStarted: {
    type: 'DiscoveryStarted',
    required: ['discoveryId', 'tenantId', 'agentType'],
    properties: {
      discoveryId: { type: 'string' },
      tenantId: { type: 'string' },
      agentType: { type: 'string' },
      regions: { type: 'array', items: { type: 'string' } },
      services: { type: 'array', items: { type: 'string' } },
    },
  },

  WorkloadDiscovered: {
    type: 'WorkloadDiscovered',
    required: ['discoveryId', 'tenantId', 'workloadId', 'type'],
    properties: {
      discoveryId: { type: 'string' },
      tenantId: { type: 'string' },
      workloadId: { type: 'string' },
      type: { type: 'string' },
      provider: { type: 'string' },
      region: { type: 'string' },
      dependencies: { type: 'array', items: { type: 'string' } },
    },
  },

  DiscoveryCompleted: {
    type: 'DiscoveryCompleted',
    required: ['discoveryId', 'tenantId', 'workloadsFound'],
    properties: {
      discoveryId: { type: 'string' },
      tenantId: { type: 'string' },
      workloadsFound: { type: 'number' },
      durationSeconds: { type: 'number' },
      provider: { type: 'string' },
      regions: { type: 'array', items: { type: 'string' } },
    },
  },

  DiscoveryFailed: {
    type: 'DiscoveryFailed',
    required: ['discoveryId', 'tenantId', 'error'],
    properties: {
      discoveryId: { type: 'string' },
      tenantId: { type: 'string' },
      error: { type: 'string' },
      errorCode: { type: 'string' },
      failedAt: { type: 'string' },
    },
  },

  AgentStarted: {
    type: 'AgentStarted',
    required: ['agentType', 'tenantId'],
    properties: {
      agentType: { type: 'string' },
      tenantId: { type: 'string' },
      status: { type: 'string', enum: ['started'] },
    },
  },

  AgentStopped: {
    type: 'AgentStopped',
    required: ['agentType', 'tenantId'],
    properties: {
      agentType: { type: 'string' },
      tenantId: { type: 'string' },
      status: { type: 'string', enum: ['stopped'] },
    },
  },

  AgentHeartbeat: {
    type: 'AgentHeartbeat',
    required: ['agentType', 'tenantId'],
    properties: {
      agentType: { type: 'string' },
      tenantId: { type: 'string' },
      status: { type: 'string', enum: ['heartbeat'] },
      activeTasks: { type: 'number' },
    },
  },

  DependencyGraphUpdated: {
    type: 'DependencyGraphUpdated',
    required: ['discoveryId', 'tenantId'],
    properties: {
      discoveryId: { type: 'string' },
      tenantId: { type: 'string' },
      nodesAdded: { type: 'number' },
      relationshipsAdded: { type: 'number' },
    },
  },
};

/**
 * Validate event against schema
 */
export function validateDiscoveryEvent(event: any): boolean {
  const schema = DiscoveryEventSchemas[event.eventType as DiscoveryEventType];
  if (!schema) {
    return false;
  }

  // Check required fields
  for (const field of schema.required) {
    if (!(field in event)) {
      return false;
    }
  }

  return true;
}

/**
 * MigrationBox V5.0 - EventBridge Integration
 *
 * Publish/subscribe pattern for discovery events.
 * Handles event routing between agents via EventBridge.
 */

import {
  EventBridgeClient,
  PutEventsCommand,
  PutRuleCommand,
  PutTargetsCommand,
} from '@aws-sdk/client-eventbridge';

const STAGE = process.env.STAGE || 'dev';
const REGION = process.env.AWS_REGION || 'us-east-1';
const EVENT_BUS = process.env.EVENT_BUS || `migrationbox-events-${STAGE}`;
const ENDPOINT = process.env.AWS_ENDPOINT_URL;

const client = new EventBridgeClient({
  region: REGION,
  ...(ENDPOINT && { endpoint: ENDPOINT }),
});

export interface MigrationBoxEvent {
  source: string;
  detailType: string;
  detail: Record<string, any>;
  eventBusName?: string;
}

/**
 * Publish an event to EventBridge
 */
export async function publishEvent(event: MigrationBoxEvent): Promise<string | undefined> {
  const command = new PutEventsCommand({
    Entries: [
      {
        Source: event.source || 'migrationbox.discovery',
        DetailType: event.detailType,
        Detail: JSON.stringify(event.detail),
        EventBusName: event.eventBusName || EVENT_BUS,
      },
    ],
  });

  const response = await client.send(command);
  return response.Entries?.[0]?.EventId;
}

/**
 * Publish a discovery lifecycle event
 */
export async function publishDiscoveryEvent(
  eventType: string,
  detail: Record<string, any>
): Promise<string | undefined> {
  return publishEvent({
    source: 'migrationbox.discovery',
    detailType: eventType,
    detail: {
      ...detail,
      timestamp: detail.timestamp || new Date().toISOString(),
      version: '1.0',
    },
  });
}

/**
 * Create an EventBridge rule to route discovery completion to assessment
 */
export async function createDiscoveryCompletedRule(
  assessmentQueueArn: string
): Promise<void> {
  const ruleName = `discovery-completed-to-assessment-${STAGE}`;

  // Create rule
  await client.send(new PutRuleCommand({
    Name: ruleName,
    EventBusName: EVENT_BUS,
    EventPattern: JSON.stringify({
      source: ['migrationbox.discovery'],
      'detail-type': ['DiscoveryCompleted'],
    }),
    State: 'ENABLED',
    Description: 'Routes discovery completion events to assessment service',
  }));

  // Add target (Assessment SQS queue)
  await client.send(new PutTargetsCommand({
    Rule: ruleName,
    EventBusName: EVENT_BUS,
    Targets: [
      {
        Id: `assessment-queue-${STAGE}`,
        Arn: assessmentQueueArn,
      },
    ],
  }));
}

/**
 * Create an EventBridge rule to track agent heartbeats
 */
export async function createAgentHeartbeatRule(
  monitoringLambdaArn: string
): Promise<void> {
  const ruleName = `agent-heartbeat-monitor-${STAGE}`;

  await client.send(new PutRuleCommand({
    Name: ruleName,
    EventBusName: EVENT_BUS,
    EventPattern: JSON.stringify({
      source: ['migrationbox.discovery', 'migrationbox.assessment', 'migrationbox.orchestration'],
      'detail-type': ['AgentHeartbeat'],
    }),
    State: 'ENABLED',
    Description: 'Monitors agent heartbeats for health tracking',
  }));

  await client.send(new PutTargetsCommand({
    Rule: ruleName,
    EventBusName: EVENT_BUS,
    Targets: [
      {
        Id: `heartbeat-monitor-${STAGE}`,
        Arn: monitoringLambdaArn,
      },
    ],
  }));
}

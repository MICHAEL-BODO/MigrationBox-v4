/**
 * MigrationBox V4.1 - Discovery Service Handler
 * 
 * Cloud-agnostic entry point for workload discovery.
 * Routes to provider-specific adapters (AWS, Azure, GCP).
 */

const { v4: uuidv4 } = require('uuid');
const { getDatabaseAdapter, getMessagingAdapter } = require('../../libs/cloud-abstraction/factory');

const db = getDatabaseAdapter();
const messaging = getMessagingAdapter();

const WORKLOADS_TABLE = process.env.WORKLOADS_TABLE || 'migrationbox-workloads-dev';
const EVENT_BUS = process.env.EVENT_BUS || 'migrationbox-events-dev';

/**
 * POST /v1/discoveries - Start a new discovery scan
 */
module.exports.startDiscovery = async (event) => {
  try {
    const body = JSON.parse(event.body || '{}');
    const { tenantId, sourceEnvironment, credentials, scope } = body;

    if (!tenantId || !sourceEnvironment) {
      return response(400, { error: 'tenantId and sourceEnvironment are required' });
    }

    const discoveryId = `disc-${Date.now()}-${uuidv4().slice(0, 8)}`;

    // Store discovery record
    await db.putItem(WORKLOADS_TABLE, {
      tenantId,
      workloadId: discoveryId,
      type: 'discovery',
      status: 'initiated',
      sourceEnvironment,
      scope: scope || 'full',
      createdAt: new Date().toISOString(),
      workloadsFound: 0,
    });

    // Queue async discovery job
    await messaging.sendMessage('migrationbox-discovery-' + (process.env.STAGE || 'dev'), {
      discoveryId,
      tenantId,
      sourceEnvironment,
      credentials: credentials || {},
      scope: scope || 'full',
    });

    // Publish event
    await messaging.publishEvent(EVENT_BUS, {
      discoveryId,
      tenantId,
      sourceEnvironment,
      status: 'initiated',
    }, 'DiscoveryInitiated');

    return response(202, {
      discoveryId,
      status: 'initiated',
      message: `Discovery scan started for ${sourceEnvironment}. Check status at GET /v1/discoveries/${discoveryId}`,
    });
  } catch (error) {
    console.error('startDiscovery error:', error);
    return response(500, { error: 'Internal server error' });
  }
};

/**
 * GET /v1/discoveries/{id} - Get discovery status
 */
module.exports.getDiscovery = async (event) => {
  try {
    const discoveryId = event.pathParameters?.id;
    const tenantId = event.requestContext?.authorizer?.tenantId || 'default';

    const discovery = await db.getItem(WORKLOADS_TABLE, { tenantId, workloadId: discoveryId });

    if (!discovery) {
      return response(404, { error: 'Discovery not found' });
    }

    return response(200, discovery);
  } catch (error) {
    console.error('getDiscovery error:', error);
    return response(500, { error: 'Internal server error' });
  }
};

/**
 * GET /v1/discoveries/{id}/workloads - List discovered workloads
 */
module.exports.listWorkloads = async (event) => {
  try {
    const discoveryId = event.pathParameters?.id;
    const tenantId = event.requestContext?.authorizer?.tenantId || 'default';

    const workloads = await db.queryItems(WORKLOADS_TABLE,
      'tenantId = :tenantId AND begins_with(workloadId, :prefix)',
      { ':tenantId': tenantId, ':prefix': `wl-${discoveryId}` }
    );

    return response(200, {
      discoveryId,
      count: workloads.length,
      workloads,
    });
  } catch (error) {
    console.error('listWorkloads error:', error);
    return response(500, { error: 'Internal server error' });
  }
};

/**
 * GET /v1/discoveries/{id}/dependencies - Get dependency graph
 */
module.exports.getDependencies = async (event) => {
  try {
    const discoveryId = event.pathParameters?.id;
    const tenantId = event.requestContext?.authorizer?.tenantId || 'default';

    // TODO: Query Neptune Serverless / Cosmos Graph for dependency graph
    return response(200, {
      discoveryId,
      nodes: [],
      edges: [],
      message: 'Dependency graph implementation pending (requires Neptune/Cosmos Graph)',
    });
  } catch (error) {
    console.error('getDependencies error:', error);
    return response(500, { error: 'Internal server error' });
  }
};

/**
 * SQS Consumer - Process async AWS discovery
 */
module.exports.processAwsDiscovery = async (event) => {
  for (const record of event.Records) {
    const message = JSON.parse(record.body);
    const { discoveryId, tenantId, sourceEnvironment, scope } = message;

    console.log(`Processing discovery ${discoveryId} for ${sourceEnvironment}`);

    try {
      let adapter;
      switch (sourceEnvironment) {
        case 'aws':
          adapter = require('./aws-adapter');
          break;
        case 'azure':
          adapter = require('./azure-adapter');
          break;
        case 'gcp':
          adapter = require('./gcp-adapter');
          break;
        default:
          throw new Error(`Unsupported source environment: ${sourceEnvironment}`);
      }

      const workloads = await adapter.discover(message);

      // Store each workload
      for (const workload of workloads) {
        await db.putItem(WORKLOADS_TABLE, {
          tenantId,
          workloadId: `wl-${discoveryId}-${workload.id}`,
          ...workload,
          discoveryId,
          discoveredAt: new Date().toISOString(),
        });

        // Publish event for each discovered workload
        await messaging.publishEvent(EVENT_BUS, {
          discoveryId,
          tenantId,
          workloadId: `wl-${discoveryId}-${workload.id}`,
          type: workload.type,
          source: sourceEnvironment,
        }, 'WorkloadDiscovered');
      }

      // Update discovery record
      await db.updateItem(WORKLOADS_TABLE,
        { tenantId, workloadId: discoveryId },
        { status: 'complete', workloadsFound: workloads.length, completedAt: new Date().toISOString() }
      );

      console.log(`Discovery ${discoveryId} complete: ${workloads.length} workloads found`);
    } catch (error) {
      console.error(`Discovery ${discoveryId} failed:`, error);

      await db.updateItem(WORKLOADS_TABLE,
        { tenantId, workloadId: discoveryId },
        { status: 'failed', error: error.message, failedAt: new Date().toISOString() }
      );

      throw error; // Re-throw to trigger SQS retry -> DLQ
    }
  }
};

// Helper
function response(statusCode, body) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
    body: JSON.stringify(body),
  };
}

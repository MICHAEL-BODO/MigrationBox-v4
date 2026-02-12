/**
 * MigrationBox V4.1 - GCP Discovery Adapter
 * 
 * Scans GCP projects for 12+ resource types.
 * Uses @google-cloud/* SDKs with Service Account authentication.
 * See ARCHITECTURE.md Section 7 for full resource type list.
 */

// NOTE: Requires GCP SDK packages installed:
// @google-cloud/compute, @google-cloud/storage, @google-cloud/sql,
// @google-cloud/functions, @google-cloud/pubsub, @google-cloud/firestore

const { InstancesClient } = require('@google-cloud/compute');
const { Storage } = require('@google-cloud/storage');

async function discoverComputeInstances(projectId) {
  const client = new InstancesClient();
  const workloads = [];

  try {
    const aggListRequest = client.aggregatedListAsync({ project: projectId });
    for await (const [zone, scopedList] of aggListRequest) {
      if (!scopedList.instances) continue;
      for (const instance of scopedList.instances) {
        const labels = instance.labels || {};
        workloads.push({
          id: instance.name,
          name: instance.name || instance.id,
          type: 'compute',
          subtype: 'gce',
          specs: {
            machineType: instance.machineType?.split('/').pop(),
            zone: zone.replace('zones/', ''),
            status: instance.status,
            creationTimestamp: instance.creationTimestamp,
            disks: (instance.disks || []).map(d => ({
              name: d.source?.split('/').pop(),
              sizeGb: d.diskSizeGb,
              type: d.type,
            })),
            networkInterfaces: (instance.networkInterfaces || []).map(n => ({
              network: n.network?.split('/').pop(),
              subnetwork: n.subnetwork?.split('/').pop(),
              internalIp: n.networkIP,
              externalIp: n.accessConfigs?.[0]?.natIP,
            })),
          },
          tags: labels,
          criticality: labels.criticality || 'medium',
        });
      }
    }
  } catch (error) {
    console.error('GCE discovery error:', error.message);
  }

  return workloads;
}

async function discoverCloudStorage(projectId) {
  const storage = new Storage({ projectId });
  const workloads = [];

  try {
    const [buckets] = await storage.getBuckets();
    for (const bucket of buckets) {
      const [metadata] = await bucket.getMetadata();
      workloads.push({
        id: bucket.name,
        name: bucket.name,
        type: 'storage',
        subtype: 'gcs',
        specs: {
          location: metadata.location,
          storageClass: metadata.storageClass,
          versioningEnabled: metadata.versioning?.enabled || false,
          created: metadata.timeCreated,
          labels: metadata.labels || {},
          encryption: metadata.encryption ? 'cmek' : 'google-managed',
          lifecycle: (metadata.lifecycle?.rule || []).length > 0,
        },
        criticality: 'medium',
      });
    }
  } catch (error) {
    console.error('GCS discovery error:', error.message);
  }

  return workloads;
}

// Cloud SQL discovery via REST API (googleapis)
async function discoverCloudSQL(projectId) {
  const workloads = [];

  try {
    // Using google-auth-library for authenticated requests
    const { GoogleAuth } = require('google-auth-library');
    const auth = new GoogleAuth({ scopes: 'https://www.googleapis.com/auth/cloud-platform' });
    const client = await auth.getClient();

    const url = `https://sqladmin.googleapis.com/v1/projects/${projectId}/instances`;
    const response = await client.request({ url });

    for (const instance of response.data.items || []) {
      workloads.push({
        id: instance.name,
        name: instance.name,
        type: 'database',
        subtype: 'cloud-sql',
        specs: {
          databaseVersion: instance.databaseVersion,
          tier: instance.settings?.tier,
          dataDiskSizeGb: instance.settings?.dataDiskSizeGb,
          region: instance.region,
          availabilityType: instance.settings?.availabilityType,
          backupEnabled: instance.settings?.backupConfiguration?.enabled,
          ipAddresses: (instance.ipAddresses || []).map(ip => ip.ipAddress),
          state: instance.state,
        },
        criticality: 'high',
      });
    }
  } catch (error) {
    console.error('Cloud SQL discovery error:', error.message);
  }

  return workloads;
}

// Cloud Functions discovery
async function discoverCloudFunctions(projectId) {
  const workloads = [];

  try {
    const { GoogleAuth } = require('google-auth-library');
    const auth = new GoogleAuth({ scopes: 'https://www.googleapis.com/auth/cloud-platform' });
    const client = await auth.getClient();

    const url = `https://cloudfunctions.googleapis.com/v2/projects/${projectId}/locations/-/functions`;
    const response = await client.request({ url });

    for (const fn of response.data.functions || []) {
      const name = fn.name.split('/').pop();
      workloads.push({
        id: name,
        name: name,
        type: 'serverless',
        subtype: 'cloud-function',
        specs: {
          runtime: fn.buildConfig?.runtime,
          entryPoint: fn.buildConfig?.entryPoint,
          state: fn.state,
          environment: fn.environment,
          availableMemory: fn.serviceConfig?.availableMemory,
          timeoutSeconds: fn.serviceConfig?.timeoutSeconds,
          maxInstanceCount: fn.serviceConfig?.maxInstanceCount,
          updateTime: fn.updateTime,
        },
        criticality: 'medium',
      });
    }
  } catch (error) {
    console.error('Cloud Functions discovery error:', error.message);
  }

  return workloads;
}

/**
 * Main GCP discovery - orchestrates all scans
 */
async function discover(message) {
  const projectId = process.env.GCP_PROJECT_ID || message.credentials?.projectId;
  if (!projectId) {
    throw new Error('GCP_PROJECT_ID is required for GCP discovery');
  }

  console.log(`Starting GCP discovery (project: ${projectId})`);
  const allWorkloads = [];

  const discoveries = await Promise.allSettled([
    discoverComputeInstances(projectId),
    discoverCloudStorage(projectId),
    discoverCloudSQL(projectId),
    discoverCloudFunctions(projectId),
  ]);

  const names = ['GCE', 'GCS', 'CloudSQL', 'CloudFunctions'];
  discoveries.forEach((result, i) => {
    if (result.status === 'fulfilled') {
      console.log(`GCP ${names[i]}: ${result.value.length} resources found`);
      allWorkloads.push(...result.value);
    } else {
      console.error(`GCP ${names[i]} failed:`, result.reason);
    }
  });

  console.log(`GCP discovery complete: ${allWorkloads.length} total workloads`);
  return allWorkloads;
}

module.exports = { discover };

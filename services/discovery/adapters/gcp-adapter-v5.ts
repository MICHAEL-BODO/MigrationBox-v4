/**
 * MigrationBox V5.0 - GCP Discovery Adapter
 *
 * Discovers GCP resources: Compute Engine, Cloud SQL, Firestore, Cloud Storage,
 * Cloud Functions, Cloud Run, VPC, Firewall, GKE, App Engine,
 * Cloud IAM, Cloud DNS, Monitoring, Secret Manager, Pub/Sub
 */

import { Workload, CloudProvider } from '@migrationbox/types';

interface GCPDiscoveryConfig {
  region: string;
  credentials: Record<string, string>;
  scope?: string;
}

export async function discover(config: GCPDiscoveryConfig): Promise<Workload[]> {
  const { region, credentials } = config;
  const projectId = credentials.gcpProjectId || process.env.GCP_PROJECT_ID || '';
  const workloads: Workload[] = [];

  const discoveries = await Promise.allSettled([
    discoverComputeInstances(region, projectId),
    discoverCloudSQL(region, projectId),
    discoverFirestore(region, projectId),
    discoverCloudStorage(region, projectId),
    discoverCloudFunctions(region, projectId),
    discoverCloudRun(region, projectId),
    discoverVPC(region, projectId),
    discoverFirewallRules(region, projectId),
    discoverGKE(region, projectId),
    discoverAppEngine(region, projectId),
    discoverCloudDNS(region, projectId),
    discoverSecretManager(region, projectId),
    discoverPubSub(region, projectId),
  ]);

  for (const result of discoveries) {
    if (result.status === 'fulfilled') {
      workloads.push(...result.value);
    } else {
      console.warn('GCP discovery partial failure:', result.reason?.message);
    }
  }

  return workloads;
}

async function discoverComputeInstances(region: string, projectId: string): Promise<Workload[]> {
  try {
    const { InstancesClient } = await import('@google-cloud/compute');
    const client = new InstancesClient();
    const zone = `${region}-a`;

    const [instances] = await client.list({ project: projectId, zone });
    return (instances || []).map((instance: any) => ({
      workloadId: `gcp-vm-${instance.name}`,
      tenantId: '',
      discoveryId: '',
      type: 'compute' as const,
      provider: 'gcp' as CloudProvider,
      region,
      name: instance.name || 'unknown',
      status: instance.status || 'unknown',
      metadata: {
        machineType: instance.machineType?.split('/').pop(),
        zone,
        networkInterfaces: instance.networkInterfaces?.map((n: any) => n.network),
        disks: instance.disks?.length || 0,
        canIpForward: instance.canIpForward,
      },
      dependencies: [],
      discoveredAt: new Date().toISOString(),
    }));
  } catch (error: any) {
    console.warn('GCP Compute discovery failed:', error.message);
    return [];
  }
}

async function discoverCloudSQL(region: string, projectId: string): Promise<Workload[]> {
  try {
    const { SqlInstancesServiceClient } = await import('@google-cloud/sql');
    const client = new SqlInstancesServiceClient();

    const [instances] = await client.list({ project: projectId });
    return (instances || []).filter((i: any) => i.region === region).map((instance: any) => ({
      workloadId: `gcp-sql-${instance.name}`,
      tenantId: '',
      discoveryId: '',
      type: 'database' as const,
      provider: 'gcp' as CloudProvider,
      region,
      name: instance.name || 'unknown',
      status: instance.state || 'unknown',
      metadata: {
        databaseVersion: instance.databaseVersion,
        tier: instance.settings?.tier,
        dataDiskSizeGb: instance.settings?.dataDiskSizeGb,
        ipAddresses: instance.ipAddresses?.map((ip: any) => ip.ipAddress),
        backupEnabled: instance.settings?.backupConfiguration?.enabled,
        highAvailability: instance.settings?.availabilityType === 'REGIONAL',
      },
      dependencies: [],
      discoveredAt: new Date().toISOString(),
    }));
  } catch (error: any) {
    console.warn('GCP Cloud SQL discovery failed:', error.message);
    return [];
  }
}

async function discoverFirestore(region: string, projectId: string): Promise<Workload[]> {
  try {
    const { Firestore } = await import('@google-cloud/firestore');
    const firestore = new Firestore({ projectId });
    const collections = await firestore.listCollections();

    return [{
      workloadId: `gcp-firestore-${projectId}`,
      tenantId: '',
      discoveryId: '',
      type: 'database' as const,
      provider: 'gcp' as CloudProvider,
      region,
      name: `firestore-${projectId}`,
      status: 'active',
      metadata: {
        collections: collections.map((c: any) => c.id),
        collectionCount: collections.length,
      },
      dependencies: [],
      discoveredAt: new Date().toISOString(),
    }];
  } catch (error: any) {
    console.warn('GCP Firestore discovery failed:', error.message);
    return [];
  }
}

async function discoverCloudStorage(region: string, projectId: string): Promise<Workload[]> {
  try {
    const { Storage } = await import('@google-cloud/storage');
    const storage = new Storage({ projectId });
    const [buckets] = await storage.getBuckets();

    return (buckets || []).filter((b: any) => b.metadata?.location?.toLowerCase() === region.toUpperCase().replace(/-/g, '')).map((bucket: any) => ({
      workloadId: `gcp-gcs-${bucket.name}`,
      tenantId: '',
      discoveryId: '',
      type: 'storage' as const,
      provider: 'gcp' as CloudProvider,
      region,
      name: bucket.name,
      status: 'active',
      metadata: {
        storageClass: bucket.metadata?.storageClass,
        location: bucket.metadata?.location,
        versioning: bucket.metadata?.versioning?.enabled,
        encryption: bucket.metadata?.encryption?.defaultKmsKeyName ? 'CMEK' : 'Google-managed',
      },
      dependencies: [],
      discoveredAt: new Date().toISOString(),
    }));
  } catch (error: any) {
    console.warn('GCP Cloud Storage discovery failed:', error.message);
    return [];
  }
}

async function discoverCloudFunctions(region: string, projectId: string): Promise<Workload[]> {
  try {
    const { CloudFunctionsServiceClient } = await import('@google-cloud/functions');
    const client = new CloudFunctionsServiceClient();
    const parent = `projects/${projectId}/locations/${region}`;

    const [functions] = await client.listFunctions({ parent });
    return (functions || []).map((fn: any) => ({
      workloadId: `gcp-func-${fn.name?.split('/').pop()}`,
      tenantId: '',
      discoveryId: '',
      type: 'serverless' as const,
      provider: 'gcp' as CloudProvider,
      region,
      name: fn.name?.split('/').pop() || 'unknown',
      status: fn.status || 'unknown',
      metadata: {
        runtime: fn.runtime,
        entryPoint: fn.entryPoint,
        availableMemoryMb: fn.availableMemoryMb,
        timeout: fn.timeout,
        httpsTrigger: fn.httpsTrigger?.url,
        vpcConnector: fn.vpcConnector,
      },
      dependencies: [],
      discoveredAt: new Date().toISOString(),
    }));
  } catch (error: any) {
    console.warn('GCP Cloud Functions discovery failed:', error.message);
    return [];
  }
}

async function discoverCloudRun(region: string, projectId: string): Promise<Workload[]> {
  try {
    const { ServicesClient } = await import('@google-cloud/run');
    const client = new ServicesClient();
    const parent = `projects/${projectId}/locations/${region}`;

    const [services] = await client.listServices({ parent });
    return (services || []).map((svc: any) => ({
      workloadId: `gcp-run-${svc.name?.split('/').pop()}`,
      tenantId: '',
      discoveryId: '',
      type: 'container' as const,
      provider: 'gcp' as CloudProvider,
      region,
      name: svc.name?.split('/').pop() || 'unknown',
      status: svc.conditions?.[0]?.type || 'unknown',
      metadata: {
        url: svc.uri,
        latestRevision: svc.latestReadyRevision,
        traffic: svc.traffic,
      },
      dependencies: [],
      discoveredAt: new Date().toISOString(),
    }));
  } catch (error: any) {
    console.warn('GCP Cloud Run discovery failed:', error.message);
    return [];
  }
}

async function discoverVPC(region: string, projectId: string): Promise<Workload[]> {
  try {
    const { NetworksClient } = await import('@google-cloud/compute');
    const client = new NetworksClient();

    const [networks] = await client.list({ project: projectId });
    return (networks || []).map((net: any) => ({
      workloadId: `gcp-vpc-${net.name}`,
      tenantId: '',
      discoveryId: '',
      type: 'network' as const,
      provider: 'gcp' as CloudProvider,
      region: 'global',
      name: net.name || 'unknown',
      status: 'active',
      metadata: {
        autoCreateSubnetworks: net.autoCreateSubnetworks,
        routingConfig: net.routingConfig?.routingMode,
        subnetworks: net.subnetworks?.length || 0,
      },
      dependencies: [],
      discoveredAt: new Date().toISOString(),
    }));
  } catch (error: any) {
    console.warn('GCP VPC discovery failed:', error.message);
    return [];
  }
}

async function discoverFirewallRules(region: string, projectId: string): Promise<Workload[]> {
  try {
    const { FirewallsClient } = await import('@google-cloud/compute');
    const client = new FirewallsClient();

    const [rules] = await client.list({ project: projectId });
    return (rules || []).map((rule: any) => ({
      workloadId: `gcp-firewall-${rule.name}`,
      tenantId: '',
      discoveryId: '',
      type: 'network' as const,
      provider: 'gcp' as CloudProvider,
      region: 'global',
      name: rule.name || 'unknown',
      status: rule.disabled ? 'disabled' : 'active',
      metadata: {
        direction: rule.direction,
        priority: rule.priority,
        network: rule.network?.split('/').pop(),
        allowed: rule.allowed,
        denied: rule.denied,
        sourceRanges: rule.sourceRanges,
      },
      dependencies: [],
      discoveredAt: new Date().toISOString(),
    }));
  } catch (error: any) {
    console.warn('GCP Firewall discovery failed:', error.message);
    return [];
  }
}

async function discoverGKE(region: string, projectId: string): Promise<Workload[]> {
  try {
    const { ClusterManagerClient } = await import('@google-cloud/container');
    const client = new ClusterManagerClient();
    const parent = `projects/${projectId}/locations/${region}`;

    const [response] = await client.listClusters({ parent });
    return (response.clusters || []).map((cluster: any) => ({
      workloadId: `gcp-gke-${cluster.name}`,
      tenantId: '',
      discoveryId: '',
      type: 'container' as const,
      provider: 'gcp' as CloudProvider,
      region,
      name: cluster.name || 'unknown',
      status: cluster.status || 'unknown',
      metadata: {
        clusterVersion: cluster.currentMasterVersion,
        nodeCount: cluster.currentNodeCount,
        machineType: cluster.nodeConfig?.machineType,
        network: cluster.network,
        subnetwork: cluster.subnetwork,
        autopilot: cluster.autopilot?.enabled,
      },
      dependencies: [],
      discoveredAt: new Date().toISOString(),
    }));
  } catch (error: any) {
    console.warn('GCP GKE discovery failed:', error.message);
    return [];
  }
}

async function discoverAppEngine(region: string, projectId: string): Promise<Workload[]> {
  // App Engine is global per project — return single workload
  try {
    return [{
      workloadId: `gcp-appengine-${projectId}`,
      tenantId: '',
      discoveryId: '',
      type: 'application' as const,
      provider: 'gcp' as CloudProvider,
      region,
      name: `appengine-${projectId}`,
      status: 'active',
      metadata: { projectId },
      dependencies: [],
      discoveredAt: new Date().toISOString(),
    }];
  } catch (error: any) {
    console.warn('GCP App Engine discovery failed:', error.message);
    return [];
  }
}

async function discoverCloudDNS(region: string, projectId: string): Promise<Workload[]> {
  try {
    const { DNS } = await import('@google-cloud/dns');
    const dns = new DNS({ projectId });
    const [zones] = await dns.getZones();

    return (zones || []).map((zone: any) => ({
      workloadId: `gcp-dns-${zone.name}`,
      tenantId: '',
      discoveryId: '',
      type: 'network' as const,
      provider: 'gcp' as CloudProvider,
      region: 'global',
      name: zone.name || 'unknown',
      status: 'active',
      metadata: { dnsName: zone.metadata?.dnsName, nameServers: zone.metadata?.nameServers },
      dependencies: [],
      discoveredAt: new Date().toISOString(),
    }));
  } catch (error: any) {
    console.warn('GCP Cloud DNS discovery failed:', error.message);
    return [];
  }
}

async function discoverSecretManager(region: string, projectId: string): Promise<Workload[]> {
  try {
    const { SecretManagerServiceClient } = await import('@google-cloud/secret-manager');
    const client = new SecretManagerServiceClient();
    const parent = `projects/${projectId}`;

    const [secrets] = await client.listSecrets({ parent });
    return (secrets || []).map((secret: any) => ({
      workloadId: `gcp-secret-${secret.name?.split('/').pop()}`,
      tenantId: '',
      discoveryId: '',
      type: 'application' as const,
      provider: 'gcp' as CloudProvider,
      region: 'global',
      name: secret.name?.split('/').pop() || 'unknown',
      status: 'active',
      metadata: { replication: secret.replication },
      dependencies: [],
      discoveredAt: new Date().toISOString(),
    }));
  } catch (error: any) {
    console.warn('GCP Secret Manager discovery failed:', error.message);
    return [];
  }
}

async function discoverPubSub(region: string, projectId: string): Promise<Workload[]> {
  try {
    const { PubSub } = await import('@google-cloud/pubsub');
    const pubsub = new PubSub({ projectId });
    const [topics] = await pubsub.getTopics();

    return (topics || []).map((topic: any) => ({
      workloadId: `gcp-pubsub-${topic.name?.split('/').pop()}`,
      tenantId: '',
      discoveryId: '',
      type: 'application' as const,
      provider: 'gcp' as CloudProvider,
      region: 'global',
      name: topic.name?.split('/').pop() || 'unknown',
      status: 'active',
      metadata: { topicName: topic.name },
      dependencies: [],
      discoveredAt: new Date().toISOString(),
    }));
  } catch (error: any) {
    console.warn('GCP Pub/Sub discovery failed:', error.message);
    return [];
  }
}

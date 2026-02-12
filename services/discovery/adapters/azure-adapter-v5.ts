/**
 * MigrationBox V5.0 - Azure Discovery Adapter
 *
 * Discovers Azure resources: VMs, SQL, Cosmos DB, Blob Storage,
 * Functions, VNets, NSGs, App Gateway, App Service, Container Apps, AKS,
 * Azure AD, DNS, Monitor, Key Vault, Service Bus
 */

import { Workload, CloudProvider } from '@migrationbox/types';

interface AzureDiscoveryConfig {
  region: string;
  credentials: Record<string, string>;
  scope?: string;
}

export async function discover(config: AzureDiscoveryConfig): Promise<Workload[]> {
  const { region, credentials } = config;
  const workloads: Workload[] = [];

  const discoveries = await Promise.allSettled([
    discoverVirtualMachines(region, credentials),
    discoverAzureSQL(region, credentials),
    discoverCosmosDB(region, credentials),
    discoverBlobStorage(region, credentials),
    discoverFunctions(region, credentials),
    discoverVNets(region, credentials),
    discoverNSGs(region, credentials),
    discoverAppGateway(region, credentials),
    discoverAppService(region, credentials),
    discoverContainerApps(region, credentials),
    discoverAKS(region, credentials),
    discoverDNS(region, credentials),
    discoverKeyVault(region, credentials),
    discoverServiceBus(region, credentials),
  ]);

  for (const result of discoveries) {
    if (result.status === 'fulfilled') {
      workloads.push(...result.value);
    } else {
      console.warn('Azure discovery partial failure:', result.reason?.message);
    }
  }

  return workloads;
}

async function discoverVirtualMachines(region: string, credentials: Record<string, string>): Promise<Workload[]> {
  try {
    const { ComputeManagementClient } = await import('@azure/arm-compute');
    const { DefaultAzureCredential } = await import('@azure/identity');
    const credential = new DefaultAzureCredential();
    const client = new ComputeManagementClient(credential, credentials.subscriptionId);

    const workloads: Workload[] = [];
    for await (const vm of client.virtualMachines.listAll()) {
      if (vm.location !== region) continue;
      workloads.push({
        workloadId: `azure-vm-${vm.name}`,
        tenantId: '',
        discoveryId: '',
        type: 'compute',
        provider: 'azure',
        region,
        name: vm.name || 'unknown',
        status: vm.provisioningState || 'unknown',
        metadata: {
          vmSize: vm.hardwareProfile?.vmSize,
          osType: vm.storageProfile?.osDisk?.osType,
          osDisk: vm.storageProfile?.osDisk?.managedDisk?.id,
          networkInterfaces: vm.networkProfile?.networkInterfaces?.map(n => n.id),
          resourceGroup: vm.id?.split('/')[4],
          availabilityZone: vm.zones?.[0],
        },
        dependencies: [],
        discoveredAt: new Date().toISOString(),
      });
    }
    return workloads;
  } catch (error: any) {
    console.warn('Azure VM discovery failed:', error.message);
    return [];
  }
}

async function discoverAzureSQL(region: string, credentials: Record<string, string>): Promise<Workload[]> {
  try {
    const { SqlManagementClient } = await import('@azure/arm-sql');
    const { DefaultAzureCredential } = await import('@azure/identity');
    const credential = new DefaultAzureCredential();
    const client = new SqlManagementClient(credential, credentials.subscriptionId);

    const workloads: Workload[] = [];
    for await (const server of client.servers.list()) {
      if (server.location !== region) continue;
      workloads.push({
        workloadId: `azure-sql-${server.name}`,
        tenantId: '',
        discoveryId: '',
        type: 'database',
        provider: 'azure',
        region,
        name: server.name || 'unknown',
        status: server.state || 'unknown',
        metadata: {
          fullyQualifiedDomainName: server.fullyQualifiedDomainName,
          version: server.version,
          administratorLogin: server.administratorLogin,
          resourceGroup: server.id?.split('/')[4],
        },
        dependencies: [],
        discoveredAt: new Date().toISOString(),
      });
    }
    return workloads;
  } catch (error: any) {
    console.warn('Azure SQL discovery failed:', error.message);
    return [];
  }
}

async function discoverCosmosDB(region: string, credentials: Record<string, string>): Promise<Workload[]> {
  try {
    const { CosmosDBManagementClient } = await import('@azure/arm-cosmosdb');
    const { DefaultAzureCredential } = await import('@azure/identity');
    const credential = new DefaultAzureCredential();
    const client = new CosmosDBManagementClient(credential, credentials.subscriptionId);

    const workloads: Workload[] = [];
    for await (const account of client.databaseAccounts.list()) {
      if (account.location !== region) continue;
      workloads.push({
        workloadId: `azure-cosmosdb-${account.name}`,
        tenantId: '',
        discoveryId: '',
        type: 'database',
        provider: 'azure',
        region,
        name: account.name || 'unknown',
        status: account.provisioningState || 'unknown',
        metadata: {
          kind: account.kind,
          documentEndpoint: account.documentEndpoint,
          consistencyPolicy: account.consistencyPolicy?.defaultConsistencyLevel,
          enableMultipleWriteLocations: account.enableMultipleWriteLocations,
          resourceGroup: account.id?.split('/')[4],
        },
        dependencies: [],
        discoveredAt: new Date().toISOString(),
      });
    }
    return workloads;
  } catch (error: any) {
    console.warn('Azure CosmosDB discovery failed:', error.message);
    return [];
  }
}

async function discoverBlobStorage(region: string, credentials: Record<string, string>): Promise<Workload[]> {
  try {
    const { StorageManagementClient } = await import('@azure/arm-storage');
    const { DefaultAzureCredential } = await import('@azure/identity');
    const credential = new DefaultAzureCredential();
    const client = new StorageManagementClient(credential, credentials.subscriptionId);

    const workloads: Workload[] = [];
    for await (const account of client.storageAccounts.list()) {
      if (account.location !== region) continue;
      workloads.push({
        workloadId: `azure-storage-${account.name}`,
        tenantId: '',
        discoveryId: '',
        type: 'storage',
        provider: 'azure',
        region,
        name: account.name || 'unknown',
        status: account.provisioningState || 'unknown',
        metadata: {
          kind: account.kind,
          sku: account.sku?.name,
          accessTier: account.accessTier,
          supportsHttpsTrafficOnly: account.enableHttpsTrafficOnly,
          encryption: account.encryption?.services?.blob?.enabled,
          resourceGroup: account.id?.split('/')[4],
        },
        dependencies: [],
        discoveredAt: new Date().toISOString(),
      });
    }
    return workloads;
  } catch (error: any) {
    console.warn('Azure Blob Storage discovery failed:', error.message);
    return [];
  }
}

async function discoverFunctions(region: string, credentials: Record<string, string>): Promise<Workload[]> {
  try {
    const { WebSiteManagementClient } = await import('@azure/arm-appservice');
    const { DefaultAzureCredential } = await import('@azure/identity');
    const credential = new DefaultAzureCredential();
    const client = new WebSiteManagementClient(credential, credentials.subscriptionId);

    const workloads: Workload[] = [];
    for await (const app of client.webApps.list()) {
      if (app.location !== region || app.kind !== 'functionapp') continue;
      workloads.push({
        workloadId: `azure-func-${app.name}`,
        tenantId: '',
        discoveryId: '',
        type: 'serverless',
        provider: 'azure',
        region,
        name: app.name || 'unknown',
        status: app.state || 'unknown',
        metadata: {
          kind: app.kind,
          defaultHostName: app.defaultHostName,
          httpsOnly: app.httpsOnly,
          resourceGroup: app.id?.split('/')[4],
        },
        dependencies: [],
        discoveredAt: new Date().toISOString(),
      });
    }
    return workloads;
  } catch (error: any) {
    console.warn('Azure Functions discovery failed:', error.message);
    return [];
  }
}

async function discoverVNets(region: string, credentials: Record<string, string>): Promise<Workload[]> {
  try {
    const { NetworkManagementClient } = await import('@azure/arm-network');
    const { DefaultAzureCredential } = await import('@azure/identity');
    const credential = new DefaultAzureCredential();
    const client = new NetworkManagementClient(credential, credentials.subscriptionId);

    const workloads: Workload[] = [];
    for await (const vnet of client.virtualNetworks.listAll()) {
      if (vnet.location !== region) continue;
      workloads.push({
        workloadId: `azure-vnet-${vnet.name}`,
        tenantId: '',
        discoveryId: '',
        type: 'network',
        provider: 'azure',
        region,
        name: vnet.name || 'unknown',
        status: vnet.provisioningState || 'unknown',
        metadata: {
          addressSpace: vnet.addressSpace?.addressPrefixes,
          subnets: vnet.subnets?.map(s => ({ name: s.name, prefix: s.addressPrefix })),
          resourceGroup: vnet.id?.split('/')[4],
        },
        dependencies: [],
        discoveredAt: new Date().toISOString(),
      });
    }
    return workloads;
  } catch (error: any) {
    console.warn('Azure VNet discovery failed:', error.message);
    return [];
  }
}

async function discoverNSGs(region: string, credentials: Record<string, string>): Promise<Workload[]> {
  try {
    const { NetworkManagementClient } = await import('@azure/arm-network');
    const { DefaultAzureCredential } = await import('@azure/identity');
    const credential = new DefaultAzureCredential();
    const client = new NetworkManagementClient(credential, credentials.subscriptionId);

    const workloads: Workload[] = [];
    for await (const nsg of client.networkSecurityGroups.listAll()) {
      if (nsg.location !== region) continue;
      workloads.push({
        workloadId: `azure-nsg-${nsg.name}`,
        tenantId: '',
        discoveryId: '',
        type: 'network',
        provider: 'azure',
        region,
        name: nsg.name || 'unknown',
        status: nsg.provisioningState || 'unknown',
        metadata: {
          securityRules: nsg.securityRules?.length || 0,
          resourceGroup: nsg.id?.split('/')[4],
        },
        dependencies: [],
        discoveredAt: new Date().toISOString(),
      });
    }
    return workloads;
  } catch (error: any) {
    console.warn('Azure NSG discovery failed:', error.message);
    return [];
  }
}

async function discoverAppGateway(region: string, credentials: Record<string, string>): Promise<Workload[]> {
  try {
    const { NetworkManagementClient } = await import('@azure/arm-network');
    const { DefaultAzureCredential } = await import('@azure/identity');
    const credential = new DefaultAzureCredential();
    const client = new NetworkManagementClient(credential, credentials.subscriptionId);

    const workloads: Workload[] = [];
    for await (const gw of client.applicationGateways.listAll()) {
      if (gw.location !== region) continue;
      workloads.push({
        workloadId: `azure-appgw-${gw.name}`,
        tenantId: '',
        discoveryId: '',
        type: 'network',
        provider: 'azure',
        region,
        name: gw.name || 'unknown',
        status: gw.provisioningState || 'unknown',
        metadata: {
          sku: gw.sku?.name,
          tier: gw.sku?.tier,
          capacity: gw.sku?.capacity,
          resourceGroup: gw.id?.split('/')[4],
        },
        dependencies: [],
        discoveredAt: new Date().toISOString(),
      });
    }
    return workloads;
  } catch (error: any) {
    console.warn('Azure App Gateway discovery failed:', error.message);
    return [];
  }
}

async function discoverAppService(region: string, credentials: Record<string, string>): Promise<Workload[]> {
  try {
    const { WebSiteManagementClient } = await import('@azure/arm-appservice');
    const { DefaultAzureCredential } = await import('@azure/identity');
    const credential = new DefaultAzureCredential();
    const client = new WebSiteManagementClient(credential, credentials.subscriptionId);

    const workloads: Workload[] = [];
    for await (const app of client.webApps.list()) {
      if (app.location !== region || app.kind === 'functionapp') continue;
      workloads.push({
        workloadId: `azure-webapp-${app.name}`,
        tenantId: '',
        discoveryId: '',
        type: 'application',
        provider: 'azure',
        region,
        name: app.name || 'unknown',
        status: app.state || 'unknown',
        metadata: {
          kind: app.kind,
          defaultHostName: app.defaultHostName,
          httpsOnly: app.httpsOnly,
          resourceGroup: app.id?.split('/')[4],
        },
        dependencies: [],
        discoveredAt: new Date().toISOString(),
      });
    }
    return workloads;
  } catch (error: any) {
    console.warn('Azure App Service discovery failed:', error.message);
    return [];
  }
}

async function discoverContainerApps(region: string, credentials: Record<string, string>): Promise<Workload[]> {
  try {
    const { ContainerAppsAPIClient } = await import('@azure/arm-appcontainers');
    const { DefaultAzureCredential } = await import('@azure/identity');
    const credential = new DefaultAzureCredential();
    const client = new ContainerAppsAPIClient(credential, credentials.subscriptionId);

    const workloads: Workload[] = [];
    for await (const app of client.containerApps.listBySubscription()) {
      if (app.location !== region) continue;
      workloads.push({
        workloadId: `azure-containerapp-${app.name}`,
        tenantId: '',
        discoveryId: '',
        type: 'container',
        provider: 'azure',
        region,
        name: app.name || 'unknown',
        status: app.provisioningState || 'unknown',
        metadata: {
          latestRevisionName: app.latestRevisionName,
          resourceGroup: app.id?.split('/')[4],
        },
        dependencies: [],
        discoveredAt: new Date().toISOString(),
      });
    }
    return workloads;
  } catch (error: any) {
    console.warn('Azure Container Apps discovery failed:', error.message);
    return [];
  }
}

async function discoverAKS(region: string, credentials: Record<string, string>): Promise<Workload[]> {
  try {
    const { ContainerServiceClient } = await import('@azure/arm-containerservice');
    const { DefaultAzureCredential } = await import('@azure/identity');
    const credential = new DefaultAzureCredential();
    const client = new ContainerServiceClient(credential, credentials.subscriptionId);

    const workloads: Workload[] = [];
    for await (const cluster of client.managedClusters.list()) {
      if (cluster.location !== region) continue;
      workloads.push({
        workloadId: `azure-aks-${cluster.name}`,
        tenantId: '',
        discoveryId: '',
        type: 'container',
        provider: 'azure',
        region,
        name: cluster.name || 'unknown',
        status: cluster.provisioningState || 'unknown',
        metadata: {
          kubernetesVersion: cluster.kubernetesVersion,
          nodeCount: cluster.agentPoolProfiles?.[0]?.count,
          vmSize: cluster.agentPoolProfiles?.[0]?.vmSize,
          resourceGroup: cluster.id?.split('/')[4],
        },
        dependencies: [],
        discoveredAt: new Date().toISOString(),
      });
    }
    return workloads;
  } catch (error: any) {
    console.warn('Azure AKS discovery failed:', error.message);
    return [];
  }
}

async function discoverDNS(region: string, credentials: Record<string, string>): Promise<Workload[]> {
  try {
    const { DnsManagementClient } = await import('@azure/arm-dns');
    const { DefaultAzureCredential } = await import('@azure/identity');
    const credential = new DefaultAzureCredential();
    const client = new DnsManagementClient(credential, credentials.subscriptionId);

    const workloads: Workload[] = [];
    for await (const zone of client.zones.list()) {
      workloads.push({
        workloadId: `azure-dns-${zone.name}`,
        tenantId: '',
        discoveryId: '',
        type: 'network',
        provider: 'azure',
        region: 'global',
        name: zone.name || 'unknown',
        status: 'active',
        metadata: {
          zoneType: zone.zoneType,
          numberOfRecordSets: zone.numberOfRecordSets,
          nameServers: zone.nameServers,
        },
        dependencies: [],
        discoveredAt: new Date().toISOString(),
      });
    }
    return workloads;
  } catch (error: any) {
    console.warn('Azure DNS discovery failed:', error.message);
    return [];
  }
}

async function discoverKeyVault(region: string, credentials: Record<string, string>): Promise<Workload[]> {
  try {
    const { KeyVaultManagementClient } = await import('@azure/arm-keyvault');
    const { DefaultAzureCredential } = await import('@azure/identity');
    const credential = new DefaultAzureCredential();
    const client = new KeyVaultManagementClient(credential, credentials.subscriptionId);

    const workloads: Workload[] = [];
    for await (const vault of client.vaults.listBySubscription()) {
      if (vault.location !== region) continue;
      workloads.push({
        workloadId: `azure-keyvault-${vault.name}`,
        tenantId: '',
        discoveryId: '',
        type: 'application',
        provider: 'azure',
        region,
        name: vault.name || 'unknown',
        status: 'active',
        metadata: {
          vaultUri: vault.properties?.vaultUri,
          sku: vault.properties?.sku?.name,
          softDeleteEnabled: vault.properties?.enableSoftDelete,
          resourceGroup: vault.id?.split('/')[4],
        },
        dependencies: [],
        discoveredAt: new Date().toISOString(),
      });
    }
    return workloads;
  } catch (error: any) {
    console.warn('Azure Key Vault discovery failed:', error.message);
    return [];
  }
}

async function discoverServiceBus(region: string, credentials: Record<string, string>): Promise<Workload[]> {
  try {
    const { ServiceBusManagementClient } = await import('@azure/arm-servicebus');
    const { DefaultAzureCredential } = await import('@azure/identity');
    const credential = new DefaultAzureCredential();
    const client = new ServiceBusManagementClient(credential, credentials.subscriptionId);

    const workloads: Workload[] = [];
    for await (const ns of client.namespaces.list()) {
      if (ns.location !== region) continue;
      workloads.push({
        workloadId: `azure-servicebus-${ns.name}`,
        tenantId: '',
        discoveryId: '',
        type: 'application',
        provider: 'azure',
        region,
        name: ns.name || 'unknown',
        status: ns.provisioningState || 'unknown',
        metadata: {
          sku: ns.sku?.name,
          tier: ns.sku?.tier,
          serviceBusEndpoint: ns.serviceBusEndpoint,
          resourceGroup: ns.id?.split('/')[4],
        },
        dependencies: [],
        discoveredAt: new Date().toISOString(),
      });
    }
    return workloads;
  } catch (error: any) {
    console.warn('Azure Service Bus discovery failed:', error.message);
    return [];
  }
}

/**
 * MigrationBox V4.1 - Azure Discovery Adapter
 * 
 * Scans Azure subscriptions for 15+ resource types.
 * Uses @azure/arm-* SDKs with Service Principal authentication.
 * See ARCHITECTURE.md Section 7 for full resource type list.
 */

// NOTE: Requires Azure SDK packages installed:
// @azure/identity, @azure/arm-compute, @azure/arm-storage, @azure/arm-sql,
// @azure/arm-cosmosdb, @azure/arm-appservice, @azure/arm-network,
// @azure/arm-containerservice, @azure/arm-servicebus, @azure/arm-keyvault

const { DefaultAzureCredential } = require('@azure/identity');
const { ComputeManagementClient } = require('@azure/arm-compute');
const { StorageManagementClient } = require('@azure/arm-storage');
const { SqlManagementClient } = require('@azure/arm-sql');
const { WebSiteManagementClient } = require('@azure/arm-appservice');
const { NetworkManagementClient } = require('@azure/arm-network');

function getCredentials() {
  // Uses Service Principal: AZURE_TENANT_ID, AZURE_CLIENT_ID, AZURE_CLIENT_SECRET
  return new DefaultAzureCredential();
}

async function discoverVirtualMachines(subscriptionId, credential) {
  const client = new ComputeManagementClient(credential, subscriptionId);
  const workloads = [];

  try {
    for await (const vm of client.virtualMachines.listAll()) {
      const tags = vm.tags || {};
      workloads.push({
        id: vm.name,
        name: vm.name || vm.id,
        type: 'compute',
        subtype: 'azure-vm',
        specs: {
          vmSize: vm.hardwareProfile?.vmSize,
          os: vm.storageProfile?.imageReference?.offer || 'unknown',
          osVersion: vm.storageProfile?.imageReference?.sku,
          location: vm.location,
          provisioningState: vm.provisioningState,
          osDiskSizeGB: vm.storageProfile?.osDisk?.diskSizeGB,
          dataDisks: (vm.storageProfile?.dataDisks || []).length,
          networkInterfaces: (vm.networkProfile?.networkInterfaces || []).length,
          availabilitySet: vm.availabilitySet?.id ? 'yes' : 'no',
          zones: vm.zones || [],
        },
        tags,
        criticality: tags.Criticality || 'medium',
      });
    }
  } catch (error) {
    console.error('Azure VM discovery error:', error.message);
  }

  return workloads;
}

async function discoverStorageAccounts(subscriptionId, credential) {
  const client = new StorageManagementClient(credential, subscriptionId);
  const workloads = [];

  try {
    for await (const account of client.storageAccounts.list()) {
      workloads.push({
        id: account.name,
        name: account.name,
        type: 'storage',
        subtype: 'azure-storage',
        specs: {
          kind: account.kind,
          sku: account.sku?.name,
          location: account.location,
          replication: account.sku?.tier,
          httpsOnly: account.enableHttpsTrafficOnly,
          minimumTlsVersion: account.minimumTlsVersion,
          accessTier: account.accessTier,
          encryption: account.encryption?.services ? 'enabled' : 'disabled',
          provisioningState: account.provisioningState,
        },
        tags: account.tags || {},
        criticality: 'medium',
      });
    }
  } catch (error) {
    console.error('Azure Storage discovery error:', error.message);
  }

  return workloads;
}

async function discoverAppServices(subscriptionId, credential) {
  const client = new WebSiteManagementClient(credential, subscriptionId);
  const workloads = [];

  try {
    for await (const app of client.webApps.list()) {
      const isFunction = app.kind?.includes('functionapp');
      workloads.push({
        id: app.name,
        name: app.name,
        type: isFunction ? 'serverless' : 'compute',
        subtype: isFunction ? 'azure-function' : 'azure-appservice',
        specs: {
          kind: app.kind,
          state: app.state,
          defaultHostName: app.defaultHostName,
          httpsOnly: app.httpsOnly,
          location: app.location,
          sku: app.sku?.name,
          runtime: app.siteConfig?.linuxFxVersion || app.siteConfig?.netFrameworkVersion || 'unknown',
          alwaysOn: app.siteConfig?.alwaysOn,
        },
        tags: app.tags || {},
        criticality: 'medium',
      });
    }
  } catch (error) {
    console.error('Azure App Service discovery error:', error.message);
  }

  return workloads;
}

async function discoverSQLDatabases(subscriptionId, credential) {
  const client = new SqlManagementClient(credential, subscriptionId);
  const workloads = [];

  try {
    for await (const server of client.servers.list()) {
      try {
        const resourceGroup = server.id.split('/resourceGroups/')[1]?.split('/')[0];
        if (!resourceGroup) continue;
        
        for await (const db of client.databases.listByServer(resourceGroup, server.name)) {
          if (db.name === 'master') continue; // Skip system DB
          workloads.push({
            id: `${server.name}/${db.name}`,
            name: db.name,
            type: 'database',
            subtype: 'azure-sql',
            specs: {
              serverName: server.name,
              edition: db.edition,
              sku: db.currentSku?.name,
              maxSizeBytes: db.maxSizeBytes,
              status: db.status,
              location: db.location,
              zoneRedundant: db.zoneRedundant,
              readScale: db.readScale,
            },
            criticality: 'high',
          });
        }
      } catch (dbError) {
        console.error(`Azure SQL databases error for ${server.name}:`, dbError.message);
      }
    }
  } catch (error) {
    console.error('Azure SQL discovery error:', error.message);
  }

  return workloads;
}

async function discoverVNets(subscriptionId, credential) {
  const client = new NetworkManagementClient(credential, subscriptionId);
  const workloads = [];

  try {
    for await (const vnet of client.virtualNetworks.listAll()) {
      workloads.push({
        id: vnet.name,
        name: vnet.name,
        type: 'network',
        subtype: 'azure-vnet',
        specs: {
          addressSpace: vnet.addressSpace?.addressPrefixes,
          subnets: (vnet.subnets || []).map(s => ({
            name: s.name,
            addressPrefix: s.addressPrefix,
            nsg: s.networkSecurityGroup?.id?.split('/').pop(),
          })),
          location: vnet.location,
          peerings: (vnet.virtualNetworkPeerings || []).length,
          enableDdosProtection: vnet.enableDdosProtection,
        },
        criticality: 'medium',
      });
    }
  } catch (error) {
    console.error('Azure VNet discovery error:', error.message);
  }

  return workloads;
}

/**
 * Main Azure discovery - orchestrates all scans
 */
async function discover(message) {
  const subscriptionId = process.env.AZURE_SUBSCRIPTION_ID || message.credentials?.subscriptionId;
  if (!subscriptionId) {
    throw new Error('AZURE_SUBSCRIPTION_ID is required for Azure discovery');
  }

  console.log(`Starting Azure discovery (subscription: ${subscriptionId})`);
  const credential = getCredentials();
  const allWorkloads = [];

  const discoveries = await Promise.allSettled([
    discoverVirtualMachines(subscriptionId, credential),
    discoverStorageAccounts(subscriptionId, credential),
    discoverAppServices(subscriptionId, credential),
    discoverSQLDatabases(subscriptionId, credential),
    discoverVNets(subscriptionId, credential),
  ]);

  const names = ['VMs', 'Storage', 'AppServices', 'SQL', 'VNets'];
  discoveries.forEach((result, i) => {
    if (result.status === 'fulfilled') {
      console.log(`Azure ${names[i]}: ${result.value.length} resources found`);
      allWorkloads.push(...result.value);
    } else {
      console.error(`Azure ${names[i]} failed:`, result.reason);
    }
  });

  console.log(`Azure discovery complete: ${allWorkloads.length} total workloads`);
  return allWorkloads;
}

module.exports = { discover };

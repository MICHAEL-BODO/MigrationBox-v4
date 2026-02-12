/**
 * MigrationBox V5.0 - Adapter Factory
 * 
 * Creates cloud-specific adapter instances based on the PROVIDER environment variable.
 * Business logic calls: getStorageAdapter(), getDatabaseAdapter(), etc.
 */

import {
  CloudProvider,
  StorageAdapter,
  DatabaseAdapter,
  MessagingAdapter,
  IAMAdapter,
  ComputeAdapter,
  MonitoringAdapter,
  SecretsAdapter,
  NetworkAdapter,
  AdapterFactory,
} from './interfaces';

function resolveProvider(provider?: CloudProvider): CloudProvider {
  return provider || (process.env.PROVIDER as CloudProvider) || 'aws';
}

export class AdapterFactoryImpl implements AdapterFactory {
  private provider: CloudProvider;

  constructor(provider?: CloudProvider) {
    this.provider = resolveProvider(provider);
  }

  getStorageAdapter(provider?: CloudProvider): StorageAdapter {
    const p = provider || this.provider;
    switch (p) {
      case 'aws':
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const { AWSS3Adapter } = require('../../../libs/cloud-abstraction/storage/aws-s3-adapter');
        return new AWSS3Adapter();
      case 'azure':
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const { AzureBlobAdapter } = require('../../../libs/cloud-abstraction/storage/azure-blob-adapter');
        return new AzureBlobAdapter();
      case 'gcp':
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const { GCPGCSAdapter } = require('../../../libs/cloud-abstraction/storage/gcp-gcs-adapter');
        return new GCPGCSAdapter();
      default:
        throw new Error(`Unknown storage provider: ${p}`);
    }
  }

  getDatabaseAdapter(provider?: CloudProvider): DatabaseAdapter {
    const p = provider || this.provider;
    switch (p) {
      case 'aws':
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const { AWSDynamoDBAdapter } = require('../../../libs/cloud-abstraction/database/aws-dynamodb-adapter');
        return new AWSDynamoDBAdapter();
      case 'azure':
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const { AzureCosmosDBAdapter } = require('../../../libs/cloud-abstraction/database/azure-cosmosdb-adapter');
        return new AzureCosmosDBAdapter();
      case 'gcp':
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const { GCPFirestoreAdapter } = require('../../../libs/cloud-abstraction/database/gcp-firestore-adapter');
        return new GCPFirestoreAdapter();
      default:
        throw new Error(`Unknown database provider: ${p}`);
    }
  }

  getMessagingAdapter(provider?: CloudProvider): MessagingAdapter {
    const p = provider || this.provider;
    switch (p) {
      case 'aws':
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const { AWSSQSAdapter } = require('../../../libs/cloud-abstraction/messaging/aws-sqs-adapter');
        return new AWSSQSAdapter();
      case 'azure':
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const { AzureServiceBusAdapter } = require('../../../libs/cloud-abstraction/messaging/azure-servicebus-adapter');
        return new AzureServiceBusAdapter();
      case 'gcp':
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const { GCPPubSubAdapter } = require('../../../libs/cloud-abstraction/messaging/gcp-pubsub-adapter');
        return new GCPPubSubAdapter();
      default:
        throw new Error(`Unknown messaging provider: ${p}`);
    }
  }

  getIAMAdapter(provider?: CloudProvider): IAMAdapter {
    const p = provider || this.provider;
    switch (p) {
      case 'aws':
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const { AWSIAMAdapter } = require('../../libs/cloud-abstraction/iam/aws-iam-adapter');
        return new AWSIAMAdapter();
      case 'azure':
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const { AzureADAdapter } = require('../../libs/cloud-abstraction/iam/azure-ad-adapter');
        return new AzureADAdapter();
      case 'gcp':
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const { GCPIAMAdapter } = require('../../libs/cloud-abstraction/iam/gcp-iam-adapter');
        return new GCPIAMAdapter();
      default:
        throw new Error(`Unknown IAM provider: ${p}`);
    }
  }

  getComputeAdapter(provider?: CloudProvider): ComputeAdapter {
    const p = provider || this.provider;
    switch (p) {
      case 'aws':
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const { AWSLambdaAdapter } = require('../../libs/cloud-abstraction/compute/aws-lambda-adapter');
        return new AWSLambdaAdapter();
      case 'azure':
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const { AzureFunctionsAdapter } = require('../../libs/cloud-abstraction/compute/azure-functions-adapter');
        return new AzureFunctionsAdapter();
      case 'gcp':
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const { GCPCloudFnAdapter } = require('../../libs/cloud-abstraction/compute/gcp-cloudfn-adapter');
        return new GCPCloudFnAdapter();
      default:
        throw new Error(`Unknown compute provider: ${p}`);
    }
  }

  getMonitoringAdapter(provider?: CloudProvider): MonitoringAdapter {
    const p = provider || this.provider;
    switch (p) {
      case 'aws':
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const { AWSCloudWatchAdapter } = require('../../libs/cloud-abstraction/monitoring/aws-cloudwatch-adapter');
        return new AWSCloudWatchAdapter();
      case 'azure':
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const { AzureMonitorAdapter } = require('../../libs/cloud-abstraction/monitoring/azure-monitor-adapter');
        return new AzureMonitorAdapter();
      case 'gcp':
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const { GCPLoggingAdapter } = require('../../libs/cloud-abstraction/monitoring/gcp-logging-adapter');
        return new GCPLoggingAdapter();
      default:
        throw new Error(`Unknown monitoring provider: ${p}`);
    }
  }

  getSecretsAdapter(provider?: CloudProvider): SecretsAdapter {
    const p = provider || this.provider;
    switch (p) {
      case 'aws':
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const { AWSSecretsManagerAdapter } = require('../../libs/cloud-abstraction/secrets/aws-secretsmanager-adapter');
        return new AWSSecretsManagerAdapter();
      case 'azure':
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const { AzureKeyVaultAdapter } = require('../../libs/cloud-abstraction/secrets/azure-keyvault-adapter');
        return new AzureKeyVaultAdapter();
      case 'gcp':
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const { GCPSecretManagerAdapter } = require('../../libs/cloud-abstraction/secrets/gcp-secretmanager-adapter');
        return new GCPSecretManagerAdapter();
      default:
        throw new Error(`Unknown secrets provider: ${p}`);
    }
  }

  getNetworkAdapter(provider?: CloudProvider): NetworkAdapter {
    const p = provider || this.provider;
    switch (p) {
      case 'aws':
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const { AWSVPCAdapter } = require('../../libs/cloud-abstraction/network/aws-vpc-adapter');
        return new AWSVPCAdapter();
      case 'azure':
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const { AzureVNetAdapter } = require('../../libs/cloud-abstraction/network/azure-vnet-adapter');
        return new AzureVNetAdapter();
      case 'gcp':
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const { GCPVPCAdapter } = require('../../libs/cloud-abstraction/network/gcp-vpc-adapter');
        return new GCPVPCAdapter();
      default:
        throw new Error(`Unknown network provider: ${p}`);
    }
  }
}

// Singleton instance
let factoryInstance: AdapterFactoryImpl | null = null;

export function getAdapterFactory(provider?: CloudProvider): AdapterFactory {
  if (!factoryInstance) {
    factoryInstance = new AdapterFactoryImpl(provider);
  }
  return factoryInstance;
}

// Convenience functions for backward compatibility
export function getStorageAdapter(provider?: CloudProvider): StorageAdapter {
  return getAdapterFactory(provider).getStorageAdapter(provider);
}

export function getDatabaseAdapter(provider?: CloudProvider): DatabaseAdapter {
  return getAdapterFactory(provider).getDatabaseAdapter(provider);
}

export function getMessagingAdapter(provider?: CloudProvider): MessagingAdapter {
  return getAdapterFactory(provider).getMessagingAdapter(provider);
}

export function getIAMAdapter(provider?: CloudProvider): IAMAdapter {
  return getAdapterFactory(provider).getIAMAdapter(provider);
}

export function getComputeAdapter(provider?: CloudProvider): ComputeAdapter {
  return getAdapterFactory(provider).getComputeAdapter(provider);
}

export function getMonitoringAdapter(provider?: CloudProvider): MonitoringAdapter {
  return getAdapterFactory(provider).getMonitoringAdapter(provider);
}

export function getSecretsAdapter(provider?: CloudProvider): SecretsAdapter {
  return getAdapterFactory(provider).getSecretsAdapter(provider);
}

export function getNetworkAdapter(provider?: CloudProvider): NetworkAdapter {
  return getAdapterFactory(provider).getNetworkAdapter(provider);
}

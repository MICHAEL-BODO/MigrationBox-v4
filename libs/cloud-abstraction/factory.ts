/**
 * MigrationBox V4.1 - Adapter Factory
 * 
 * Creates cloud-specific adapter instances based on the PROVIDER environment variable.
 * Business logic calls: getStorageAdapter(), getDatabaseAdapter(), etc.
 */

import { 
  CloudProvider, StorageAdapter, DatabaseAdapter, MessagingAdapter, IAMAdapter, ComputeAdapter 
} from './interfaces';

function resolveProvider(provider?: CloudProvider): CloudProvider {
  return provider || (process.env.PROVIDER as CloudProvider) || 'aws';
}

export function getStorageAdapter(provider?: CloudProvider): StorageAdapter {
  const p = resolveProvider(provider);
  switch (p) {
    case 'aws':
      const { AWSS3Adapter } = require('./storage/aws-s3-adapter');
      return new AWSS3Adapter();
    case 'azure':
      const { AzureBlobAdapter } = require('./storage/azure-blob-adapter');
      return new AzureBlobAdapter();
    case 'gcp':
      const { GCPGCSAdapter } = require('./storage/gcp-gcs-adapter');
      return new GCPGCSAdapter();
    default:
      throw new Error(`Unknown storage provider: ${p}`);
  }
}

export function getDatabaseAdapter(provider?: CloudProvider): DatabaseAdapter {
  const p = resolveProvider(provider);
  switch (p) {
    case 'aws':
      const { AWSDynamoDBAdapter } = require('./database/aws-dynamodb-adapter');
      return new AWSDynamoDBAdapter();
    case 'azure':
      const { AzureCosmosDBAdapter } = require('./database/azure-cosmosdb-adapter');
      return new AzureCosmosDBAdapter();
    case 'gcp':
      const { GCPFirestoreAdapter } = require('./database/gcp-firestore-adapter');
      return new GCPFirestoreAdapter();
    default:
      throw new Error(`Unknown database provider: ${p}`);
  }
}

export function getMessagingAdapter(provider?: CloudProvider): MessagingAdapter {
  const p = resolveProvider(provider);
  switch (p) {
    case 'aws':
      const { AWSSQSAdapter } = require('./messaging/aws-sqs-adapter');
      return new AWSSQSAdapter();
    case 'azure':
      const { AzureServiceBusAdapter } = require('./messaging/azure-servicebus-adapter');
      return new AzureServiceBusAdapter();
    case 'gcp':
      const { GCPPubSubAdapter } = require('./messaging/gcp-pubsub-adapter');
      return new GCPPubSubAdapter();
    default:
      throw new Error(`Unknown messaging provider: ${p}`);
  }
}

export function getIAMAdapter(provider?: CloudProvider): IAMAdapter {
  const p = resolveProvider(provider);
  switch (p) {
    case 'aws':
      const { AWSIAMAdapter } = require('./iam/aws-iam-adapter');
      return new AWSIAMAdapter();
    case 'azure':
      const { AzureADAdapter } = require('./iam/azure-ad-adapter');
      return new AzureADAdapter();
    case 'gcp':
      const { GCPIAMAdapter } = require('./iam/gcp-iam-adapter');
      return new GCPIAMAdapter();
    default:
      throw new Error(`Unknown IAM provider: ${p}`);
  }
}

export function getComputeAdapter(provider?: CloudProvider): ComputeAdapter {
  const p = resolveProvider(provider);
  switch (p) {
    case 'aws':
      const { AWSLambdaAdapter } = require('./compute/aws-lambda-adapter');
      return new AWSLambdaAdapter();
    case 'azure':
      const { AzureFunctionsAdapter } = require('./compute/azure-functions-adapter');
      return new AzureFunctionsAdapter();
    case 'gcp':
      const { GCPCloudFnAdapter } = require('./compute/gcp-cloudfn-adapter');
      return new GCPCloudFnAdapter();
    default:
      throw new Error(`Unknown compute provider: ${p}`);
  }
}

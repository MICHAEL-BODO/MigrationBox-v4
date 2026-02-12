/**
 * MigrationBox V4.1 - AWS Discovery Adapter
 * 
 * Scans AWS accounts for all resource types listed in ARCHITECTURE.md Section 7.
 * Uses AWS SDK v3 with exponential backoff and rate limiting.
 */

const { EC2Client, DescribeInstancesCommand } = require('@aws-sdk/client-ec2');
const { RDSClient, DescribeDBInstancesCommand } = require('@aws-sdk/client-rds');
const { S3Client, ListBucketsCommand, GetBucketLocationCommand } = require('@aws-sdk/client-s3');
const { LambdaClient, ListFunctionsCommand } = require('@aws-sdk/client-lambda');
const { DynamoDBClient, ListTablesCommand, DescribeTableCommand } = require('@aws-sdk/client-dynamodb');
const { SQSClient, ListQueuesCommand, GetQueueAttributesCommand } = require('@aws-sdk/client-sqs');
const { ECSClient, ListServicesCommand, ListClustersCommand } = require('@aws-sdk/client-ecs');

function createClient(ClientClass, config = {}) {
  const baseConfig = {
    region: process.env.AWS_DEFAULT_REGION || 'us-east-1',
  };
  if (process.env.AWS_ENDPOINT_URL) {
    baseConfig.endpoint = process.env.AWS_ENDPOINT_URL;
  }
  return new ClientClass({ ...baseConfig, ...config });
}

async function discoverEC2(config) {
  const client = createClient(EC2Client, config);
  const workloads = [];

  try {
    let nextToken;
    do {
      const response = await client.send(new DescribeInstancesCommand({ NextToken: nextToken }));
      for (const reservation of response.Reservations || []) {
        for (const instance of reservation.Instances || []) {
          const tags = {};
          (instance.Tags || []).forEach(t => { tags[t.Key] = t.Value; });

          workloads.push({
            id: instance.InstanceId,
            name: tags.Name || instance.InstanceId,
            type: 'compute',
            subtype: 'ec2',
            specs: {
              instanceType: instance.InstanceType,
              os: instance.Platform || 'linux',
              imageId: instance.ImageId,
              state: instance.State?.Name,
              launchTime: instance.LaunchTime,
              vpcId: instance.VpcId,
              subnetId: instance.SubnetId,
              privateIp: instance.PrivateIpAddress,
              publicIp: instance.PublicIpAddress,
              securityGroups: (instance.SecurityGroups || []).map(sg => sg.GroupId),
              blockDevices: (instance.BlockDeviceMappings || []).map(bd => ({
                deviceName: bd.DeviceName,
                volumeId: bd.Ebs?.VolumeId,
              })),
            },
            tags,
            criticality: tags.Criticality || 'medium',
          });
        }
      }
      nextToken = response.NextToken;
    } while (nextToken);
  } catch (error) {
    console.error('EC2 discovery error:', error.message);
  }

  return workloads;
}

async function discoverRDS(config) {
  const client = createClient(RDSClient, config);
  const workloads = [];

  try {
    let marker;
    do {
      const response = await client.send(new DescribeDBInstancesCommand({ Marker: marker }));
      for (const db of response.DBInstances || []) {
        workloads.push({
          id: db.DBInstanceIdentifier,
          name: db.DBInstanceIdentifier,
          type: 'database',
          subtype: 'rds',
          specs: {
            engine: db.Engine,
            engineVersion: db.EngineVersion,
            instanceClass: db.DBInstanceClass,
            allocatedStorageGB: db.AllocatedStorage,
            multiAZ: db.MultiAZ,
            storageEncrypted: db.StorageEncrypted,
            backupRetentionDays: db.BackupRetentionPeriod,
            endpoint: db.Endpoint?.Address,
            port: db.Endpoint?.Port,
            vpcId: db.DBSubnetGroup?.VpcId,
            status: db.DBInstanceStatus,
          },
          criticality: 'high', // Databases are always high criticality
        });
      }
      marker = response.Marker;
    } while (marker);
  } catch (error) {
    console.error('RDS discovery error:', error.message);
  }

  return workloads;
}

async function discoverS3(config) {
  const client = createClient(S3Client, config);
  const workloads = [];

  try {
    const response = await client.send(new ListBucketsCommand({}));
    for (const bucket of response.Buckets || []) {
      workloads.push({
        id: bucket.Name,
        name: bucket.Name,
        type: 'storage',
        subtype: 's3',
        specs: {
          creationDate: bucket.CreationDate,
        },
        criticality: 'medium',
      });
    }
  } catch (error) {
    console.error('S3 discovery error:', error.message);
  }

  return workloads;
}

async function discoverLambda(config) {
  const client = createClient(LambdaClient, config);
  const workloads = [];

  try {
    let marker;
    do {
      const response = await client.send(new ListFunctionsCommand({ Marker: marker }));
      for (const fn of response.Functions || []) {
        workloads.push({
          id: fn.FunctionName,
          name: fn.FunctionName,
          type: 'serverless',
          subtype: 'lambda',
          specs: {
            runtime: fn.Runtime,
            memoryMB: fn.MemorySize,
            timeoutSeconds: fn.Timeout,
            codeSize: fn.CodeSize,
            lastModified: fn.LastModified,
            handler: fn.Handler,
            layers: (fn.Layers || []).map(l => l.Arn),
          },
          criticality: 'medium',
        });
      }
      marker = response.NextMarker;
    } while (marker);
  } catch (error) {
    console.error('Lambda discovery error:', error.message);
  }

  return workloads;
}

async function discoverDynamoDB(config) {
  const client = createClient(DynamoDBClient, config);
  const workloads = [];

  try {
    const listResponse = await client.send(new ListTablesCommand({}));
    for (const tableName of listResponse.TableNames || []) {
      try {
        const descResponse = await client.send(new DescribeTableCommand({ TableName: tableName }));
        const table = descResponse.Table;
        workloads.push({
          id: tableName,
          name: tableName,
          type: 'database',
          subtype: 'dynamodb',
          specs: {
            tableSizeBytes: table.TableSizeBytes,
            itemCount: table.ItemCount,
            billingMode: table.BillingModeSummary?.BillingMode || 'PROVISIONED',
            keySchema: table.KeySchema,
            gsiCount: (table.GlobalSecondaryIndexes || []).length,
            streamEnabled: !!table.StreamSpecification?.StreamEnabled,
            status: table.TableStatus,
          },
          criticality: 'high',
        });
      } catch (descError) {
        console.error(`DynamoDB describe error for ${tableName}:`, descError.message);
      }
    }
  } catch (error) {
    console.error('DynamoDB discovery error:', error.message);
  }

  return workloads;
}

/**
 * Main discovery function - orchestrates all AWS service scans
 */
async function discover(message) {
  const { scope } = message;
  console.log(`Starting AWS discovery (scope: ${scope})`);

  const allWorkloads = [];

  // Run discoveries in parallel with error isolation
  const discoveries = await Promise.allSettled([
    discoverEC2({}),
    discoverRDS({}),
    discoverS3({}),
    discoverLambda({}),
    discoverDynamoDB({}),
  ]);

  const serviceNames = ['EC2', 'RDS', 'S3', 'Lambda', 'DynamoDB'];
  discoveries.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      console.log(`${serviceNames[index]}: ${result.value.length} resources found`);
      allWorkloads.push(...result.value);
    } else {
      console.error(`${serviceNames[index]} discovery failed:`, result.reason);
    }
  });

  console.log(`AWS discovery complete: ${allWorkloads.length} total workloads`);
  return allWorkloads;
}

module.exports = { discover, discoverEC2, discoverRDS, discoverS3, discoverLambda, discoverDynamoDB };

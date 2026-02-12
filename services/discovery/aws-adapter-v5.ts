/**
 * MigrationBox V5.0 - AWS Discovery Adapter
 * 
 * Comprehensive AWS resource discovery supporting 14+ resource types.
 * Uses AWS SDK v3 with exponential backoff and rate limiting.
 * Integrates with CAL adapters and Neo4j for dependency mapping.
 */

import {
  EC2Client,
  DescribeInstancesCommand,
  DescribeImagesCommand,
  DescribeSnapshotsCommand,
  DescribeVpcsCommand,
  DescribeSubnetsCommand,
  DescribeSecurityGroupsCommand,
  DescribeNetworkAclsCommand,
} from '@aws-sdk/client-ec2';
import {
  RDSClient,
  DescribeDBInstancesCommand,
  DescribeDBClustersCommand,
  DescribeDBSnapshotsCommand,
} from '@aws-sdk/client-rds';
import {
  S3Client,
  ListBucketsCommand,
  GetBucketLifecycleConfigurationCommand,
  GetBucketReplicationCommand,
} from '@aws-sdk/client-s3';
import {
  LambdaClient,
  ListFunctionsCommand,
  ListLayersCommand,
  ListEventSourceMappingsCommand,
} from '@aws-sdk/client-lambda';
import {
  ElasticLoadBalancingV2Client,
  DescribeLoadBalancersCommand,
  DescribeTargetGroupsCommand,
} from '@aws-sdk/client-elastic-load-balancing-v2';
import {
  DynamoDBClient,
  ListTablesCommand,
  DescribeTableCommand,
} from '@aws-sdk/client-dynamodb';
import {
  ECSClient,
  ListClustersCommand,
  DescribeClustersCommand,
  ListServicesCommand,
  DescribeServicesCommand,
} from '@aws-sdk/client-ecs';
import {
  EKSClient,
  ListClustersCommand as EKSListClustersCommand,
  DescribeClusterCommand,
} from '@aws-sdk/client-eks';
import {
  IAMClient,
  ListUsersCommand,
  ListRolesCommand,
  ListPoliciesCommand,
} from '@aws-sdk/client-iam';
import {
  Route53Client,
  ListHostedZonesCommand,
} from '@aws-sdk/client-route-53';
import {
  CloudWatchClient,
  ListMetricsCommand,
} from '@aws-sdk/client-cloudwatch';
import {
  SecretsManagerClient,
  ListSecretsCommand,
} from '@aws-sdk/client-secrets-manager';
import {
  SQSClient,
  ListQueuesCommand,
} from '@aws-sdk/client-sqs';
import {
  SNSClient,
  ListTopicsCommand,
} from '@aws-sdk/client-sns';
import {
  KinesisClient,
  ListStreamsCommand,
} from '@aws-sdk/client-kinesis';
import { Workload } from '@migrationbox/types';

interface DiscoveryConfig {
  region?: string;
  credentials?: {
    accessKeyId?: string;
    secretAccessKey?: string;
    sessionToken?: string;
  };
}

function createClient<T>(ClientClass: new (config: any) => T, config: DiscoveryConfig = {}): T {
  const baseConfig: any = {
    region: config.region || process.env.AWS_DEFAULT_REGION || 'us-east-1',
  };

  if (process.env.AWS_ENDPOINT_URL) {
    baseConfig.endpoint = process.env.AWS_ENDPOINT_URL;
  }

  if (config.credentials) {
    baseConfig.credentials = config.credentials;
  }

  return new ClientClass(baseConfig);
}

/**
 * EC2 Discovery - Instances, AMIs, Snapshots
 */
export async function discoverEC2(config: DiscoveryConfig = {}): Promise<Workload[]> {
  const client = createClient(EC2Client, config);
  const workloads: Workload[] = [];

  try {
    // Discover EC2 Instances
    let nextToken: string | undefined;
    do {
      const response = await client.send(new DescribeInstancesCommand({ NextToken: nextToken }));
      for (const reservation of response.Reservations || []) {
        for (const instance of reservation.Instances || []) {
          const tags: Record<string, string> = {};
          (instance.Tags || []).forEach(t => {
            if (t.Key && t.Value) tags[t.Key] = t.Value;
          });

          workloads.push({
            workloadId: `ec2-${instance.InstanceId}`,
            tenantId: 'default', // Will be set by caller
            discoveryId: 'pending', // Will be set by caller
            type: 'compute',
            provider: 'aws',
            region: config.region || 'us-east-1',
            name: tags.Name || instance.InstanceId || '',
            status: instance.State?.Name || 'unknown',
            metadata: {
              instanceId: instance.InstanceId,
              instanceType: instance.InstanceType,
              platform: instance.Platform || 'linux',
              imageId: instance.ImageId,
              launchTime: instance.LaunchTime?.toISOString(),
              vpcId: instance.VpcId,
              subnetId: instance.SubnetId,
              privateIp: instance.PrivateIpAddress,
              publicIp: instance.PublicIpAddress,
              securityGroups: (instance.SecurityGroups || []).map(sg => sg.GroupId || ''),
              blockDevices: (instance.BlockDeviceMappings || []).map(bd => ({
                deviceName: bd.DeviceName,
                volumeId: bd.Ebs?.VolumeId,
              })),
              tags,
            },
            dependencies: [
              ...(instance.VpcId ? [`network-vpc-${instance.VpcId}`] : []),
              ...(instance.SubnetId ? [`network-subnet-${instance.SubnetId}`] : []),
              ...(instance.SecurityGroups || []).map(sg => `network-sg-${sg.GroupId}`),
            ],
            discoveredAt: new Date().toISOString(),
          });
        }
      }
      nextToken = response.NextToken;
    } while (nextToken);

    // Discover AMIs
    const amiResponse = await client.send(new DescribeImagesCommand({
      Owners: ['self'], // Only AMIs owned by the account
    }));
    for (const image of amiResponse.Images || []) {
      workloads.push({
        workloadId: `ami-${image.ImageId}`,
        tenantId: 'default',
        discoveryId: 'pending',
        type: 'compute',
        provider: 'aws',
        region: config.region || 'us-east-1',
        name: image.Name || image.ImageId || '',
        status: 'available',
        metadata: {
          imageId: image.ImageId,
          architecture: image.Architecture,
          platform: image.PlatformDetails,
          creationDate: image.CreationDate,
          imageType: image.ImageType,
        },
        discoveredAt: new Date().toISOString(),
      });
    }

    // Discover Snapshots
    let snapshotToken: string | undefined;
    do {
      const snapshotResponse = await client.send(new DescribeSnapshotsCommand({
        OwnerIds: ['self'],
        NextToken: snapshotToken,
      }));
      for (const snapshot of snapshotResponse.Snapshots || []) {
        workloads.push({
          workloadId: `snapshot-${snapshot.SnapshotId}`,
          tenantId: 'default',
          discoveryId: 'pending',
          type: 'storage',
          provider: 'aws',
          region: config.region || 'us-east-1',
          name: snapshot.SnapshotId || '',
          status: snapshot.State || 'unknown',
          metadata: {
            snapshotId: snapshot.SnapshotId,
            volumeId: snapshot.VolumeId,
            volumeSize: snapshot.VolumeSize,
            startTime: snapshot.StartTime?.toISOString(),
            encrypted: snapshot.Encrypted,
          },
          dependencies: snapshot.VolumeId ? [`volume-${snapshot.VolumeId}`] : [],
          discoveredAt: new Date().toISOString(),
        });
      }
      snapshotToken = snapshotResponse.NextToken;
    } while (snapshotToken);

  } catch (error: any) {
    console.error('EC2 discovery error:', error.message);
  }

  return workloads;
}

/**
 * RDS Discovery - Instances, Clusters, Snapshots
 */
export async function discoverRDS(config: DiscoveryConfig = {}): Promise<Workload[]> {
  const client = createClient(RDSClient, config);
  const workloads: Workload[] = [];

  try {
    // Discover RDS Instances
    let marker: string | undefined;
    do {
      const response = await client.send(new DescribeDBInstancesCommand({ Marker: marker }));
      for (const db of response.DBInstances || []) {
        workloads.push({
          workloadId: `rds-${db.DBInstanceIdentifier}`,
          tenantId: 'default',
          discoveryId: 'pending',
          type: 'database',
          provider: 'aws',
          region: config.region || 'us-east-1',
          name: db.DBInstanceIdentifier || '',
          status: db.DBInstanceStatus || 'unknown',
          metadata: {
            dbInstanceIdentifier: db.DBInstanceIdentifier,
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
            subnetIds: db.DBSubnetGroup?.Subnets?.map(s => s.SubnetIdentifier || ''),
            securityGroups: db.VpcSecurityGroups?.map(sg => sg.VpcSecurityGroupId || ''),
            parameterGroup: db.DBParameterGroups?.[0]?.DBParameterGroupName,
            optionGroup: db.OptionGroupMemberships?.[0]?.OptionGroupName,
          },
          dependencies: [
            ...(db.DBSubnetGroup?.VpcId ? [`network-vpc-${db.DBSubnetGroup.VpcId}`] : []),
            ...(db.VpcSecurityGroups || []).map(sg => `network-sg-${sg.VpcSecurityGroupId}`),
          ],
          discoveredAt: new Date().toISOString(),
        });
      }
      marker = response.Marker;
    } while (marker);

    // Discover RDS Clusters (Aurora)
    let clusterMarker: string | undefined;
    do {
      const clusterResponse = await client.send(new DescribeDBClustersCommand({ Marker: clusterMarker }));
      for (const cluster of clusterResponse.DBClusters || []) {
        workloads.push({
          workloadId: `rds-cluster-${cluster.DBClusterIdentifier}`,
          tenantId: 'default',
          discoveryId: 'pending',
          type: 'database',
          provider: 'aws',
          region: config.region || 'us-east-1',
          name: cluster.DBClusterIdentifier || '',
          status: cluster.Status || 'unknown',
          metadata: {
            dbClusterIdentifier: cluster.DBClusterIdentifier,
            engine: cluster.Engine,
            engineVersion: cluster.EngineVersion,
            databaseName: cluster.DatabaseName,
            endpoint: cluster.Endpoint,
            readerEndpoint: cluster.ReaderEndpoint,
            port: cluster.Port,
            multiAZ: cluster.MultiAZ,
            backupRetentionDays: cluster.BackupRetentionPeriod,
            vpcId: cluster.DBSubnetGroup?.VpcId,
            securityGroups: cluster.VpcSecurityGroups?.map(sg => sg.VpcSecurityGroupId || ''),
            members: cluster.DBClusterMembers?.map(m => m.DBInstanceIdentifier || ''),
          },
          dependencies: [
            ...(cluster.DBSubnetGroup?.VpcId ? [`network-vpc-${cluster.DBSubnetGroup.VpcId}`] : []),
            ...(cluster.VpcSecurityGroups || []).map(sg => `network-sg-${sg.VpcSecurityGroupId}`),
            ...(cluster.DBClusterMembers || []).map(m => `rds-${m.DBInstanceIdentifier}`),
          ],
          discoveredAt: new Date().toISOString(),
        });
      }
      clusterMarker = clusterResponse.Marker;
    } while (clusterMarker);

    // Discover RDS Snapshots
    let snapshotMarker: string | undefined;
    do {
      const snapshotResponse = await client.send(new DescribeDBSnapshotsCommand({ Marker: snapshotMarker }));
      for (const snapshot of snapshotResponse.DBSnapshots || []) {
        workloads.push({
          workloadId: `rds-snapshot-${snapshot.DBSnapshotIdentifier}`,
          tenantId: 'default',
          discoveryId: 'pending',
          type: 'database',
          provider: 'aws',
          region: config.region || 'us-east-1',
          name: snapshot.DBSnapshotIdentifier || '',
          status: snapshot.Status || 'unknown',
          metadata: {
            snapshotIdentifier: snapshot.DBSnapshotIdentifier,
            dbInstanceIdentifier: snapshot.DBInstanceIdentifier,
            snapshotType: snapshot.SnapshotType,
            engine: snapshot.Engine,
            allocatedStorageGB: snapshot.AllocatedStorage,
            snapshotCreateTime: snapshot.SnapshotCreateTime?.toISOString(),
          },
          dependencies: snapshot.DBInstanceIdentifier ? [`rds-${snapshot.DBInstanceIdentifier}`] : [],
          discoveredAt: new Date().toISOString(),
        });
      }
      snapshotMarker = snapshotResponse.Marker;
    } while (snapshotMarker);

  } catch (error: any) {
    console.error('RDS discovery error:', error.message);
  }

  return workloads;
}

/**
 * S3 Discovery - Buckets, Lifecycle, Replication
 */
export async function discoverS3(config: DiscoveryConfig = {}): Promise<Workload[]> {
  const client = createClient(S3Client, config);
  const workloads: Workload[] = [];

  try {
    const response = await client.send(new ListBucketsCommand({}));
    for (const bucket of response.Buckets || []) {
      if (!bucket.Name) continue;

      // Get bucket location
      let region = config.region || 'us-east-1';
      try {
        const locationResponse = await client.send(new GetBucketLocationCommand({ Bucket: bucket.Name }));
        region = locationResponse.LocationConstraint || 'us-east-1';
      } catch (error) {
        // Ignore location errors
      }

      // Get lifecycle configuration
      let lifecycleRules: any[] = [];
      try {
        const lifecycleResponse = await client.send(new GetBucketLifecycleConfigurationCommand({
          Bucket: bucket.Name,
        }));
        lifecycleRules = lifecycleResponse.Rules || [];
      } catch (error) {
        // Lifecycle might not be configured
      }

      // Get replication configuration
      let replicationConfig: any = null;
      try {
        const replicationResponse = await client.send(new GetBucketReplicationCommand({
          Bucket: bucket.Name,
        }));
        replicationConfig = replicationResponse.ReplicationConfiguration || null;
      } catch (error) {
        // Replication might not be configured
      }

      workloads.push({
        workloadId: `s3-${bucket.Name}`,
        tenantId: 'default',
        discoveryId: 'pending',
        type: 'storage',
        provider: 'aws',
        region,
        name: bucket.Name,
        status: 'available',
        metadata: {
          bucketName: bucket.Name,
          creationDate: bucket.CreationDate?.toISOString(),
          lifecycleRules,
          replicationEnabled: !!replicationConfig,
          replicationRules: replicationConfig?.Rules || [],
        },
        discoveredAt: new Date().toISOString(),
      });
    }
  } catch (error: any) {
    console.error('S3 discovery error:', error.message);
  }

  return workloads;
}

/**
 * Lambda Discovery - Functions, Layers, Triggers
 */
export async function discoverLambda(config: DiscoveryConfig = {}): Promise<Workload[]> {
  const client = createClient(LambdaClient, config);
  const workloads: Workload[] = [];

  try {
    // Discover Lambda Functions
    let marker: string | undefined;
    do {
      const response = await client.send(new ListFunctionsCommand({ Marker: marker }));
      for (const fn of response.Functions || []) {
        // Get event source mappings (triggers)
        let triggers: any[] = [];
        try {
          const triggerResponse = await client.send(new ListEventSourceMappingsCommand({
            FunctionName: fn.FunctionName,
          }));
          triggers = triggerResponse.EventSourceMappings || [];
        } catch (error) {
          // No triggers or error
        }

        workloads.push({
          workloadId: `lambda-${fn.FunctionName}`,
          tenantId: 'default',
          discoveryId: 'pending',
          type: 'serverless',
          provider: 'aws',
          region: config.region || 'us-east-1',
          name: fn.FunctionName || '',
          status: fn.State || 'Active',
          metadata: {
            functionName: fn.FunctionName,
            runtime: fn.Runtime,
            memoryMB: fn.MemorySize,
            timeoutSeconds: fn.Timeout,
            codeSize: fn.CodeSize,
            lastModified: fn.LastModified,
            handler: fn.Handler,
            layers: (fn.Layers || []).map(l => l.Arn || ''),
            environmentVariables: fn.Environment?.Variables || {},
            vpcConfig: fn.VpcConfig ? {
              vpcId: fn.VpcConfig.VpcId,
              subnetIds: fn.VpcConfig.SubnetIds || [],
              securityGroupIds: fn.VpcConfig.SecurityGroupIds || [],
            } : null,
            triggers,
          },
          dependencies: [
            ...(fn.VpcConfig?.VpcId ? [`network-vpc-${fn.VpcConfig.VpcId}`] : []),
            ...(fn.VpcConfig?.SubnetIds || []).map(s => `network-subnet-${s}`),
            ...(fn.VpcConfig?.SecurityGroupIds || []).map(sg => `network-sg-${sg}`),
            ...(fn.Layers || []).map(l => `lambda-layer-${l.Arn}`),
          ],
          discoveredAt: new Date().toISOString(),
        });
      }
      marker = response.NextMarker;
    } while (marker);

    // Discover Lambda Layers
    let layerMarker: string | undefined;
    do {
      const layerResponse = await client.send(new ListLayersCommand({ Marker: layerMarker }));
      for (const layer of layerResponse.Layers || []) {
        workloads.push({
          workloadId: `lambda-layer-${layer.LayerArn}`,
          tenantId: 'default',
          discoveryId: 'pending',
          type: 'serverless',
          provider: 'aws',
          region: config.region || 'us-east-1',
          name: layer.LayerName || '',
          status: 'available',
          metadata: {
            layerArn: layer.LayerArn,
            layerName: layer.LayerName,
            latestMatchingVersion: layer.LatestMatchingVersion,
            compatibleRuntimes: layer.CompatibleRuntimes || [],
          },
          discoveredAt: new Date().toISOString(),
        });
      }
      layerMarker = layerResponse.NextMarker;
    } while (layerMarker);

  } catch (error: any) {
    console.error('Lambda discovery error:', error.message);
  }

  return workloads;
}

/**
 * VPC Discovery - VPCs, Subnets, Security Groups, NACLs
 */
export async function discoverVPC(config: DiscoveryConfig = {}): Promise<Workload[]> {
  const client = createClient(EC2Client, config);
  const workloads: Workload[] = [];

  try {
    // Discover VPCs
    const vpcResponse = await client.send(new DescribeVpcsCommand({}));
    for (const vpc of vpcResponse.Vpcs || []) {
      workloads.push({
        workloadId: `vpc-${vpc.VpcId}`,
        tenantId: 'default',
        discoveryId: 'pending',
        type: 'network',
        provider: 'aws',
        region: config.region || 'us-east-1',
        name: vpc.Tags?.find(t => t.Key === 'Name')?.Value || vpc.VpcId || '',
        status: vpc.State || 'available',
        metadata: {
          vpcId: vpc.VpcId,
          cidrBlock: vpc.CidrBlock,
          cidrBlockAssociationSet: vpc.CidrBlockAssociationSet?.map(c => ({
            cidrBlock: c.CidrBlock,
            state: c.CidrBlockState?.State,
          })),
          isDefault: vpc.IsDefault,
          dhcpOptionsId: vpc.DhcpOptionsId,
          tags: (vpc.Tags || []).reduce((acc, t) => {
            if (t.Key && t.Value) acc[t.Key] = t.Value;
            return acc;
          }, {} as Record<string, string>),
        },
        discoveredAt: new Date().toISOString(),
      });
    }

    // Discover Subnets
    const subnetResponse = await client.send(new DescribeSubnetsCommand({}));
    for (const subnet of subnetResponse.Subnets || []) {
      workloads.push({
        workloadId: `subnet-${subnet.SubnetId}`,
        tenantId: 'default',
        discoveryId: 'pending',
        type: 'network',
        provider: 'aws',
        region: config.region || 'us-east-1',
        name: subnet.Tags?.find(t => t.Key === 'Name')?.Value || subnet.SubnetId || '',
        status: subnet.State || 'available',
        metadata: {
          subnetId: subnet.SubnetId,
          vpcId: subnet.VpcId,
          cidrBlock: subnet.CidrBlock,
          availabilityZone: subnet.AvailabilityZone,
          availableIpAddressCount: subnet.AvailableIpAddressCount,
          mapPublicIpOnLaunch: subnet.MapPublicIpOnLaunch,
          tags: (subnet.Tags || []).reduce((acc, t) => {
            if (t.Key && t.Value) acc[t.Key] = t.Value;
            return acc;
          }, {} as Record<string, string>),
        },
        dependencies: subnet.VpcId ? [`vpc-${subnet.VpcId}`] : [],
        discoveredAt: new Date().toISOString(),
      });
    }

    // Discover Security Groups
    const sgResponse = await client.send(new DescribeSecurityGroupsCommand({}));
    for (const sg of sgResponse.SecurityGroups || []) {
      workloads.push({
        workloadId: `sg-${sg.GroupId}`,
        tenantId: 'default',
        discoveryId: 'pending',
        type: 'network',
        provider: 'aws',
        region: config.region || 'us-east-1',
        name: sg.GroupName || sg.GroupId || '',
        status: 'active',
        metadata: {
          groupId: sg.GroupId,
          groupName: sg.GroupName,
          vpcId: sg.VpcId,
          description: sg.Description,
          ingressRules: sg.IpPermissions?.map(rule => ({
            protocol: rule.IpProtocol,
            fromPort: rule.FromPort,
            toPort: rule.ToPort,
            ipRanges: rule.IpRanges?.map(r => r.CidrIp),
            userIdGroupPairs: rule.UserIdGroupPairs?.map(p => ({
              groupId: p.GroupId,
              userId: p.UserId,
            })),
          })),
          egressRules: sg.IpPermissionsEgress?.map(rule => ({
            protocol: rule.IpProtocol,
            fromPort: rule.FromPort,
            toPort: rule.ToPort,
            ipRanges: rule.IpRanges?.map(r => r.CidrIp),
          })),
          tags: (sg.Tags || []).reduce((acc, t) => {
            if (t.Key && t.Value) acc[t.Key] = t.Value;
            return acc;
          }, {} as Record<string, string>),
        },
        dependencies: sg.VpcId ? [`vpc-${sg.VpcId}`] : [],
        discoveredAt: new Date().toISOString(),
      });
    }

    // Discover Network ACLs
    const naclResponse = await client.send(new DescribeNetworkAclsCommand({}));
    for (const nacl of naclResponse.NetworkAcls || []) {
      workloads.push({
        workloadId: `nacl-${nacl.NetworkAclId}`,
        tenantId: 'default',
        discoveryId: 'pending',
        type: 'network',
        provider: 'aws',
        region: config.region || 'us-east-1',
        name: nacl.NetworkAclId || '',
        status: nacl.IsDefault ? 'default' : 'custom',
        metadata: {
          networkAclId: nacl.NetworkAclId,
          vpcId: nacl.VpcId,
          isDefault: nacl.IsDefault,
          associations: nacl.Associations?.map(a => ({
            networkAclAssociationId: a.NetworkAclAssociationId,
            subnetId: a.SubnetId,
          })),
          entries: nacl.Entries?.map(e => ({
            ruleNumber: e.RuleNumber,
            protocol: e.Protocol,
            ruleAction: e.RuleAction,
            cidrBlock: e.CidrBlock,
            portRange: e.PortRange,
          })),
        },
        dependencies: [
          ...(nacl.VpcId ? [`vpc-${nacl.VpcId}`] : []),
          ...(nacl.Associations || []).map(a => `subnet-${a.SubnetId}`),
        ],
        discoveredAt: new Date().toISOString(),
      });
    }

  } catch (error: any) {
    console.error('VPC discovery error:', error.message);
  }

  return workloads;
}

/**
 * ELB/ALB Discovery - Load Balancers, Target Groups
 */
export async function discoverELB(config: DiscoveryConfig = {}): Promise<Workload[]> {
  const client = createClient(ElasticLoadBalancingV2Client, config);
  const workloads: Workload[] = [];

  try {
    // Discover Load Balancers
    let lbMarker: string | undefined;
    do {
      const lbResponse = await client.send(new DescribeLoadBalancersCommand({ Marker: lbMarker }));
      for (const lb of lbResponse.LoadBalancers || []) {
        workloads.push({
          workloadId: `lb-${lb.LoadBalancerArn?.split('/').pop() || lb.LoadBalancerName}`,
          tenantId: 'default',
          discoveryId: 'pending',
          type: 'network',
          provider: 'aws',
          region: config.region || 'us-east-1',
          name: lb.LoadBalancerName || '',
          status: lb.State?.Code || 'unknown',
          metadata: {
            loadBalancerArn: lb.LoadBalancerArn,
            loadBalancerName: lb.LoadBalancerName,
            type: lb.Type,
            scheme: lb.Scheme,
            dnsName: lb.DNSName,
            canonicalHostedZoneId: lb.CanonicalHostedZoneId,
            vpcId: lb.VpcId,
            subnets: lb.AvailabilityZones?.map(az => az.SubnetId || ''),
            securityGroups: lb.SecurityGroups || [],
            listeners: lb.AvailabilityZones?.map(az => ({
              zone: az.ZoneName,
              subnetId: az.SubnetId,
            })),
          },
          dependencies: [
            ...(lb.VpcId ? [`vpc-${lb.VpcId}`] : []),
            ...(lb.AvailabilityZones || []).map(az => `subnet-${az.SubnetId}`),
            ...(lb.SecurityGroups || []).map(sg => `sg-${sg}`),
          ],
          discoveredAt: new Date().toISOString(),
        });
      }
      lbMarker = lbResponse.NextMarker;
    } while (lbMarker);

    // Discover Target Groups
    let tgMarker: string | undefined;
    do {
      const tgResponse = await client.send(new DescribeTargetGroupsCommand({ Marker: tgMarker }));
      for (const tg of tgResponse.TargetGroups || []) {
        workloads.push({
          workloadId: `tg-${tg.TargetGroupArn?.split('/').pop() || tg.TargetGroupName}`,
          tenantId: 'default',
          discoveryId: 'pending',
          type: 'network',
          provider: 'aws',
          region: config.region || 'us-east-1',
          name: tg.TargetGroupName || '',
          status: tg.TargetHealthDescriptions?.[0]?.TargetHealth?.State || 'unknown',
          metadata: {
            targetGroupArn: tg.TargetGroupArn,
            targetGroupName: tg.TargetGroupName,
            protocol: tg.Protocol,
            port: tg.Port,
            vpcId: tg.VpcId,
            healthCheckProtocol: tg.HealthCheckProtocol,
            healthCheckPath: tg.HealthCheckPath,
            healthCheckIntervalSeconds: tg.HealthCheckIntervalSeconds,
            healthyThresholdCount: tg.HealthyThresholdCount,
            unhealthyThresholdCount: tg.UnhealthyThresholdCount,
          },
          dependencies: tg.VpcId ? [`vpc-${tg.VpcId}`] : [],
          discoveredAt: new Date().toISOString(),
        });
      }
      tgMarker = tgResponse.NextMarker;
    } while (tgMarker);

  } catch (error: any) {
    console.error('ELB discovery error:', error.message);
  }

  return workloads;
}

/**
 * DynamoDB Discovery - Tables, Indexes
 */
export async function discoverDynamoDB(config: DiscoveryConfig = {}): Promise<Workload[]> {
  const client = createClient(DynamoDBClient, config);
  const workloads: Workload[] = [];

  try {
    const listResponse = await client.send(new ListTablesCommand({}));
    for (const tableName of listResponse.TableNames || []) {
      try {
        const descResponse = await client.send(new DescribeTableCommand({ TableName: tableName }));
        const table = descResponse.Table;
        if (!table) continue;

        workloads.push({
          workloadId: `dynamodb-${tableName}`,
          tenantId: 'default',
          discoveryId: 'pending',
          type: 'database',
          provider: 'aws',
          region: config.region || 'us-east-1',
          name: tableName,
          status: table.TableStatus || 'unknown',
          metadata: {
            tableName,
            tableSizeBytes: table.TableSizeBytes,
            itemCount: table.ItemCount,
            billingMode: table.BillingModeSummary?.BillingMode || 'PROVISIONED',
            keySchema: table.KeySchema?.map(ks => ({
              attributeName: ks.AttributeName,
              keyType: ks.KeyType,
            })),
            gsiCount: (table.GlobalSecondaryIndexes || []).length,
            lsiCount: (table.LocalSecondaryIndexes || []).length,
            streamEnabled: !!table.StreamSpecification?.StreamEnabled,
            streamViewType: table.StreamSpecification?.StreamViewType,
            pointInTimeRecoveryEnabled: table.PointInTimeRecoveryDescription?.PointInTimeRecoveryStatus === 'ENABLED',
            globalSecondaryIndexes: table.GlobalSecondaryIndexes?.map(gsi => ({
              indexName: gsi.IndexName,
              keySchema: gsi.KeySchema?.map(ks => ({
                attributeName: ks.AttributeName,
                keyType: ks.KeyType,
              })),
            })),
          },
          discoveredAt: new Date().toISOString(),
        });
      } catch (descError: any) {
        console.error(`DynamoDB describe error for ${tableName}:`, descError.message);
      }
    }
  } catch (error: any) {
    console.error('DynamoDB discovery error:', error.message);
  }

  return workloads;
}

/**
 * ECS Discovery - Clusters, Services, Tasks
 */
export async function discoverECS(config: DiscoveryConfig = {}): Promise<Workload[]> {
  const client = createClient(ECSClient, config);
  const workloads: Workload[] = [];

  try {
    // Discover ECS Clusters
    const clustersResponse = await client.send(new ListClustersCommand({}));
    if (clustersResponse.clusterArns && clustersResponse.clusterArns.length > 0) {
      const describeResponse = await client.send(new DescribeClustersCommand({
        clusters: clustersResponse.clusterArns,
      }));

      for (const cluster of describeResponse.clusters || []) {
        workloads.push({
          workloadId: `ecs-cluster-${cluster.clusterArn?.split('/').pop() || cluster.clusterName}`,
          tenantId: 'default',
          discoveryId: 'pending',
          type: 'container',
          provider: 'aws',
          region: config.region || 'us-east-1',
          name: cluster.clusterName || '',
          status: cluster.status || 'unknown',
          metadata: {
            clusterArn: cluster.clusterArn,
            clusterName: cluster.clusterName,
            activeServicesCount: cluster.activeServicesCount,
            runningTasksCount: cluster.runningTasksCount,
            pendingTasksCount: cluster.pendingTasksCount,
            registeredContainerInstancesCount: cluster.registeredContainerInstancesCount,
            capacityProviders: cluster.capacityProviders || [],
            defaultCapacityProviderStrategy: cluster.defaultCapacityProviderStrategy,
          },
          discoveredAt: new Date().toISOString(),
        });

        // Discover Services in this cluster
        let serviceMarker: string | undefined;
        do {
          const servicesResponse = await client.send(new ListServicesCommand({
            cluster: cluster.clusterName,
            nextToken: serviceMarker,
          }));

          if (servicesResponse.serviceArns && servicesResponse.serviceArns.length > 0) {
            const describeServicesResponse = await client.send(new DescribeServicesCommand({
              cluster: cluster.clusterName,
              services: servicesResponse.serviceArns,
            }));

            for (const service of describeServicesResponse.services || []) {
              workloads.push({
                workloadId: `ecs-service-${service.serviceArn?.split('/').pop() || service.serviceName}`,
                tenantId: 'default',
                discoveryId: 'pending',
                type: 'container',
                provider: 'aws',
                region: config.region || 'us-east-1',
                name: service.serviceName || '',
                status: service.status || 'unknown',
                metadata: {
                  serviceArn: service.serviceArn,
                  serviceName: service.serviceName,
                  taskDefinition: service.taskDefinition,
                  desiredCount: service.desiredCount,
                  runningCount: service.runningCount,
                  pendingCount: service.pendingCount,
                  launchType: service.launchType,
                  loadBalancers: service.loadBalancers || [],
                  networkConfiguration: service.networkConfiguration,
                },
                dependencies: [
                  `ecs-cluster-${cluster.clusterName}`,
                  ...(service.loadBalancers || []).map(lb => `lb-${lb.targetGroupArn?.split('/').pop()}`),
                ],
                discoveredAt: new Date().toISOString(),
              });
            }
          }

          serviceMarker = servicesResponse.nextToken;
        } while (serviceMarker);
      }
    }
  } catch (error: any) {
    console.error('ECS discovery error:', error.message);
  }

  return workloads;
}

/**
 * EKS Discovery - Clusters
 */
export async function discoverEKS(config: DiscoveryConfig = {}): Promise<Workload[]> {
  const client = createClient(EKSClient, config);
  const workloads: Workload[] = [];

  try {
    let clusterMarker: string | undefined;
    do {
      const listResponse = await client.send(new EKSListClustersCommand({ nextToken: clusterMarker }));
      for (const clusterName of listResponse.clusters || []) {
        try {
          const describeResponse = await client.send(new DescribeClusterCommand({ name: clusterName }));
          const cluster = describeResponse.cluster;
          if (!cluster) continue;

          workloads.push({
            workloadId: `eks-cluster-${clusterName}`,
            tenantId: 'default',
            discoveryId: 'pending',
            type: 'container',
            provider: 'aws',
            region: config.region || 'us-east-1',
            name: clusterName,
            status: cluster.status || 'unknown',
            metadata: {
              clusterArn: cluster.arn,
              clusterName: cluster.name,
              version: cluster.version,
              endpoint: cluster.endpoint,
              platformVersion: cluster.platformVersion,
              roleArn: cluster.roleArn,
              resourcesVpcConfig: cluster.resourcesVpcConfig ? {
                vpcId: cluster.resourcesVpcConfig.vpcId,
                subnetIds: cluster.resourcesVpcConfig.subnetIds || [],
                securityGroupIds: cluster.resourcesVpcConfig.securityGroupIds || [],
                endpointPublicAccess: cluster.resourcesVpcConfig.endpointPublicAccess,
                endpointPrivateAccess: cluster.resourcesVpcConfig.endpointPrivateAccess,
              } : null,
              kubernetesNetworkConfig: cluster.kubernetesNetworkConfig,
              logging: cluster.logging,
            },
            dependencies: [
              ...(cluster.resourcesVpcConfig?.vpcId ? [`vpc-${cluster.resourcesVpcConfig.vpcId}`] : []),
              ...(cluster.resourcesVpcConfig?.subnetIds || []).map(s => `subnet-${s}`),
              ...(cluster.resourcesVpcConfig?.securityGroupIds || []).map(sg => `sg-${sg}`),
            ],
            discoveredAt: new Date().toISOString(),
          });
        } catch (error: any) {
          console.error(`EKS describe error for ${clusterName}:`, error.message);
        }
      }
      clusterMarker = listResponse.nextToken;
    } while (clusterMarker);
  } catch (error: any) {
    console.error('EKS discovery error:', error.message);
  }

  return workloads;
}

/**
 * IAM Discovery - Users, Roles, Policies
 */
export async function discoverIAM(config: DiscoveryConfig = {}): Promise<Workload[]> {
  const client = createClient(IAMClient, config);
  const workloads: Workload[] = [];

  try {
    // Discover IAM Users
    let userMarker: string | undefined;
    do {
      const usersResponse = await client.send(new ListUsersCommand({ Marker: userMarker }));
      for (const user of usersResponse.Users || []) {
        workloads.push({
          workloadId: `iam-user-${user.UserName}`,
          tenantId: 'default',
          discoveryId: 'pending',
          type: 'application',
          provider: 'aws',
          region: 'global', // IAM is global
          name: user.UserName || '',
          status: 'active',
          metadata: {
            userName: user.UserName,
            userId: user.UserId,
            arn: user.Arn,
            createDate: user.CreateDate?.toISOString(),
            path: user.Path,
          },
          discoveredAt: new Date().toISOString(),
        });
      }
      userMarker = usersResponse.Marker;
    } while (userMarker);

    // Discover IAM Roles
    let roleMarker: string | undefined;
    do {
      const rolesResponse = await client.send(new ListRolesCommand({ Marker: roleMarker }));
      for (const role of rolesResponse.Roles || []) {
        workloads.push({
          workloadId: `iam-role-${role.RoleName}`,
          tenantId: 'default',
          discoveryId: 'pending',
          type: 'application',
          provider: 'aws',
          region: 'global',
          name: role.RoleName || '',
          status: 'active',
          metadata: {
            roleName: role.RoleName,
            roleId: role.RoleId,
            arn: role.Arn,
            createDate: role.CreateDate?.toISOString(),
            assumeRolePolicyDocument: role.AssumeRolePolicyDocument,
            path: role.Path,
          },
          discoveredAt: new Date().toISOString(),
        });
      }
      roleMarker = rolesResponse.Marker;
    } while (roleMarker);

    // Discover IAM Policies (managed policies)
    let policyMarker: string | undefined;
    do {
      const policiesResponse = await client.send(new ListPoliciesCommand({
        Scope: 'Local',
        Marker: policyMarker,
      }));
      for (const policy of policiesResponse.Policies || []) {
        workloads.push({
          workloadId: `iam-policy-${policy.PolicyName}`,
          tenantId: 'default',
          discoveryId: 'pending',
          type: 'application',
          provider: 'aws',
          region: 'global',
          name: policy.PolicyName || '',
          status: 'active',
          metadata: {
            policyName: policy.PolicyName,
            policyId: policy.PolicyId,
            arn: policy.Arn,
            createDate: policy.CreateDate?.toISOString(),
            updateDate: policy.UpdateDate?.toISOString(),
            attachmentCount: policy.AttachmentCount,
            isAttachable: policy.IsAttachable,
            path: policy.Path,
          },
          discoveredAt: new Date().toISOString(),
        });
      }
      policyMarker = policiesResponse.Marker;
    } while (policyMarker);

  } catch (error: any) {
    console.error('IAM discovery error:', error.message);
  }

  return workloads;
}

/**
 * Route 53 Discovery - Hosted Zones
 */
export async function discoverRoute53(config: DiscoveryConfig = {}): Promise<Workload[]> {
  const client = createClient(Route53Client, config);
  const workloads: Workload[] = [];

  try {
    let marker: string | undefined;
    do {
      const response = await client.send(new ListHostedZonesCommand({ Marker: marker }));
      for (const zone of response.HostedZones || []) {
        workloads.push({
          workloadId: `route53-${zone.Id?.split('/').pop() || zone.Name}`,
          tenantId: 'default',
          discoveryId: 'pending',
          type: 'network',
          provider: 'aws',
          region: 'global',
          name: zone.Name || '',
          status: 'active',
          metadata: {
            hostedZoneId: zone.Id,
            name: zone.Name,
            callerReference: zone.CallerReference,
            resourceRecordSetCount: zone.ResourceRecordSetCount,
            config: zone.Config,
          },
          discoveredAt: new Date().toISOString(),
        });
      }
      marker = response.NextMarker;
    } while (marker);
  } catch (error: any) {
    console.error('Route 53 discovery error:', error.message);
  }

  return workloads;
}

/**
 * CloudWatch Discovery - Metrics
 */
export async function discoverCloudWatch(config: DiscoveryConfig = {}): Promise<Workload[]> {
  const client = createClient(CloudWatchClient, config);
  const workloads: Workload[] = [];

  try {
    let nextToken: string | undefined;
    do {
      const response = await client.send(new ListMetricsCommand({ NextToken: nextToken }));
      // Group metrics by namespace
      const namespaces = new Set<string>();
      for (const metric of response.Metrics || []) {
        if (metric.Namespace) {
          namespaces.add(metric.Namespace);
        }
      }

      for (const namespace of namespaces) {
        workloads.push({
          workloadId: `cloudwatch-${namespace}`,
          tenantId: 'default',
          discoveryId: 'pending',
          type: 'application',
          provider: 'aws',
          region: config.region || 'us-east-1',
          name: namespace,
          status: 'active',
          metadata: {
            namespace,
            metricCount: response.Metrics?.filter(m => m.Namespace === namespace).length || 0,
          },
          discoveredAt: new Date().toISOString(),
        });
      }

      nextToken = response.NextToken;
    } while (nextToken);
  } catch (error: any) {
    console.error('CloudWatch discovery error:', error.message);
  }

  return workloads;
}

/**
 * Secrets Manager Discovery
 */
export async function discoverSecretsManager(config: DiscoveryConfig = {}): Promise<Workload[]> {
  const client = createClient(SecretsManagerClient, config);
  const workloads: Workload[] = [];

  try {
    let nextToken: string | undefined;
    do {
      const response = await client.send(new ListSecretsCommand({ NextToken: nextToken }));
      for (const secret of response.SecretList || []) {
        workloads.push({
          workloadId: `secret-${secret.ARN?.split(':').pop() || secret.Name}`,
          tenantId: 'default',
          discoveryId: 'pending',
          type: 'application',
          provider: 'aws',
          region: config.region || 'us-east-1',
          name: secret.Name || '',
          status: secret.DeletedDate ? 'deleted' : 'active',
          metadata: {
            arn: secret.ARN,
            name: secret.Name,
            description: secret.Description,
            lastChangedDate: secret.LastChangedDate?.toISOString(),
            lastAccessedDate: secret.LastAccessedDate?.toISOString(),
            rotationEnabled: secret.RotationEnabled,
            rotationLambdaARN: secret.RotationLambdaARN,
          },
          discoveredAt: new Date().toISOString(),
        });
      }
      nextToken = response.NextToken;
    } while (nextToken);
  } catch (error: any) {
    console.error('Secrets Manager discovery error:', error.message);
  }

  return workloads;
}

/**
 * SQS Discovery
 */
export async function discoverSQS(config: DiscoveryConfig = {}): Promise<Workload[]> {
  const client = createClient(SQSClient, config);
  const workloads: Workload[] = [];

  try {
    const response = await client.send(new ListQueuesCommand({}));
    for (const queueUrl of response.QueueUrls || []) {
      const queueName = queueUrl.split('/').pop() || queueUrl;
      workloads.push({
        workloadId: `sqs-${queueName}`,
        tenantId: 'default',
        discoveryId: 'pending',
        type: 'application',
        provider: 'aws',
        region: config.region || 'us-east-1',
        name: queueName,
        status: 'active',
        metadata: {
          queueUrl,
          queueName,
        },
        discoveredAt: new Date().toISOString(),
      });
    }
  } catch (error: any) {
    console.error('SQS discovery error:', error.message);
  }

  return workloads;
}

/**
 * SNS Discovery
 */
export async function discoverSNS(config: DiscoveryConfig = {}): Promise<Workload[]> {
  const client = createClient(SNSClient, config);
  const workloads: Workload[] = [];

  try {
    let nextToken: string | undefined;
    do {
      const response = await client.send(new ListTopicsCommand({ NextToken: nextToken }));
      for (const topic of response.Topics || []) {
        const topicName = topic.TopicArn?.split(':').pop() || '';
        workloads.push({
          workloadId: `sns-${topicName}`,
          tenantId: 'default',
          discoveryId: 'pending',
          type: 'application',
          provider: 'aws',
          region: config.region || 'us-east-1',
          name: topicName,
          status: 'active',
          metadata: {
            topicArn: topic.TopicArn,
            topicName,
          },
          discoveredAt: new Date().toISOString(),
        });
      }
      nextToken = response.NextToken;
    } while (nextToken);
  } catch (error: any) {
    console.error('SNS discovery error:', error.message);
  }

  return workloads;
}

/**
 * Kinesis Discovery
 */
export async function discoverKinesis(config: DiscoveryConfig = {}): Promise<Workload[]> {
  const client = createClient(KinesisClient, config);
  const workloads: Workload[] = [];

  try {
    let hasMoreStreams = true;
    let streamNames: string[] = [];
    let exclusiveStartStreamName: string | undefined;

    while (hasMoreStreams) {
      const response = await client.send(new ListStreamsCommand({
        ExclusiveStartStreamName: exclusiveStartStreamName,
      }));

      streamNames = streamNames.concat(response.StreamNames || []);
      hasMoreStreams = response.HasMoreStreams || false;
      exclusiveStartStreamName = response.StreamNames?.[response.StreamNames.length - 1];
    }

    for (const streamName of streamNames) {
      workloads.push({
        workloadId: `kinesis-${streamName}`,
        tenantId: 'default',
        discoveryId: 'pending',
        type: 'application',
        provider: 'aws',
        region: config.region || 'us-east-1',
        name: streamName,
        status: 'active',
        metadata: {
          streamName,
        },
        discoveredAt: new Date().toISOString(),
      });
    }
  } catch (error: any) {
    console.error('Kinesis discovery error:', error.message);
  }

  return workloads;
}

/**
 * Main discovery function - orchestrates all AWS service scans
 */
export async function discover(config: DiscoveryConfig & { scope?: string } = {}): Promise<Workload[]> {
  const { scope = 'full', ...discoveryConfig } = config;
  console.log(`Starting AWS discovery (scope: ${scope})`);

  const allWorkloads: Workload[] = [];

  // Run discoveries in parallel with error isolation
  const discoveries = await Promise.allSettled([
    discoverEC2(discoveryConfig),
    discoverRDS(discoveryConfig),
    discoverS3(discoveryConfig),
    discoverLambda(discoveryConfig),
    discoverVPC(discoveryConfig),
    discoverELB(discoveryConfig),
    discoverDynamoDB(discoveryConfig),
    discoverECS(discoveryConfig),
    discoverEKS(discoveryConfig),
    discoverIAM(discoveryConfig),
    discoverRoute53(discoveryConfig),
    discoverCloudWatch(discoveryConfig),
    discoverSecretsManager(discoveryConfig),
    discoverSQS(discoveryConfig),
    discoverSNS(discoveryConfig),
    discoverKinesis(discoveryConfig),
  ]);

  const serviceNames = [
    'EC2', 'RDS', 'S3', 'Lambda', 'VPC', 'ELB', 'DynamoDB',
    'ECS', 'EKS', 'IAM', 'Route53', 'CloudWatch', 'SecretsManager',
    'SQS', 'SNS', 'Kinesis',
  ];

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

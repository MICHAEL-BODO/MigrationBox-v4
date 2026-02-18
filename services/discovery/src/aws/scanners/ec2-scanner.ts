
import {
  EC2Client,
  DescribeInstancesCommand,
  DescribeImagesCommand,
  DescribeSnapshotsCommand,
} from '@aws-sdk/client-ec2';
import { Workload } from '@migrationbox/types';
import { AWSScanner, DiscoveryConfig } from '../types';

export class EC2Scanner implements AWSScanner {
  serviceName(): string {
    return 'EC2';
  }

  private createClient(config: DiscoveryConfig): EC2Client {
    const baseConfig: any = {
      region: config.region || process.env.AWS_DEFAULT_REGION || 'us-east-1',
    };

    if (process.env.AWS_ENDPOINT_URL) {
      baseConfig.endpoint = process.env.AWS_ENDPOINT_URL;
    }

    if (config.credentials) {
      baseConfig.credentials = config.credentials;
    }

    return new EC2Client(baseConfig);
  }

  async discover(config: DiscoveryConfig): Promise<Workload[]> {
    const client = this.createClient(config);
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
              tenantId: 'default',
              discoveryId: 'pending',
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
        Owners: ['self'],
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
}

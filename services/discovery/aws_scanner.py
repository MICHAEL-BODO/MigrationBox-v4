"""
MigrationBox V5.0 - AWS Discovery Scanner
Uses boto3 to scan EC2 instances and resources across regions.
Output: JSON format compatible with Assessment Engine.
"""

import boto3
import json
import argparse
import sys
from datetime import datetime

def scan_region(region):
    ec2 = boto3.client('ec2', region_name=region)
    instances = []
    
    try:
        response = ec2.describe_instances()
        for reservation in response['Reservations']:
            for instance in reservation['Instances']:
                instances.append({
                    "id": instance['InstanceId'],
                    "type": instance['InstanceType'],
                    "state": instance['State']['Name'],
                    "launchTime": str(instance['LaunchTime']),
                    "vpcId": instance.get('VpcId'),
                    "subnetId": instance.get('SubnetId'),
                    "privateIp": instance.get('PrivateIpAddress'),
                    "publicIp": instance.get('PublicIpAddress'),
                    "tags": {t['Key']: t['Value'] for t in instance.get('Tags', [])},
                    "region": region
                })
    except Exception as e:
        print(f"Error scanning region {region}: {e}", file=sys.stderr)
        
    return instances

def main():
    parser = argparse.ArgumentParser(description='AWS Cloud Scanner for MigrationBox')
    parser.add_argument('--regions', default='us-east-1,us-west-2,eu-west-1', help='Comma-separated regions to scan')
    parser.add_argument('--output', default='aws_discovery.json', help='Output file')
    
    args = parser.parse_args()
    
    regions = args.regions.split(',')
    all_instances = []
    
    print(f"Scanning regions: {regions}...")
    
    for region in regions:
        print(f"Scanning {region}...")
        all_instances.extend(scan_region(region))
        
    output = {
        "source": "aws",
        "scanTime": datetime.now().isoformat(),
        "resourceCount": len(all_instances),
        "resources": all_instances
    }
    
    with open(args.output, 'w') as f:
        json.dump(output, f, indent=2)
        
    print(f"Scan complete. Found {len(all_instances)} resources. Saved to {args.output}")

if __name__ == "__main__":
    main()

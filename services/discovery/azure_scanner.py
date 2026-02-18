"""
MigrationBox V5.0 - Azure Discovery Scanner
Uses Azure SDK to scan Resource Groups and VMs.
Output: JSON format compatible with Assessment Engine.
"""

import os
import json
import argparse
from datetime import datetime
from azure.identity import DefaultAzureCredential
from azure.mgmt.compute import ComputeManagementClient
from azure.mgmt.resource import ResourceManagementClient

def scan_vm(subscription_id):
    credential = DefaultAzureCredential()
    compute_client = ComputeManagementClient(credential, subscription_id)
    resource_client = ResourceManagementClient(credential, subscription_id)
    
    vms = []
    
    for vm in compute_client.virtual_machines.list_all():
        vms.append({
            "id": vm.id,
            "name": vm.name,
            "type": "Microsoft.Compute/virtualMachines",
            "location": vm.location,
            "vmSize": vm.hardware_profile.vm_size,
            "osType": vm.storage_profile.os_disk.os_type,
            "tags": vm.tags
        })
        
    return vms

def main():
    parser = argparse.ArgumentParser(description='Azure Cloud Scanner for MigrationBox')
    parser.add_argument('--subscription_id', help='Azure Subscription ID (default: uses env AZURE_SUBSCRIPTION_ID)')
    parser.add_argument('--output', default='azure_discovery.json', help='Output file')
    
    args = parser.parse_args()
    
    sub_id = args.subscription_id or os.getenv('AZURE_SUBSCRIPTION_ID')
    if not sub_id:
        print("Error: Subscription ID required (arg or env var).")
        return
        
    print(f"Scanning subscription {sub_id}...")
    vms = scan_vm(sub_id)
    
    output = {
        "source": "azure",
        "subscriptionId": sub_id,
        "scanTime": datetime.now().isoformat(),
        "resourceCount": len(vms),
        "resources": vms
    }
    
    with open(args.output, 'w') as f:
        json.dump(output, f, indent=2)
        
    print(f"Scan complete. Found {len(vms)} resources. Saved to {args.output}")

if __name__ == "__main__":
    main()

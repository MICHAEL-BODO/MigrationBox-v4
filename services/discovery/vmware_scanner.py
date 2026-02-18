"""
MigrationBox V5.0 - On-Premise Discovery Scanner (VMware)
Uses pyVmomi to connect to vCenter and extract inventory details.
Output: JSON format compatible with Assessment Engine.
"""

import ssl
import json
import os
import argparse
from pyVim.connect import SmartConnect, Disconnect
from pyVmomi import vim

def get_vm_info(vm, depth=1):
    """
    Extract relevant properties from a VirtualMachine object
    """
    max_depth = 10
    if depth > max_depth:
        return

    summary = vm.summary
    config = vm.config
    guest = vm.guest
    runtime = vm.runtime

    info = {
        "id": summary.vm._moId,
        "name": config.name,
        "uuid": config.uuid,
        "guestFullName": config.guestFullName,
        "guestId": config.guestId,
        "numCpu": config.hardware.numCPU,
        "memoryMB": config.hardware.memoryMB,
        "ipAddress": guest.ipAddress,
        "powerState": runtime.powerState,
        "bootTime": str(runtime.bootTime) if runtime.bootTime else None,
        "storage": [],
        "networks": []
    }

    # Storage details
    for device in config.hardware.device:
        if isinstance(device, vim.vm.device.VirtualDisk):
            info["storage"].append({
                "label": device.deviceInfo.label,
                "capacityKB": device.capacityInKB,
                "datastore": device.backing.datastore.name if device.backing.datastore else "Unknown"
            })

    # Network details
    for net in guest.net:
        info["networks"].append({
            "network": net.network,
            "ipConfig": net.ipConfig.ipAddress[0].ipAddress if net.ipConfig and net.ipConfig.ipAddress else "Unknown",
            "macAddress": net.macAddress
        })

    return info

def main():
    parser = argparse.ArgumentParser(description='VMware vCenter Scanner for MigrationBox')
    parser.add_argument('--host', required=True, help='vCenter Hostname/IP')
    parser.add_argument('--user', required=True, help='vCenter Username')
    parser.add_argument('--password', required=True, help='vCenter Password')
    parser.add_argument('--port', type=int, default=443, help='vCenter Port')
    parser.add_argument('--output', default='discovery_output.json', help='Output JSON file path')
    parser.add_argument('--insecure', action='store_true', help='Ignore SSL certificate errors')

    args = parser.parse_args()

    # Disable SSL warnings if insecure
    context = None
    if args.insecure:
        context = ssl.SSLContext(ssl.PROTOCOL_TLSv1_2)
        context.verify_mode = ssl.CERT_NONE

    service_instance = None
    try:
        service_instance = SmartConnect(host=args.host,
                                        user=args.user,
                                        pwd=args.password,
                                        port=args.port,
                                        sslContext=context)

        content = service_instance.RetrieveContent()
        container = content.rootFolder
        view_type = [vim.VirtualMachine]
        recursive = True
        
        container_view = content.viewManager.CreateContainerView(container, view_type, recursive)
        children = container_view.view

        vm_data = []
        print(f"Scanning {len(children)} Virtual Machines on {args.host}...")

        for child in children:
            try:
                vm_info = get_vm_info(child)
                vm_data.append(vm_info)
            except Exception as e:
                print(f"Error processing VM {child.name}: {e}")

        # Output logic
        output_data = {
            "source": "vmware",
            "host": args.host,
            "scanTime": "now", # TODO: timestamp
            "resourceCount": len(vm_data),
            "resources": vm_data
        }

        with open(args.output, 'w') as f:
            json.dump(output_data, f, indent=2)

        print(f"Scan complete. Data written to {args.output}")

    except Exception as e:
        print(f"Connection failed: {e}")
        exit(1)
    finally:
        if service_instance:
            Disconnect(service_instance)

if __name__ == "__main__":
    main()

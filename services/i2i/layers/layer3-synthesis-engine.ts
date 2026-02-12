/**
 * MigrationBox V5.0 - I2I Pipeline Layer 3: Synthesis Engine
 *
 * FLAGSHIP FEATURE
 *
 * Converts validated Intent Schema (IR) into executable Terraform IaC.
 * Uses Building Block modules for composition: IR → module selection → assembly → Terraform output.
 */

import { IntentSchema, CloudProvider } from '@migrationbox/types';

export interface SynthesisResult {
  intentId: string;
  terraformPlan: string;
  modules: SelectedModule[];
  variables: Record<string, any>;
  outputs: Record<string, any>;
  estimatedApplyTime: string;
}

export interface SelectedModule {
  name: string;
  source: string;
  version: string;
  variables: Record<string, any>;
}

export interface BuildingBlock {
  name: string;
  provider: CloudProvider;
  resourceType: string;
  terraformTemplate: string;
  variables: VariableDefinition[];
  outputs: string[];
}

interface VariableDefinition {
  name: string;
  type: string;
  default?: any;
  description: string;
  required: boolean;
}

// Building Block Registry
const BUILDING_BLOCKS: Record<string, Record<string, BuildingBlock>> = {
  aws: {
    vpc: { name: 'aws-vpc', provider: 'aws', resourceType: 'network', terraformTemplate: generateAwsVPC(), variables: [{ name: 'cidr_block', type: 'string', default: '10.0.0.0/16', description: 'VPC CIDR block', required: true }, { name: 'public_subnets', type: 'number', default: 2, description: 'Public subnet count', required: false }, { name: 'private_subnets', type: 'number', default: 2, description: 'Private subnet count', required: false }], outputs: ['vpc_id', 'public_subnet_ids', 'private_subnet_ids'] },
    rds: { name: 'aws-rds', provider: 'aws', resourceType: 'database', terraformTemplate: generateAwsRDS(), variables: [{ name: 'engine', type: 'string', default: 'postgresql', description: 'DB engine', required: true }, { name: 'instance_class', type: 'string', default: 'db.t3.medium', description: 'Instance class', required: true }, { name: 'multi_az', type: 'bool', default: false, description: 'Multi-AZ deployment', required: false }, { name: 'allocated_storage', type: 'number', default: 20, description: 'Storage in GB', required: false }], outputs: ['db_endpoint', 'db_port'] },
    s3: { name: 'aws-s3', provider: 'aws', resourceType: 'storage', terraformTemplate: generateAwsS3(), variables: [{ name: 'bucket_name', type: 'string', description: 'Bucket name', required: true }, { name: 'versioning', type: 'bool', default: true, description: 'Enable versioning', required: false }], outputs: ['bucket_arn', 'bucket_domain_name'] },
    lambda: { name: 'aws-lambda', provider: 'aws', resourceType: 'serverless', terraformTemplate: generateAwsLambda(), variables: [{ name: 'function_name', type: 'string', description: 'Function name', required: true }, { name: 'runtime', type: 'string', default: 'nodejs20.x', description: 'Runtime', required: false }, { name: 'memory_size', type: 'number', default: 512, description: 'Memory in MB', required: false }], outputs: ['function_arn', 'invoke_arn'] },
    ecs: { name: 'aws-ecs', provider: 'aws', resourceType: 'container', terraformTemplate: generateAwsECS(), variables: [{ name: 'cluster_name', type: 'string', description: 'Cluster name', required: true }, { name: 'desired_count', type: 'number', default: 2, description: 'Task count', required: false }, { name: 'launch_type', type: 'string', default: 'FARGATE', description: 'Launch type', required: false }], outputs: ['cluster_arn', 'service_name'] },
    ec2: { name: 'aws-ec2', provider: 'aws', resourceType: 'compute', terraformTemplate: generateAwsEC2(), variables: [{ name: 'instance_type', type: 'string', default: 't3.medium', description: 'Instance type', required: true }, { name: 'ami', type: 'string', description: 'AMI ID', required: true }, { name: 'count', type: 'number', default: 1, description: 'Instance count', required: false }], outputs: ['instance_ids', 'public_ips'] },
    alb: { name: 'aws-alb', provider: 'aws', resourceType: 'network', terraformTemplate: generateAwsALB(), variables: [{ name: 'name', type: 'string', description: 'ALB name', required: true }], outputs: ['alb_arn', 'alb_dns_name'] },
    dynamodb: { name: 'aws-dynamodb', provider: 'aws', resourceType: 'database', terraformTemplate: generateAwsDynamoDB(), variables: [{ name: 'table_name', type: 'string', description: 'Table name', required: true }, { name: 'hash_key', type: 'string', description: 'Hash key', required: true }, { name: 'billing_mode', type: 'string', default: 'PAY_PER_REQUEST', description: 'Billing mode', required: false }], outputs: ['table_arn', 'table_name'] },
    sqs: { name: 'aws-sqs', provider: 'aws', resourceType: 'application', terraformTemplate: generateAwsSQS(), variables: [{ name: 'queue_name', type: 'string', description: 'Queue name', required: true }], outputs: ['queue_url', 'queue_arn'] },
    cloudwatch: { name: 'aws-cloudwatch', provider: 'aws', resourceType: 'monitoring', terraformTemplate: generateAwsCloudWatch(), variables: [{ name: 'log_group_name', type: 'string', description: 'Log group', required: true }], outputs: ['log_group_arn'] },
    iam: { name: 'aws-iam', provider: 'aws', resourceType: 'security', terraformTemplate: generateAwsIAM(), variables: [{ name: 'role_name', type: 'string', description: 'IAM role name', required: true }], outputs: ['role_arn'] },
  },
  azure: {
    vnet: { name: 'azure-vnet', provider: 'azure', resourceType: 'network', terraformTemplate: 'resource "azurerm_virtual_network" "main" {\n  name = var.vnet_name\n  location = var.location\n  resource_group_name = var.resource_group_name\n  address_space = [var.address_space]\n}', variables: [{ name: 'vnet_name', type: 'string', description: 'VNet name', required: true }], outputs: ['vnet_id'] },
    sql: { name: 'azure-sql', provider: 'azure', resourceType: 'database', terraformTemplate: 'resource "azurerm_mssql_server" "main" {\n  name = var.server_name\n  resource_group_name = var.resource_group_name\n  location = var.location\n  version = "12.0"\n}', variables: [{ name: 'server_name', type: 'string', description: 'SQL server name', required: true }], outputs: ['server_id', 'fqdn'] },
    blob: { name: 'azure-blob', provider: 'azure', resourceType: 'storage', terraformTemplate: 'resource "azurerm_storage_account" "main" {\n  name = var.account_name\n  resource_group_name = var.resource_group_name\n  location = var.location\n  account_tier = "Standard"\n  account_replication_type = "LRS"\n}', variables: [{ name: 'account_name', type: 'string', description: 'Storage account', required: true }], outputs: ['primary_blob_endpoint'] },
    functions: { name: 'azure-functions', provider: 'azure', resourceType: 'serverless', terraformTemplate: 'resource "azurerm_linux_function_app" "main" {\n  name = var.function_name\n  resource_group_name = var.resource_group_name\n  location = var.location\n}', variables: [{ name: 'function_name', type: 'string', description: 'Function app name', required: true }], outputs: ['default_hostname'] },
    aks: { name: 'azure-aks', provider: 'azure', resourceType: 'container', terraformTemplate: 'resource "azurerm_kubernetes_cluster" "main" {\n  name = var.cluster_name\n  location = var.location\n  resource_group_name = var.resource_group_name\n  dns_prefix = var.dns_prefix\n}', variables: [{ name: 'cluster_name', type: 'string', description: 'AKS cluster name', required: true }], outputs: ['cluster_id', 'kube_config'] },
  },
  gcp: {
    vpc: { name: 'gcp-vpc', provider: 'gcp', resourceType: 'network', terraformTemplate: 'resource "google_compute_network" "main" {\n  name = var.network_name\n  auto_create_subnetworks = false\n  project = var.project_id\n}', variables: [{ name: 'network_name', type: 'string', description: 'VPC name', required: true }], outputs: ['network_id'] },
    cloudsql: { name: 'gcp-cloudsql', provider: 'gcp', resourceType: 'database', terraformTemplate: 'resource "google_sql_database_instance" "main" {\n  name = var.instance_name\n  database_version = var.database_version\n  region = var.region\n  project = var.project_id\n}', variables: [{ name: 'instance_name', type: 'string', description: 'Instance name', required: true }], outputs: ['connection_name', 'ip_address'] },
    gcs: { name: 'gcp-gcs', provider: 'gcp', resourceType: 'storage', terraformTemplate: 'resource "google_storage_bucket" "main" {\n  name = var.bucket_name\n  location = var.location\n  project = var.project_id\n  uniform_bucket_level_access = true\n}', variables: [{ name: 'bucket_name', type: 'string', description: 'Bucket name', required: true }], outputs: ['bucket_url'] },
    functions: { name: 'gcp-functions', provider: 'gcp', resourceType: 'serverless', terraformTemplate: 'resource "google_cloudfunctions2_function" "main" {\n  name = var.function_name\n  location = var.region\n  project = var.project_id\n}', variables: [{ name: 'function_name', type: 'string', description: 'Function name', required: true }], outputs: ['function_uri'] },
    gke: { name: 'gcp-gke', provider: 'gcp', resourceType: 'container', terraformTemplate: 'resource "google_container_cluster" "main" {\n  name = var.cluster_name\n  location = var.region\n  project = var.project_id\n  initial_node_count = var.node_count\n}', variables: [{ name: 'cluster_name', type: 'string', description: 'GKE cluster name', required: true }], outputs: ['cluster_endpoint', 'cluster_ca_certificate'] },
  },
};

export class SynthesisEngine {

  /**
   * Synthesize Terraform from Intent Schema
   */
  synthesize(schema: IntentSchema): SynthesisResult {
    const provider = schema.provider as CloudProvider;
    const modules: SelectedModule[] = [];
    const variables: Record<string, any> = {};
    const outputs: Record<string, any> = {};

    // Provider block
    let terraform = this.generateProviderBlock(provider);

    // VPC/Network (always generated)
    if (schema.networking?.vpc) {
      const vpcBlock = this.selectNetworkModule(provider, schema);
      modules.push(vpcBlock.module);
      terraform += '\n\n' + vpcBlock.terraform;
      Object.assign(variables, vpcBlock.variables);
    }

    // Resources
    for (const resource of schema.resources || []) {
      const block = this.selectResourceModule(provider, resource, schema);
      if (block) {
        modules.push(block.module);
        terraform += '\n\n' + block.terraform;
        Object.assign(variables, block.variables);
        Object.assign(outputs, block.outputs);
      }
    }

    // Security (IAM, encryption)
    if (schema.security?.iamLeastPrivilege) {
      const iamBlock = this.generateIAMBlock(provider, schema);
      terraform += '\n\n' + iamBlock;
    }

    // Variables file
    const variablesTf = this.generateVariablesFile(variables);

    // Outputs file
    const outputsTf = this.generateOutputsFile(outputs);

    return {
      intentId: schema.intentId,
      terraformPlan: terraform + '\n\n' + variablesTf + '\n\n' + outputsTf,
      modules,
      variables,
      outputs,
      estimatedApplyTime: this.estimateApplyTime(modules),
    };
  }

  private generateProviderBlock(provider: CloudProvider): string {
    const blocks: Record<string, string> = {
      aws: `terraform {
  required_version = ">= 1.5"
  required_providers {
    aws = { source = "hashicorp/aws", version = "~> 5.0" }
  }
}

provider "aws" {
  region = var.region
  default_tags {
    tags = {
      ManagedBy   = "MigrationBox"
      Environment = var.environment
    }
  }
}`,
      azure: `terraform {
  required_version = ">= 1.5"
  required_providers {
    azurerm = { source = "hashicorp/azurerm", version = "~> 3.0" }
  }
}

provider "azurerm" {
  features {}
}`,
      gcp: `terraform {
  required_version = ">= 1.5"
  required_providers {
    google = { source = "hashicorp/google", version = "~> 5.0" }
  }
}

provider "google" {
  project = var.project_id
  region  = var.region
}`,
    };
    return blocks[provider] || blocks.aws;
  }

  private selectNetworkModule(provider: CloudProvider, schema: IntentSchema): { module: SelectedModule; terraform: string; variables: Record<string, any> } {
    const blocks = BUILDING_BLOCKS[provider];
    const vpcKey = provider === 'aws' ? 'vpc' : provider === 'azure' ? 'vnet' : 'vpc';
    const block = blocks?.[vpcKey];
    if (!block) return { module: { name: 'network', source: 'local', version: '1.0.0', variables: {} }, terraform: '# Network module not available', variables: {} };

    return {
      module: { name: block.name, source: `./modules/${block.name}`, version: '1.0.0', variables: {} },
      terraform: block.terraformTemplate,
      variables: { region: 'us-east-1', environment: 'production' },
    };
  }

  private selectResourceModule(provider: CloudProvider, resource: any, schema: IntentSchema): { module: SelectedModule; terraform: string; variables: Record<string, any>; outputs: Record<string, any> } | null {
    const blocks = BUILDING_BLOCKS[provider];
    const typeMapping: Record<string, string[]> = {
      compute: ['ec2'],
      database: ['rds', 'dynamodb', 'sql', 'cloudsql'],
      storage: ['s3', 'blob', 'gcs'],
      serverless: ['lambda', 'functions'],
      container: ['ecs', 'aks', 'gke'],
      network: ['alb', 'vnet', 'vpc'],
      application: ['sqs'],
    };

    const candidates = typeMapping[resource.type] || [];
    for (const key of candidates) {
      if (blocks?.[key]) {
        const block = blocks[key];
        const vars: Record<string, any> = {};
        for (const v of block.variables) {
          vars[v.name] = resource.config?.[v.name] || v.default || `var.${v.name}`;
        }

        return {
          module: { name: block.name, source: `./modules/${block.name}`, version: '1.0.0', variables: vars },
          terraform: block.terraformTemplate,
          variables: vars,
          outputs: Object.fromEntries(block.outputs.map(o => [o, `\${module.${block.name}.${o}}`])),
        };
      }
    }
    return null;
  }

  private generateIAMBlock(provider: CloudProvider, schema: IntentSchema): string {
    if (provider === 'aws') {
      return `# IAM - Least Privilege
resource "aws_iam_role" "app_role" {
  name = "\${var.app_name}-role"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = { Service = "ec2.amazonaws.com" }
    }]
  })
}`;
    }
    return '# IAM configuration for ' + provider;
  }

  private generateVariablesFile(variables: Record<string, any>): string {
    let tf = '# Variables\n';
    for (const [key, value] of Object.entries(variables)) {
      tf += `variable "${key}" {\n  default = ${JSON.stringify(value)}\n}\n\n`;
    }
    return tf;
  }

  private generateOutputsFile(outputs: Record<string, any>): string {
    let tf = '# Outputs\n';
    for (const [key, value] of Object.entries(outputs)) {
      tf += `output "${key}" {\n  value = ${value}\n}\n\n`;
    }
    return tf;
  }

  private estimateApplyTime(modules: SelectedModule[]): string {
    const minutes = modules.length * 3 + 2;
    return `~${minutes} minutes`;
  }
}

// Template generators (abbreviated for readability)
function generateAwsVPC(): string {
  return `resource "aws_vpc" "main" {
  cidr_block           = var.cidr_block
  enable_dns_hostnames = true
  enable_dns_support   = true
  tags = { Name = "\${var.app_name}-vpc" }
}

resource "aws_subnet" "public" {
  count             = var.public_subnets
  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet(var.cidr_block, 8, count.index)
  availability_zone = data.aws_availability_zones.available.names[count.index]
  map_public_ip_on_launch = true
  tags = { Name = "\${var.app_name}-public-\${count.index}" }
}

resource "aws_subnet" "private" {
  count             = var.private_subnets
  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet(var.cidr_block, 8, count.index + var.public_subnets)
  availability_zone = data.aws_availability_zones.available.names[count.index]
  tags = { Name = "\${var.app_name}-private-\${count.index}" }
}`;
}

function generateAwsRDS(): string {
  return `resource "aws_db_instance" "main" {
  identifier           = var.db_identifier
  engine               = var.engine
  engine_version       = var.engine_version
  instance_class       = var.instance_class
  allocated_storage    = var.allocated_storage
  multi_az             = var.multi_az
  storage_encrypted    = true
  skip_final_snapshot  = false
  vpc_security_group_ids = [aws_security_group.db.id]
  db_subnet_group_name   = aws_db_subnet_group.main.name
}`;
}

function generateAwsS3(): string { return `resource "aws_s3_bucket" "main" {\n  bucket = var.bucket_name\n}\n\nresource "aws_s3_bucket_versioning" "main" {\n  bucket = aws_s3_bucket.main.id\n  versioning_configuration { status = var.versioning ? "Enabled" : "Suspended" }\n}\n\nresource "aws_s3_bucket_server_side_encryption_configuration" "main" {\n  bucket = aws_s3_bucket.main.id\n  rule { apply_server_side_encryption_by_default { sse_algorithm = "AES256" } }\n}`; }
function generateAwsLambda(): string { return `resource "aws_lambda_function" "main" {\n  function_name = var.function_name\n  runtime       = var.runtime\n  handler       = "index.handler"\n  memory_size   = var.memory_size\n  timeout       = var.timeout\n  role          = aws_iam_role.lambda.arn\n}`; }
function generateAwsECS(): string { return `resource "aws_ecs_cluster" "main" {\n  name = var.cluster_name\n}\n\nresource "aws_ecs_service" "main" {\n  name            = "\${var.cluster_name}-service"\n  cluster         = aws_ecs_cluster.main.id\n  desired_count   = var.desired_count\n  launch_type     = var.launch_type\n}`; }
function generateAwsEC2(): string { return `resource "aws_instance" "main" {\n  count         = var.count\n  ami           = var.ami\n  instance_type = var.instance_type\n  subnet_id     = var.subnet_id\n  tags = { Name = "\${var.app_name}-\${count.index}" }\n}`; }
function generateAwsALB(): string { return `resource "aws_lb" "main" {\n  name               = var.name\n  internal           = false\n  load_balancer_type = "application"\n  security_groups    = var.security_groups\n  subnets            = var.subnet_ids\n}`; }
function generateAwsDynamoDB(): string { return `resource "aws_dynamodb_table" "main" {\n  name         = var.table_name\n  billing_mode = var.billing_mode\n  hash_key     = var.hash_key\n  attribute { name = var.hash_key\n    type = "S" }\n  server_side_encryption { enabled = true }\n  point_in_time_recovery { enabled = true }\n}`; }
function generateAwsSQS(): string { return `resource "aws_sqs_queue" "main" {\n  name = var.queue_name\n  sqs_managed_sse_enabled = true\n}`; }
function generateAwsCloudWatch(): string { return `resource "aws_cloudwatch_log_group" "main" {\n  name              = var.log_group_name\n  retention_in_days = 90\n}`; }
function generateAwsIAM(): string { return `resource "aws_iam_role" "main" {\n  name = var.role_name\n}`; }

# MigrationBox V4.1 - AWS Infrastructure
# Manages resources not handled by Serverless Framework

terraform {
  required_version = ">= 1.6"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
  backend "s3" {
    bucket = "migrationbox-terraform-state"
    key    = "aws/terraform.tfstate"
    region = "us-east-1"
  }
}

provider "aws" {
  region = var.aws_region
  default_tags {
    tags = {
      Project     = "MigrationBox"
      Environment = var.environment
      ManagedBy   = "terraform"
    }
  }
}

# VPC for Lambda functions (if VPC access needed)
module "vpc" {
  source  = "terraform-aws-modules/vpc/aws"
  version = "~> 5.0"

  name = "migrationbox-${var.environment}"
  cidr = "10.0.0.0/16"

  azs             = ["${var.aws_region}a", "${var.aws_region}b", "${var.aws_region}c"]
  private_subnets = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
  public_subnets  = ["10.0.101.0/24", "10.0.102.0/24", "10.0.103.0/24"]

  enable_nat_gateway = true
  single_nat_gateway = var.environment != "production"
}

# Cognito User Pool for authentication
resource "aws_cognito_user_pool" "main" {
  name = "migrationbox-${var.environment}"

  password_policy {
    minimum_length    = 12
    require_lowercase = true
    require_numbers   = true
    require_symbols   = true
    require_uppercase = true
  }

  mfa_configuration = "ON"

  software_token_mfa_configuration {
    enabled = true
  }
}

resource "aws_cognito_user_pool_client" "web" {
  name         = "migrationbox-web-${var.environment}"
  user_pool_id = aws_cognito_user_pool.main.id

  allowed_oauth_flows  = ["code"]
  allowed_oauth_scopes = ["openid", "email", "profile"]
  callback_urls        = var.callback_urls
  logout_urls          = var.logout_urls

  generate_secret = false
}

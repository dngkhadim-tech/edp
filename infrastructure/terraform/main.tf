terraform {
  required_version = ">= 1.6.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "~> 2.0"
    }
    helm = {
      source  = "hashicorp/helm"
      version = "~> 2.0"
    }
  }

  backend "s3" {
    bucket         = "edp-terraform-state"
    key            = "production/terraform.tfstate"
    region         = "eu-west-1"
    encrypt        = true
    dynamodb_table = "edp-terraform-locks"
  }
}

provider "aws" {
  region = var.aws_region
  default_tags {
    tags = {
      Project     = "EDP"
      Environment = var.environment
      ManagedBy   = "Terraform"
    }
  }
}

# ─── VPC ──────────────────────────────────────────────────────────────────────
module "vpc" {
  source = "./modules/vpc"

  name             = "edp-${var.environment}"
  cidr             = var.vpc_cidr
  azs              = var.availability_zones
  private_subnets  = var.private_subnets
  public_subnets   = var.public_subnets
  environment      = var.environment
}

# ─── EKS ──────────────────────────────────────────────────────────────────────
module "eks" {
  source = "./modules/eks"

  cluster_name    = "edp-${var.environment}"
  cluster_version = "1.31"
  vpc_id          = module.vpc.vpc_id
  subnet_ids      = module.vpc.private_subnet_ids
  environment     = var.environment
  node_groups     = var.eks_node_groups
}

# ─── RDS PostgreSQL ────────────────────────────────────────────────────────────
module "rds" {
  source = "./modules/rds"

  identifier        = "edp-${var.environment}"
  engine_version    = "16.3"
  instance_class    = var.rds_instance_class
  allocated_storage = var.rds_storage_gb
  db_name           = "edp_db"
  db_username       = var.db_username
  db_password       = var.db_password
  vpc_id            = module.vpc.vpc_id
  subnet_ids        = module.vpc.private_subnet_ids
  allowed_sg_id     = module.eks.node_security_group_id
  environment       = var.environment
}

# ─── ElastiCache Redis ─────────────────────────────────────────────────────────
module "redis" {
  source = "./modules/redis"

  cluster_id     = "edp-${var.environment}"
  node_type      = var.redis_node_type
  vpc_id         = module.vpc.vpc_id
  subnet_ids     = module.vpc.private_subnet_ids
  allowed_sg_id  = module.eks.node_security_group_id
  environment    = var.environment
}

# ─── S3 Médias ─────────────────────────────────────────────────────────────────
module "s3" {
  source = "./modules/s3"

  bucket_name  = "edp-media-${var.environment}"
  environment  = var.environment
  allowed_origins = var.allowed_origins
}

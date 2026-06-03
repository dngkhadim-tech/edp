environment        = "production"
aws_region         = "eu-west-1"
vpc_cidr           = "10.0.0.0/16"
availability_zones = ["eu-west-1a", "eu-west-1b", "eu-west-1c"]
private_subnets    = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
public_subnets     = ["10.0.101.0/24", "10.0.102.0/24", "10.0.103.0/24"]

eks_node_groups = {
  general = {
    instance_types = ["t3.large"]
    min_size       = 3
    max_size       = 20
    desired_size   = 3
    disk_size      = 100
  }
}

rds_instance_class = "db.t3.large"
rds_storage_gb     = 100
db_username        = "edp_admin"

redis_node_type    = "cache.t3.medium"

allowed_origins = [
  "https://edp.app",
  "https://www.edp.app",
  "https://api.edp.app"
]

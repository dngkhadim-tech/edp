output "eks_cluster_name" {
  description = "EKS cluster name"
  value       = module.eks.cluster_name
}

output "eks_cluster_endpoint" {
  description = "EKS cluster API endpoint"
  value       = module.eks.cluster_endpoint
  sensitive   = true
}

output "rds_endpoint" {
  description = "RDS PostgreSQL endpoint"
  value       = module.rds.endpoint
  sensitive   = true
}

output "redis_endpoint" {
  description = "ElastiCache Redis endpoint"
  value       = module.redis.endpoint
  sensitive   = true
}

output "s3_bucket_name" {
  description = "S3 media bucket name"
  value       = module.s3.bucket_name
}

output "s3_bucket_domain" {
  description = "S3 bucket domain for CDN"
  value       = module.s3.bucket_domain
}

output "vpc_id" {
  description = "VPC ID"
  value       = module.vpc.vpc_id
}

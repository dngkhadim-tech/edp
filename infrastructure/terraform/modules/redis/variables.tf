variable "cluster_id"    { type = string }
variable "node_type"     { type = string }
variable "vpc_id"        { type = string }
variable "subnet_ids"    { type = list(string) }
variable "allowed_sg_id" { type = string }
variable "environment"   { type = string }

variable "identifier"        { type = string }
variable "engine_version"    { type = string }
variable "instance_class"    { type = string }
variable "allocated_storage" { type = number }
variable "db_name"           { type = string }
variable "db_username"       { type = string; sensitive = true }
variable "db_password"       { type = string; sensitive = true }
variable "vpc_id"            { type = string }
variable "subnet_ids"        { type = list(string) }
variable "allowed_sg_id"     { type = string }
variable "environment"       { type = string }

variable "aws_profile" {
  type        = string
  description = "AWS profile to perform TF operations"
}

variable "aws_region" {
  type        = string
  description = "AWS region"
  default     = "eu-north-1"
}

variable "project_name" {
  type        = string
  description = "Short name of the project. Will be used to prefix resources"
}
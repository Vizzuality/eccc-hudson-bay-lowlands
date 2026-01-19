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

// POSSIBLE DUPLICATE
variable "repo_name" {
  type        = string
  description = "Short name of the project. Will be used to prefix resources"
}


variable "github_owner" {
  type        = string
  description = "Owner of the Github repository where the code is hosted"
}

variable "github_token" {
  type        = string
  description = "Github token to access the repository"
}

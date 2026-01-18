terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 6.28"
    }
  }

  backend "s3" {
    bucket         = "eccc-hudson-bay-lowlands-terraform-state"
    key            = "state"
    region         = "eu-north-1"
    profile        = "aws-eccc"
    dynamodb_table = "eccc-hudson-bay-lowlands-terraform-state-lock"
  }

  required_version = "1.14.3"
}

module "state" {
  source       = "./modules/state"
  project_name = var.project_name
}

module "client_ecr" {
  source        = "./modules/ecr"
  project_name  = var.project_name
  ecr_repo_name = "client"
}

module "api_ecr" {
  source        = "./modules/ecr"
  project_name  = var.project_name
  ecr_repo_name = "api"
}

module "iam" {
  source = "./modules/iam"
}

module "vpc" {
  source     = "./modules/vpc"
  project    = var.project_name
  aws_region = var.aws_region
}

module "dev" {
  source      = "./modules/env"
  project     = var.project_name
  environment = "dev"
  domain      = "eccc.dev-vizzuality.com"

  aws_region = var.aws_region

  vpc                = module.vpc.vpc
  subnet_ids         = module.vpc.public_subnet_ids
  availability_zones = module.vpc.availability_zones

  beanstalk_platform = "64bit Amazon Linux 2023 v4.9.1 running Docker"
  beanstalk_tier     = "WebServer"
  ec2_instance_type  = "t3.micro"

  elasticbeanstalk_iam_service_linked_role_name = "AWSServiceRoleForElasticBeanstalk"
  cname_prefix                                  = "${var.project_name}-dev-environment"

  rds_instance_class = "db.t3.micro"

  # TODO: Enable when GitHub integration module is implemented
  # repo_name = "eccc-hudson-bay-lowlands"
  # github_owner        = var.github_owner
  # github_token        = var.github_token

  # TODO: Enable when basic auth is implemented in the application
  # basic_auth_enabled  = var.basic_auth_enabled
  # basic_auth_user     = var.basic_auth_user
  # basic_auth_password = var.basic_auth_password

  # TODO: Enable when GitHub integration module is implemented
  # github_additional_environment_variables = {
  #   JWT_EXPIRES_IN = "1d"
  # }
}





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

moved {
  from = aws_s3_bucket.state
  to   = module.state.aws_s3_bucket.state
}

moved {
  from = aws_s3_bucket_ownership_controls.state
  to   = module.state.aws_s3_bucket_ownership_controls.state
}

moved {
  from = aws_s3_bucket_versioning.state
  to   = module.state.aws_s3_bucket_versioning.state
}

moved {
  from = aws_s3_bucket_server_side_encryption_configuration.state
  to   = module.state.aws_s3_bucket_server_side_encryption_configuration.state
}

moved {
  from = aws_dynamodb_table.lock
  to   = module.state.aws_dynamodb_table.lock
}

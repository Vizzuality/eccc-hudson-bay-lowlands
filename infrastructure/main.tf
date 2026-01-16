terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 6.28"
    }
  }

  # backend "s3" {
  #   bucket         = "eccc-terraform-state"
  #   key            = "state"
  #   region         = "eu-north-1"
  #   profile        = "aws-eccc"
  #   dynamodb_table = "eccc-terraform-state-dynamodb"
  # }

  required_version = "1.14.3"
}

resource "aws_s3_bucket" "state" {
  bucket = "${var.project_name}-terraform-state"
}

resource "aws_s3_bucket_ownership_controls" "state" {
  bucket = aws_s3_bucket.state.id

  rule {
    object_ownership = "BucketOwnerEnforced"
  }
}

resource "aws_s3_bucket_versioning" "state" {
  bucket = aws_s3_bucket.state.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "state" {
  bucket = aws_s3_bucket.state.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_dynamodb_table" "lock" {
  name           = "${var.project_name}-terraform-state-lock"
  read_capacity  = 1
  write_capacity = 1
  hash_key       = "LockID"

  attribute {
    name = "LockID"
    type = "S"
  }

}
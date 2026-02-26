resource "random_string" "seed_secret" {
  length  = 64
  special = true
}

locals {
  api_secret_env_vars = {
    DB_HOST                             = module.postgresql.host
    DB_NAME                             = module.postgresql.db_name
    DB_PASSWORD                         = module.postgresql.password
    DB_USERNAME                         = module.postgresql.username
    DB_PORT                             = module.postgresql.port
    S3_BUCKET_NAME                     = module.s3.s3_outputs.name
    SEED_SECRET                        = random_string.seed_secret.result

  }
  api_env_vars = {
  }
}

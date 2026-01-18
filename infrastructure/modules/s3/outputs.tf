output "s3_outputs" {
  description = "S3 Bucket Outputs"
  value = {
    name = aws_s3_bucket.this.bucket
    arn  = aws_s3_bucket.this.arn
  }
}

# ECCC Hudson Bay Lowlands Infrastructure

Terraform infrastructure for the ECCC Hudson Bay Lowlands geospatial project.

## Overview

This infrastructure provides a complete AWS environment for deploying a containerized FastAPI application with PostgreSQL database support. The setup uses AWS Elastic Beanstalk for container orchestration with an Application Load Balancer for traffic distribution.

## Architecture

```
                                    +---------------------------+
                                    |        AWS Cloud          |
                                    |       (eu-north-1)        |
                                    +---------------------------+
                                                 |
                    +----------------------------+----------------------------+
                    |                            |                            |
            +-------v-------+           +--------v--------+          +--------v--------+
            |  ECR (client) |           |   ECR (api)     |          |  S3 (state)     |
            | Docker images |           | Docker images   |          | Terraform state |
            +---------------+           +-----------------+          +-----------------+
                                                 |
                    +----------------------------+----------------------------+
                    |                                                         |
                    |                    VPC (10.0.0.0/16)                    |
                    |                                                         |
                    |  +-------------------+       +-------------------+       |
                    |  |   Public Subnet A |       |   Public Subnet B |       |
                    |  |   (10.0.1.0/24)   |       |   (10.0.2.0/24)   |       |
                    |  |      AZ: a        |       |      AZ: b        |       |
                    |  +--------+----------+       +----------+--------+       |
                    |           |                             |                |
                    |           +-------------+---------------+                |
                    |                         |                                |
                    |              +----------v-----------+                    |
                    |              |  Application Load    |                    |
                    |              |  Balancer (HTTP:80)  |                    |
                    |              +----------+-----------+                    |
                    |                         |                                |
                    |              +----------v-----------+                    |
                    |              |  Elastic Beanstalk   |                    |
                    |              |  Environment (Docker)|                    |
                    |              |  EC2: t3.micro       |                    |
                    |              +----------+-----------+                    |
                    |                         |                                |
                    |              +----------v-----------+                    |
                    |              |  RDS PostgreSQL      |                    |
                    |              |  db.t3.micro         |                    |
                    |              +----------------------+                    |
                    |                                                         |
                    |  +-------------------+       +-------------------+       |
                    |  |   S3 Bucket       |       | Secrets Manager   |       |
                    |  | (app storage)     |       | (DB credentials)  |       |
                    |  +-------------------+       +-------------------+       |
                    |                                                         |
                    +---------------------------------------------------------+
                                                 |
                                    +------------v------------+
                                    |   IAM Pipeline User     |
                                    | (for GitHub Actions CI) |
                                    +-------------------------+
```

## Modules

| Module | Description |
|--------|-------------|
| `state` | S3 bucket and DynamoDB table for Terraform remote state with locking |
| `vpc` | VPC with 2 public subnets across different availability zones, internet gateway, and route tables |
| `ecr` | Elastic Container Registry repositories for Docker images (client and api) |
| `iam` | IAM pipeline user with ECR push/pull and Elastic Beanstalk permissions for CI/CD |
| `env` | Environment-specific resources (composition module for beanstalk, rds, s3) |
| `beanstalk` | Elastic Beanstalk application and environment with ALB and auto-scaling |
| `rds` | PostgreSQL RDS instance with security groups and Secrets Manager integration |
| `s3` | Application S3 bucket for file storage |

## Prerequisites

1. **Terraform**: Version 1.14.3 (exact version required)
   ```bash
   terraform version
   ```

2. **AWS CLI**: Configured with the `aws-eccc` profile
   ```bash
   aws configure --profile aws-eccc
   ```

3. **AWS Permissions**: The profile must have permissions to create:
   - VPC and networking resources
   - Elastic Beanstalk applications and environments
   - RDS instances
   - S3 buckets
   - ECR repositories
   - IAM users and policies
   - Secrets Manager secrets
   - DynamoDB tables

## Usage

All commands must be run from the `infrastructure/` directory.

### Initialize

Required on first run or after provider/backend changes:

```bash
terraform init -var-file=vars/terraform.tfvars
```

### Preview Changes

```bash
terraform plan -var-file=vars/terraform.tfvars
```

### Apply Changes

```bash
terraform apply -var-file=vars/terraform.tfvars
```

### Format Code

```bash
terraform fmt -recursive
```

### Validate Configuration

```bash
terraform validate
```

## Configuration

### Variables File

Create or edit `vars/terraform.tfvars`:

```hcl
project_name = "eccc-hudson-bay-lowlands"
aws_profile  = "aws-eccc"
aws_region   = "eu-north-1"
```

### Environment Variables

The following variables are configured per environment in `main.tf`:

| Variable | Description | Default |
|----------|-------------|---------|
| `beanstalk_platform` | Docker platform version | `64bit Amazon Linux 2023 v4.5.0 running Docker` |
| `beanstalk_tier` | Beanstalk environment tier | `WebServer` |
| `ec2_instance_type` | EC2 instance size | `t3.micro` |
| `rds_instance_class` | RDS instance size | `db.t3.micro` |
| `cname_prefix` | EBS URL prefix | `{project}-{env}-environment` |

## Outputs

After applying, the following outputs are available:

| Output | Description |
|--------|-------------|
| `beanstalk_environment_cname` | The auto-generated Elastic Beanstalk URL (`*.elasticbeanstalk.com`) |
| `beanstalk_environment_settings` | Environment configuration settings |

Access the application at the CNAME URL shown in outputs.

## Current Limitations

### HTTP Only (No HTTPS)

The current configuration uses HTTP only with the auto-generated `*.elasticbeanstalk.com` domain. To enable HTTPS, you would need to:

1. Register a custom domain
2. Create an ACM certificate
3. Configure DNS validation
4. Re-enable the HTTPS listener in the beanstalk module

### Features Not Yet Implemented

The following features are prepared but commented out for future implementation:

- **GitHub Integration Module**: Automatic GitHub Actions secrets/variables configuration
- **Email Module**: SES email configuration for contact forms
- **Basic Authentication**: HTTP basic auth for staging environments

To enable these features, uncomment the relevant sections in:
- `infrastructure/main.tf` (module parameters)
- `infrastructure/modules/env/variables.tf` (variable definitions)
- `infrastructure/modules/env/main.tf` (module calls)

## Security Considerations

- RDS credentials are stored in AWS Secrets Manager
- S3 buckets block public access by default
- Security groups restrict database access to VPC CIDR only
- ECR images are encrypted at rest
- Terraform state is encrypted with AES256 in S3

## State Management

Remote state is stored in:
- **S3 Bucket**: `eccc-hudson-bay-lowlands-terraform-state`
- **DynamoDB Lock Table**: `eccc-hudson-bay-lowlands-terraform-state-lock`

This enables team collaboration with state locking to prevent concurrent modifications.

## Troubleshooting

### Common Issues

1. **"Error: No valid credential sources found"**
   - Ensure the `aws-eccc` profile is configured: `aws configure --profile aws-eccc`

2. **"Error acquiring the state lock"**
   - Another Terraform operation may be in progress
   - Check DynamoDB for stale locks if the previous operation crashed

3. **"Error: Invalid availability zone"**
   - Ensure the AWS region supports the availability zones (a, b) being used

4. **Beanstalk environment creation timeout**
   - Environment creation can take 15-20 minutes
   - Check the AWS Console for detailed status

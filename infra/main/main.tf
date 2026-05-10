terraform {
  required_version = ">= 1.8"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.70"
    }
  }
}

provider "aws" {
  region = "us-west-2"
  default_tags {
    tags = {
      Project   = "fasterpack"
      Component = "website"
      ManagedBy = "opentofu"
    }
  }
}

# ACM certs attached to CloudFront distributions must live in us-east-1.
provider "aws" {
  alias  = "us_east_1"
  region = "us-east-1"
  default_tags {
    tags = {
      Project   = "fasterpack"
      Component = "website"
      ManagedBy = "opentofu"
    }
  }
}

data "aws_caller_identity" "current" {}

locals {
  apex_domain = var.domain
  www_domain  = "www.${var.domain}"
  san_domains = [local.www_domain]
}

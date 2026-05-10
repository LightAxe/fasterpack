# Reuses the existing axpr OpenTofu state backend (different state key).
terraform {
  backend "s3" {
    bucket         = "axpr-tofu-state"
    key            = "fasterpack/main/terraform.tfstate"
    region         = "us-west-2"
    dynamodb_table = "axpr-tofu-lock"
    encrypt        = true
  }
}

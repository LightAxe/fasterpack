variable "domain" {
  type    = string
  default = "fasterpack.net"
}

variable "site_bucket_name" {
  type    = string
  default = "fasterpack-site"
}

variable "price_class" {
  type    = string
  default = "PriceClass_100"
}

variable "github_repo" {
  type    = string
  default = "LightAxe/fasterpack"
}

variable "github_deploy_environment" {
  type    = string
  default = "production"
}

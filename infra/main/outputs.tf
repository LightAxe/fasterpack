output "route53_nameservers" {
  description = "Set these as custom nameservers at Squarespace."
  value       = aws_route53_zone.primary.name_servers
}

output "github_deploy_role_arn" {
  description = "Set as repo variable AWS_DEPLOY_ROLE_ARN."
  value       = aws_iam_role.github_deploy.arn
}

output "site_bucket_name" {
  description = "Set as repo variable SITE_BUCKET_NAME."
  value       = aws_s3_bucket.site.id
}

output "cloudfront_distribution_id" {
  description = "Set as repo variable CLOUDFRONT_DISTRIBUTION_ID."
  value       = aws_cloudfront_distribution.site.id
}

output "cloudfront_domain_name" {
  description = "CloudFront domain — useful for sanity checks before DNS cutover."
  value       = aws_cloudfront_distribution.site.domain_name
}

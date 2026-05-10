# Cert for fasterpack.net + www.fasterpack.net. Lives in us-east-1 because
# CloudFront only accepts certs from that region.
resource "aws_acm_certificate" "site" {
  provider                  = aws.us_east_1
  domain_name               = local.apex_domain
  subject_alternative_names = local.san_domains
  validation_method         = "DNS"

  lifecycle {
    create_before_destroy = true
  }
}

# for_each on a static set so OpenTofu can plan without knowing the cert's
# validation options at plan time. The actual record values are looked up
# from the cert at apply time.
resource "aws_route53_record" "acm_validation" {
  for_each = toset(concat([local.apex_domain], local.san_domains))

  zone_id = aws_route53_zone.primary.zone_id
  name = one([
    for dvo in aws_acm_certificate.site.domain_validation_options :
    dvo.resource_record_name if dvo.domain_name == each.value
  ])
  type = one([
    for dvo in aws_acm_certificate.site.domain_validation_options :
    dvo.resource_record_type if dvo.domain_name == each.value
  ])
  records = [
    one([
      for dvo in aws_acm_certificate.site.domain_validation_options :
      dvo.resource_record_value if dvo.domain_name == each.value
    ])
  ]
  ttl             = 60
  allow_overwrite = true
}

resource "aws_acm_certificate_validation" "site" {
  provider                = aws.us_east_1
  certificate_arn         = aws_acm_certificate.site.arn
  validation_record_fqdns = [for r in aws_route53_record.acm_validation : r.fqdn]

  # ACM's DNS polling is unpredictable — apex validation hit the default 30m
  # window once even with records correctly resolvable from public DNS.
  timeouts {
    create = "75m"
  }
}

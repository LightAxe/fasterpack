resource "aws_route53_zone" "primary" {
  name = local.apex_domain
}

# CAA: only Amazon ACM may issue certs for this zone; iodef contact for abuse.
resource "aws_route53_record" "caa" {
  zone_id = aws_route53_zone.primary.zone_id
  name    = local.apex_domain
  type    = "CAA"
  ttl     = 3600
  records = [
    "0 issue \"amazon.com\"",
    "0 issuewild \"amazon.com\"",
    "0 iodef \"mailto:rob@axpr.net\"",
  ]
}

# Domain ownership proof for Google Search Console. Google polls this until
# verified, then keeps polling occasionally — don't remove without first
# removing the property from Search Console.
resource "aws_route53_record" "apex_txt_verifications" {
  zone_id = aws_route53_zone.primary.zone_id
  name    = local.apex_domain
  type    = "TXT"
  ttl     = 3600
  records = [
    "google-site-verification=rEkv0hx0n28o8gLiG45EOvGfrpI3DS39KDA8_2qcYXY",
  ]
}

resource "aws_route53_record" "apex_a" {
  zone_id = aws_route53_zone.primary.zone_id
  name    = local.apex_domain
  type    = "A"
  alias {
    name                   = aws_cloudfront_distribution.site.domain_name
    zone_id                = aws_cloudfront_distribution.site.hosted_zone_id
    evaluate_target_health = false
  }
}

resource "aws_route53_record" "apex_aaaa" {
  zone_id = aws_route53_zone.primary.zone_id
  name    = local.apex_domain
  type    = "AAAA"
  alias {
    name                   = aws_cloudfront_distribution.site.domain_name
    zone_id                = aws_cloudfront_distribution.site.hosted_zone_id
    evaluate_target_health = false
  }
}

resource "aws_route53_record" "www_a" {
  zone_id = aws_route53_zone.primary.zone_id
  name    = local.www_domain
  type    = "A"
  alias {
    name                   = aws_cloudfront_distribution.site.domain_name
    zone_id                = aws_cloudfront_distribution.site.hosted_zone_id
    evaluate_target_health = false
  }
}

resource "aws_route53_record" "www_aaaa" {
  zone_id = aws_route53_zone.primary.zone_id
  name    = local.www_domain
  type    = "AAAA"
  alias {
    name                   = aws_cloudfront_distribution.site.domain_name
    zone_id                = aws_cloudfront_distribution.site.hosted_zone_id
    evaluate_target_health = false
  }
}

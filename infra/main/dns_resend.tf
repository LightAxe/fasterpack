# DNS records to verify fasterpack.net as a sending domain in Resend.
# Resend's SMTP backend is AWS SES, so the MX + SPF target SES bounce-handling
# infrastructure rather than Resend's own servers.

variable "resend_dkim_value" {
  description = "The full DKIM TXT value from Resend (starts p=MIGfMA..., ends ...QIDAQAB)."
  type        = string
  sensitive   = false
}

resource "aws_route53_record" "resend_dkim" {
  zone_id = aws_route53_zone.primary.zone_id
  name    = "resend._domainkey.${local.apex_domain}"
  type    = "TXT"
  ttl     = 300
  records = [var.resend_dkim_value]
}

# Bounce-handling subdomain. Resend points outbound emails' Return-Path here
# so SES can route bounces back to the right account.
resource "aws_route53_record" "resend_send_mx" {
  zone_id = aws_route53_zone.primary.zone_id
  name    = "send.${local.apex_domain}"
  type    = "MX"
  ttl     = 300
  records = ["10 feedback-smtp.us-east-1.amazonses.com"]
}

resource "aws_route53_record" "resend_send_spf" {
  zone_id = aws_route53_zone.primary.zone_id
  name    = "send.${local.apex_domain}"
  type    = "TXT"
  ttl     = 300
  records = ["v=spf1 include:amazonses.com ~all"]
}

# DMARC at p=none observes alignment without rejecting mail. Safe starting
# posture — tighten to quarantine/reject after deliverability is proven.
resource "aws_route53_record" "resend_dmarc" {
  zone_id = aws_route53_zone.primary.zone_id
  name    = "_dmarc.${local.apex_domain}"
  type    = "TXT"
  ttl     = 300
  records = ["v=DMARC1; p=none;"]
}

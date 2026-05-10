# The GitHub OIDC provider is account-wide and owned by the subterrans
# Terraform stack. We consume it via data source so only one stack manages
# its lifecycle (and tags).
data "aws_iam_openid_connect_provider" "github" {
  url = "https://token.actions.githubusercontent.com"
}

# Trust policy matches on the GitHub Actions environment claim, not the
# branch ref. Using `environment: production` in the workflow flips the sub
# claim format from repo:OWNER/REPO:ref:refs/heads/main to
# repo:OWNER/REPO:environment:production.
data "aws_iam_policy_document" "github_trust" {
  statement {
    effect  = "Allow"
    actions = ["sts:AssumeRoleWithWebIdentity"]

    principals {
      type        = "Federated"
      identifiers = [data.aws_iam_openid_connect_provider.github.arn]
    }

    condition {
      test     = "StringEquals"
      variable = "token.actions.githubusercontent.com:aud"
      values   = ["sts.amazonaws.com"]
    }

    condition {
      test     = "StringEquals"
      variable = "token.actions.githubusercontent.com:sub"
      values   = ["repo:${var.github_repo}:environment:${var.github_deploy_environment}"]
    }
  }
}

resource "aws_iam_role" "github_deploy" {
  name               = "fasterpack-github-deploy"
  assume_role_policy = data.aws_iam_policy_document.github_trust.json
  description        = "Assumed by GitHub Actions to sync site artifacts + invalidate CloudFront"
}

# Tightly scoped: read/write only this site bucket, invalidate only this
# distribution. No CloudFront config mutation, no IAM.
data "aws_iam_policy_document" "github_deploy" {
  statement {
    sid       = "SyncSiteBucket"
    effect    = "Allow"
    actions   = ["s3:ListBucket", "s3:GetBucketLocation"]
    resources = [aws_s3_bucket.site.arn]
  }

  statement {
    sid       = "WriteSiteObjects"
    effect    = "Allow"
    actions   = ["s3:GetObject", "s3:PutObject", "s3:DeleteObject"]
    resources = ["${aws_s3_bucket.site.arn}/*"]
  }

  statement {
    sid       = "InvalidateDistribution"
    effect    = "Allow"
    actions   = ["cloudfront:CreateInvalidation"]
    resources = [aws_cloudfront_distribution.site.arn]
  }
}

resource "aws_iam_role_policy" "github_deploy" {
  name   = "fasterpack-github-deploy"
  role   = aws_iam_role.github_deploy.id
  policy = data.aws_iam_policy_document.github_deploy.json
}

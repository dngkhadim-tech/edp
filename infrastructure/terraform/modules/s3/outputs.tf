output "bucket_name"   { value = aws_s3_bucket.media.bucket }
output "bucket_domain" { value = aws_cloudfront_distribution.media.domain_name }
output "bucket_arn"    { value = aws_s3_bucket.media.arn }

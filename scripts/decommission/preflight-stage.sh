#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
# shellcheck source=./common.sh
source "$SCRIPT_DIR/common.sh"

require_cmd aws

STAGE="${1:-}"
[[ -n "$STAGE" ]] || fail "Usage: $0 <stage>"

auction_stack="$(stack_name "auction-service" "$STAGE")"
auth_stack="$(stack_name "auth-service" "$STAGE")"
notification_stack="$(stack_name "notification-service" "$STAGE")"

print_header "Stack presence"
for stack in "$auction_stack" "$auth_stack" "$notification_stack"; do
  if stack_exists "$stack"; then
    status="$(aws_cli cloudformation describe-stacks --stack-name "$stack" --query 'Stacks[0].StackStatus' --output text)"
    printf '%-28s %s\n' "$stack" "$status"
  else
    printf '%-28s missing\n' "$stack"
  fi
done

if stack_exists "$auction_stack"; then
  table_name="$(stack_resource_id "$auction_stack" "AuctionsTable")"
  bucket_name="$(stack_resource_id "$auction_stack" "AuctionsBucket")"
  rule_name="$(stack_resource_id "$auction_stack" "ProcessAuctionsEventsRuleSchedule1")"
  deployment_bucket="$(stack_output_value "$auction_stack" "ServerlessDeploymentBucketName")"

  print_header "Auction data resources"
  printf 'DynamoDB table: %s\n' "$table_name"
  aws_cli dynamodb describe-table \
    --table-name "$table_name" \
    --query 'Table.{Status:TableStatus,ItemCount:ItemCount,BillingMode:BillingModeSummary.BillingMode,Arn:TableArn}' \
    --output table

  printf '\nS3 bucket: %s\n' "$bucket_name"
  aws_cli s3api get-bucket-versioning --bucket "$bucket_name" --output table || true
  aws_cli s3api list-objects-v2 \
    --bucket "$bucket_name" \
    --max-keys 5 \
    --query '{KeyCount:KeyCount,SampleKeys:Contents[].Key}' \
    --output table || true

  if [[ -n "$rule_name" && "$rule_name" != "None" ]]; then
    printf '\nEventBridge rule: %s\n' "$rule_name"
    aws_cli events describe-rule --name "$rule_name" --output table
  fi

  if [[ -n "$deployment_bucket" && "$deployment_bucket" != "None" ]]; then
    printf '\nServerless deployment bucket: %s\n' "$deployment_bucket"
  fi
fi

if stack_exists "$notification_stack"; then
  queue_url="$(stack_resource_id "$notification_stack" "MailQueue")"
  deployment_bucket="$(stack_output_value "$notification_stack" "ServerlessDeploymentBucketName")"

  print_header "Notification resources"
  printf 'SQS queue: %s\n' "$queue_url"
  aws_cli sqs get-queue-attributes \
    --queue-url "$queue_url" \
    --attribute-names ApproximateNumberOfMessages ApproximateNumberOfMessagesNotVisible VisibilityTimeout QueueArn \
    --output table

  if [[ -n "$deployment_bucket" && "$deployment_bucket" != "None" ]]; then
    printf '\nServerless deployment bucket: %s\n' "$deployment_bucket"
  fi
fi

print_header "CloudWatch log groups for stage $STAGE"
aws_cli logs describe-log-groups \
  --log-group-name-prefix /aws/lambda/ \
  --query "logGroups[?contains(logGroupName, '${STAGE}')].[logGroupName,retentionInDays,storedBytes]" \
  --output table

print_header "API Gateway custom domains"
aws_cli apigateway get-domain-names --query 'items[].domainName' --output table || true

print_header "SES identities"
aws_cli ses list-identities --query 'Identities' --output table || true

#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
# shellcheck source=./common.sh
source "$SCRIPT_DIR/common.sh"

require_cmd aws

STAGE="${1:-}"
CONFIRM="${2:-}"
[[ -n "$STAGE" ]] || fail "Usage: $0 <stage> --yes"
[[ "$CONFIRM" == "--yes" ]] || fail "Refusing to delete without explicit confirmation: pass --yes"

auction_stack="$(stack_name "auction-service" "$STAGE")"
auth_stack="$(stack_name "auth-service" "$STAGE")"
notification_stack="$(stack_name "notification-service" "$STAGE")"

print_header "Stage removal plan"
printf 'Region: %s\n' "$REGION"
printf 'Stage: %s\n' "$STAGE"
printf 'Delete order: %s -> %s + %s\n' "$auction_stack" "$auth_stack" "$notification_stack"

if stack_exists "$auction_stack"; then
  rule_name="$(stack_resource_id "$auction_stack" "ProcessAuctionsEventsRuleSchedule1")"
  bucket_name="$(stack_resource_id "$auction_stack" "AuctionsBucket")"

  if [[ -n "$rule_name" && "$rule_name" != "None" ]]; then
    print_header "Disabling EventBridge rule"
    aws_cli events disable-rule --name "$rule_name"
  fi

  if [[ -n "$bucket_name" && "$bucket_name" != "None" ]]; then
    print_header "Emptying S3 bucket"
    aws_cli s3 rm "s3://$bucket_name" --recursive || true
  fi
fi

if stack_exists "$notification_stack"; then
  queue_url="$(stack_resource_id "$notification_stack" "MailQueue")"
  if [[ -n "$queue_url" && "$queue_url" != "None" ]]; then
    print_header "Purging SQS queue"
    aws_cli sqs purge-queue --queue-url "$queue_url" || true
  fi
fi

SLS_CMD="$(serverless_cmd)"

remove_service() {
  local service_dir="$1"
  local stack="$2"

  if ! stack_exists "$stack"; then
    printf 'Skipping %s, stack not found.\n' "$stack"
    return 0
  fi

  print_header "Removing $stack"
  (
    cd "$ROOT_DIR/$service_dir"
    bash -lc "$SLS_CMD remove --stage '$STAGE' --region '$REGION'"
  )

  wait_for_stack_deletion "$stack"
  printf 'Deleted %s\n' "$stack"
}

remove_service "auction-service" "$auction_stack"
remove_service "auth-service" "$auth_stack"
remove_service "notification-service" "$notification_stack"

print_header "Post-delete verification"
"$SCRIPT_DIR/inventory.sh"

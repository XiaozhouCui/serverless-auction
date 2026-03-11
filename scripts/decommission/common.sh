#!/usr/bin/env bash

set -euo pipefail

REGION="${AWS_REGION:-${AWS_DEFAULT_REGION:-ap-southeast-2}}"
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

STACK_PREFIXES=("auction-service" "auth-service" "notification-service")

print_header() {
  printf '\n== %s ==\n' "$1"
}

fail() {
  printf 'Error: %s\n' "$1" >&2
  exit 1
}

require_cmd() {
  command -v "$1" >/dev/null 2>&1 || fail "Missing required command: $1"
}

aws_cli() {
  AWS_PAGER="" aws --no-cli-pager --region "$REGION" "$@"
}

stack_name() {
  local service="$1"
  local stage="$2"

  printf '%s-%s\n' "$service" "$stage"
}

stack_exists() {
  local stack="$1"

  aws_cli cloudformation describe-stacks --stack-name "$stack" >/dev/null 2>&1
}

stack_resource_id() {
  local stack="$1"
  local logical_id="$2"

  aws_cli cloudformation list-stack-resources \
    --stack-name "$stack" \
    --query "StackResourceSummaries[?LogicalResourceId==\`${logical_id}\`].PhysicalResourceId | [0]" \
    --output text
}

stack_output_value() {
  local stack="$1"
  local output_key="$2"

  aws_cli cloudformation describe-stacks \
    --stack-name "$stack" \
    --query "Stacks[0].Outputs[?OutputKey==\`${output_key}\`].OutputValue | [0]" \
    --output text
}

find_stages() {
  local rows
  rows="$(aws_cli cloudformation list-stacks \
    --stack-status-filter CREATE_COMPLETE UPDATE_COMPLETE UPDATE_ROLLBACK_COMPLETE \
    --query "StackSummaries[?starts_with(StackName, 'auction-service-') || starts_with(StackName, 'auth-service-') || starts_with(StackName, 'notification-service-')].[StackName]" \
    --output text)"

  if [[ -z "$rows" || "$rows" == "None" ]]; then
    return 0
  fi

  while IFS=$'\t' read -r stack; do
    [[ -n "$stack" ]] || continue
    case "$stack" in
      auction-service-*) printf '%s\n' "${stack#auction-service-}" ;;
      auth-service-*) printf '%s\n' "${stack#auth-service-}" ;;
      notification-service-*) printf '%s\n' "${stack#notification-service-}" ;;
    esac
  done <<< "$rows" | sort -u
}

serverless_cmd() {
  if [[ -x ./node_modules/.bin/serverless ]]; then
    printf './node_modules/.bin/serverless\n'
    return 0
  fi

  if command -v serverless >/dev/null 2>&1; then
    printf 'serverless\n'
    return 0
  fi

  if command -v npx >/dev/null 2>&1; then
    printf 'npx -y serverless@2.72.4\n'
    return 0
  fi

  fail "Missing required command: serverless (or npx)"
}

wait_for_stack_deletion() {
  local stack="$1"
  local attempts=0

  while stack_exists "$stack"; do
    attempts=$((attempts + 1))
    if (( attempts > 60 )); then
      fail "Timed out waiting for stack deletion: $stack"
    fi
    sleep 10
  done
}

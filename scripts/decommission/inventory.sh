#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
# shellcheck source=./common.sh
source "$SCRIPT_DIR/common.sh"

require_cmd aws

print_header "Deployed stages in $REGION"

stages=()
while IFS= read -r stage; do
  [[ -n "$stage" ]] || continue
  stages+=("$stage")
done < <(find_stages)

if (( ${#stages[@]} == 0 )); then
  printf 'No matching stacks found.\n'
  exit 0
fi

for stage in "${stages[@]}"; do
  printf 'Stage: %s\n' "$stage"
  for service in "${STACK_PREFIXES[@]}"; do
    stack="$(stack_name "$service" "$stage")"
    if stack_exists "$stack"; then
      status="$(aws_cli cloudformation describe-stacks --stack-name "$stack" --query 'Stacks[0].StackStatus' --output text)"
      updated="$(aws_cli cloudformation describe-stacks --stack-name "$stack" --query 'Stacks[0].LastUpdatedTime' --output text 2>/dev/null || true)"
      printf '  %-24s %s' "$stack" "$status"
      if [[ -n "$updated" && "$updated" != "None" ]]; then
        printf '  updated=%s' "$updated"
      fi
      printf '\n'
    else
      printf '  %-24s missing\n' "$stack"
    fi
  done
  printf '\n'
done

print_header "CloudFormation exports"
aws_cli cloudformation list-exports \
  --query "Exports[?starts_with(Name, 'MailQueue-')].[Name,Value]" \
  --output table

# Decommission Runbook

This repository contains a legacy auction application that deploys three Serverless Framework stacks in AWS and depends on Netlify and Auth0 outside AWS. The scripts in `scripts/decommission` are intended to make retirement repeatable without hard-coding a single stage.

## Scope

- Stack families:
  - `auction-service-<stage>`
  - `auth-service-<stage>`
  - `notification-service-<stage>`

## Prerequisites

- AWS CLI is authenticated for the target account.
- Install each service's npm dependencies before teardown so the declared plugins are available.
- If you are using Node.js 18, install with `--ignore-scripts` to avoid the legacy `node-sass` native build path that fails on modern environments:
  - `cd auction-service && npm install --ignore-scripts`
  - `cd auth-service && npm install --ignore-scripts`
  - `cd notification-service && npm install --ignore-scripts`
- If you want a historically faithful full install for development instead of teardown, use Node.js 14 with `npm install`.
- A global `serverless` install is optional. The scripts prefer a local `node_modules/.bin/serverless`, then a global `serverless`, then `npx serverless@2.72.4`.
- Run all commands from the repository root.
- Treat deletion as irreversible. This runbook assumes no data retention.

## Order of operations

1. Inventory every deployed stage.
2. Run preflight checks for one stage.
3. Retire the frontend entry point so users stop creating traffic.
4. Remove `auction-service-<stage>` first.
5. Remove `auth-service-<stage>` and `notification-service-<stage>` after the auction stack is gone.
6. Verify residual AWS resources are gone.
7. Remove Netlify/Auth0 configuration.

The ordering matters because `auction-service` references the auth Lambda authorizer and imports notification stack outputs.

## Commands

Inventory all discovered stages:

```bash
./scripts/decommission/inventory.sh
```

Run preflight checks for a stage:

```bash
./scripts/decommission/preflight-stage.sh dev
```

Remove one stage after explicit confirmation:

```bash
./scripts/decommission/remove-stage.sh dev --yes
```

## What the scripts do

### inventory.sh

- Lists every matching stack in `ap-southeast-2`.
- Groups stacks by stage suffix.
- Shows CloudFormation exports related to the notification queue.

### preflight-stage.sh

- Confirms whether the three service stacks exist for the chosen stage.
- Shows DynamoDB table status and item count.
- Shows S3 bucket versioning state and a sample of objects.
- Shows EventBridge rule details for `processAuctions`.
- Shows SQS queue depth.
- Lists CloudWatch log groups for the stage.
- Lists API Gateway custom domains and SES identities for manual review.

### remove-stage.sh

- Requires `--yes` before it will delete anything.
- Disables the scheduled EventBridge rule if the auction stack still exists.
- Empties the auction S3 bucket before stack deletion.
- Purges the notification SQS queue before stack deletion.
- Runs `serverless remove` in dependency-safe order, preferring the service-local CLI and plugins.
- Waits for each CloudFormation stack to disappear.
- Runs the inventory script again for verification.

## Manual steps outside AWS stack deletion

- Delete the Netlify site that serves the frontend.
- Remove Netlify environment variables and deployment hooks if they still exist.
- Delete the Auth0 application and related configuration used by the frontend and auth service.
- Remove any SES verified identities that were only used by this application.
- Remove any Route53 records or API Gateway custom domains if present.

## Residual-risk checks

- If the S3 bucket has versioning enabled unexpectedly, emptying current objects is not sufficient. Delete object versions before retrying stack removal.
- Do not use `serverless plugin install` from the repository root. This repo contains three separate Serverless services, so plugin resolution should come from `npm install` inside each service directory.
- If a stack enters `DELETE_FAILED`, inspect the remaining resource and rerun the removal only after the blocker is cleared.

# Auctions app - Serverless

## Introduction

This auction app is a collection of API endpoints built with Serverless framework and AWS CloudFormation. Sellers can create an auction and upload pictures. A new auction will remain open for 24 hours, within this time, bidders can place bids by adding price. Once an auction is closed, emails will be sent to the seller and the winning bidder. A scheduled function is running periodically to check and close any ended auctions.

## Technologies Used:

- AWS-SDK for Node.js
- AWS CloudFormation - Infrastructure as Code (YAML)
- AWS Lambda Functions - serverless
- AWS API Gateway - create endpoints
- AWS DynamoDB - persist auction data
- AWS SQS and SES - send emails
- AWS S3 Bucket - store picture
- Auth0 - authentication
- React - Simple Frontend UI

## API endpoints:

- POST - https://0egzmyshc8.execute-api.ap-southeast-2.amazonaws.com/dev/auction
- GET - https://0egzmyshc8.execute-api.ap-southeast-2.amazonaws.com/dev/auctions
- GET - https://0egzmyshc8.execute-api.ap-southeast-2.amazonaws.com/dev/auction/{id}
- PATCH - https://0egzmyshc8.execute-api.ap-southeast-2.amazonaws.com/dev/auction/{id}/bid
- PATCH - https://0egzmyshc8.execute-api.ap-southeast-2.amazonaws.com/dev/auction/{id}/picture

## Frontend UI

[https://nifty-mclean-1342b9.netlify.app](https://nifty-mclean-1342b9.netlify.app)

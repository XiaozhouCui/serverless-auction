import AWS from "aws-sdk";
import validator from "@middy/validator";
import createError from "http-errors";
import { getAuctionById } from "./getAuction";
import commonMiddleware from "../lib/commonMiddleware";
import placeBidSchema from "../lib/schemas/placeBidSchema";

const dynamodb = new AWS.DynamoDB.DocumentClient();

async function placeBid(event, context) {
  const { id } = event.pathParameters;
  const { amount } = event.body; // event.body is already parsed by middy
  const { email } = event.requestContext.authorizer; // current user's email from auth-service lambda

  const auction = await getAuctionById(id);

  // validation: seller cannot bid
  if (email === auction.seller) {
    throw new createError.Forbidden(`You cannot bid your own auctions!`);
  }

  // validation: bidder cannot double bid
  if (email === auction.highestBid.bidder) {
    throw new createError.Forbidden(`You are already the highest bidder!`);
  }

  // validation: new bid is only available for OPEN auctions
  if (auction.status !== "OPEN") {
    throw new createError.Forbidden(`You cannot bid on closed auctions!`);
  }

  // validation: new bid must be higher than the current bid
  if (amount <= auction.highestBid.amount) {
    throw new createError.Forbidden(
      `Your bid must be higher than ${auction.highestBid.amount}!`
    );
  }

  const params = {
    TableName: process.env.AUCTIONS_TABLE_NAME,
    Key: { id },
    UpdateExpression:
      "set highestBid.amount = :amount, highestBid.bidder = :bidder", // dynamodb expression
    ExpressionAttributeValues: {
      ":amount": amount,
      ":bidder": email, // current user's email from auth-service
    },
    ReturnValues: "ALL_NEW",
  };

  let updatedAuction;

  try {
    const result = await dynamodb.update(params).promise(); // result have a property "attributes"
    updatedAuction = result.Attributes; // returns auction item
  } catch (error) {
    console.error(error);
    throw new createError.InternalServerError(error);
  }

  return {
    statusCode: 200,
    // stringify is important, or lambda will break
    body: JSON.stringify(updatedAuction),
  };
}

// Input Schema Validation: amount is required, and must be a number
export const handler = commonMiddleware(placeBid).use(
  validator({ inputSchema: placeBidSchema })
);

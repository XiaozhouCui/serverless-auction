import { v4 as uuid } from "uuid";
import AWS from "aws-sdk";
import validator from "@middy/validator";
import createError from "http-errors";
import commonMiddleware from "../lib/commonMiddleware";
import createAuctionSchema from "../lib/schemas/createAuctionSchema";

const dynamodb = new AWS.DynamoDB.DocumentClient();

async function createAuction(event, context) {
  // body of POST request is stored in event.body as a JSON string
  // httpJsonBodyParser will auto parse JSON string in the background
  const { title } = event.body;
  // auth-service has stored user data from JWT into event.requestContext.authorizer
  const { email } = event.requestContext.authorizer;
  const now = new Date();
  // set the auction to end after 1 hour
  const endDate = new Date();
  endDate.setHours(now.getHours() + 1);

  const auction = {
    id: uuid(),
    title,
    status: "OPEN",
    createdAt: now.toISOString(),
    endingAt: endDate.toISOString(),
    highestBid: {
      amount: 0,
    },
    seller: email, // email from auth-service JWT
  };

  try {
    await dynamodb
      .put({
        TableName: process.env.AUCTIONS_TABLE_NAME,
        Item: auction,
      })
      .promise(); // return a promise
  } catch (error) {
    console.error(error);
    // use createError to auto determine error type
    throw new createError.InternalServerError(error);
  }

  return {
    statusCode: 201,
    // stringify is important, or lambda will break
    body: JSON.stringify(auction),
  };
}

// Input Schema Validation: title is required
export const handler = commonMiddleware(createAuction).use(
  validator({ inputSchema: createAuctionSchema })
);

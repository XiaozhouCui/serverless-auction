import AWS from "aws-sdk";
import commonMiddleware from "../lib/commonMiddleware";
import createError from "http-errors";

const dynamodb = new AWS.DynamoDB.DocumentClient();

export async function getAuctionById(id) {
  let auction;

  try {
    // get single auction by id
    const result = await dynamodb
      .get({
        TableName: process.env.AUCTIONS_TABLE_NAME,
        Key: { id },
      })
      .promise();
    auction = result.Item;
  } catch (error) {
    console.error(error);
    throw new createError.InternalServerError(error);
  }

  if (!auction) {
    throw new createError.NotFound(`Auction with ID "${id}" not found`);
  }

  return auction;
}

async function getAuction(event, context) {
  const { id } = event.pathParameters; // 466f1191-6a1a-4766-8252-caba0f71e43c
  const auction = await getAuctionById(id);
  
  return {
    statusCode: 200,
    // stringify is important, or lambda will break
    body: JSON.stringify(auction),
  };
}

export const handler = commonMiddleware(getAuction);

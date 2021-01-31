import AWS from "aws-sdk";
import createError from "http-errors";
import validator from "@middy/validator";
import commonMiddleware from "../lib/commonMiddleware";
import getAuctionsSchema from "../lib/schemas/getAuctionsSchema";

const dynamodb = new AWS.DynamoDB.DocumentClient();

async function getAuctions(event, context) {
  // grab query string provided to the lambda function
  // https://0egzmyshc8.execute-api.ap-southeast-2.amazonaws.com/dev/auctions?status=OPEN
  const { status } = event.queryStringParameters; // (?status=OPEN)

  let auctions;

  const params = {
    TableName: process.env.AUCTIONS_TABLE_NAME,
    IndexName: "statusAndEndDate",
    KeyConditionExpression: "#status = :status", // dynamodb query, need "#" for reserved wrod "status"
    ExpressionAttributeValues: {
      // use query string to change :status value
      ":status": status,
    },
    ExpressionAttributeNames: {
      // replace "#status" with "status" at run time
      "#status": "status",
    },
  };

  try {
    // // use scan (not query) to fetch auctions
    // const result = await dynamodb.scan({
    //     TableName: process.env.AUCTIONS_TABLE_NAME,
    //   }).promise();

    // use query to fetch auctions
    const result = await dynamodb.query(params).promise();

    auctions = result.Items;
  } catch (error) {
    console.error(error);
    throw new createError.InternalServerError(error);
  }

  return {
    statusCode: 200,
    // stringify is important, or lambda will break
    body: JSON.stringify(auctions),
  };
}

// JSON Schema Validation
export const handler = commonMiddleware(getAuctions).use(
  validator({ inputSchema: getAuctionsSchema, useDefaults: true })
);

import AWS from "aws-sdk";

const dynamodb = new AWS.DynamoDB.DocumentClient();

export async function getEndedAuctions() {
  const now = new Date();

  // prepare query
  const params = {
    TableName: process.env.AUCTIONS_TABLE_NAME,
    IndexName: "statusAndEndDate",
    // dynamodb query to find ended auctions
    KeyConditionExpression: "#status = :status AND endingAt <= :now",
    ExpressionAttributeValues: {
      // populate values
      ":status": "OPEN",
      ":now": now.toISOString(), // dynamodb can work with ISOString dates
    },
    ExpressionAttributeNames: {
      // replace "#status" with "status" at run time, because "status" is a reserved word
      "#status": "status",
    },
  };

  const result = await dynamodb.query(params).promise();
  return result.Items;
}

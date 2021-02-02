import AWS from "aws-sdk";

const dynamodb = new AWS.DynamoDB.DocumentClient();

// Update operation
export async function setAuctionPictureUrl(id, pictureUrl) {
  const params = {
    TableName: process.env.AUCTIONS_TABLE_NAME,
    Key: { id },
    UpdateExpression: "set pictureUrl = :pictureUrl",
    ExpressionAttributeValues: {
      ":pictureUrl": pictureUrl,
    },
    ReturnValues: "ALL_NEW",
  };

  const result = await dynamodb.update(params).promise();

  // .Attributes is for update operation
  return result.Attributes;
}

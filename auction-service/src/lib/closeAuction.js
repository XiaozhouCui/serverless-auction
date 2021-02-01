import AWS from "aws-sdk";

const dynamodb = new AWS.DynamoDB.DocumentClient();
// send SQS notice when auction is closed
const sqs = new AWS.SQS();

// arg "auction" is the auction item fetched from dynamodb
export async function closeAuction(auction) {
  const params = {
    TableName: process.env.AUCTIONS_TABLE_NAME,
    Key: { id: auction.id },
    UpdateExpression: "set #status = :status",
    ExpressionAttributeValues: {
      ":status": "CLOSED",
    },
    ExpressionAttributeNames: {
      "#status": "status",
    },
  };

  // close auction
  await dynamodb.update(params).promise();

  const { title, seller, highestBid } = auction;
  const { amount, bidder } = highestBid;

  // send sqs message to seller
  const notifySeller = sqs
    .sendMessage({
      QueueUrl: process.env.MAIL_QUEUE_URL,
      MessageBody: JSON.stringify({
        subject: "Your item has been sold!",
        recipient: seller,
        body: `Woohoo! Your item "${title}" has been sold for $${amount}.`,
      }),
    })
    .promise();

  // send sqs message to bidder
  const notifyBidder = sqs
    .sendMessage({
      QueueUrl: process.env.MAIL_QUEUE_URL,
      MessageBody: JSON.stringify({
        subject: "You won an auction!",
        recipient: bidder,
        body: `What a great deal! You got yourself a "${title}" for $${amount}.`,
      }),
    })
    .promise();

  // Wait for SQS to send both messages
  return Promise.all([notifySeller, notifyBidder]);
}

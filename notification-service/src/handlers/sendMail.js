import AWS from "aws-sdk";

// use ses from sdk
const ses = new AWS.SES({ region: "ap-southeast-2" });

async function sendMail(event, context) {
  // grab SQS message (string) from event.Records
  const record = event.Records[0]; // the 1 message being processed at a time (batchSize: 1)
  console.log("record processing", record);

  const email = JSON.parse(record.body);
  const { subject, body, recipient } = email;

  // Prepare parameters
  const params = {
    Source: "joe.cui@outlook.com", // verified email in aws ses
    Destination: {
      ToAddresses: [recipient],
    },
    Message: {
      Body: {
        Text: {
          Data: body,
        },
      },
      Subject: {
        Data: subject,
      },
    },
  };

  try {
    const result = await ses.sendEmail(params).promise();
    console.log(result);
    return result;
  } catch (error) {
    console.log(error);
  }
}

export const handler = sendMail;

import AWS from "aws-sdk";

// use ses from sdk
const ses = new AWS.SES({ region: "ap-southeast-2" });

async function sendMail(event, context) {
  // Prepare parameters
  const params = {
    Source: "joe.cui@outlook.com", // verified email in aws ses
    Destination: {
      ToAddresses: ["xiaozhou.cui@gmail.com"],
    },
    Message: {
      Body: {
        Text: {
          Data: "Hello from Joe",
        },
      },
      Subject: {
        Data: "Test Mail",
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

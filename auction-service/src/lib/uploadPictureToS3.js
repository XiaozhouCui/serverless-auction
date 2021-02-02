import AWS from "aws-sdk";

const s3 = new AWS.S3();

export async function uploadPictureToS3(key, body) {
  // arg "key" is the object key in S3, arg "body" is the actual data buffer
  const result = await s3
    .upload({
      // S3 parameters
      Bucket: process.env.AUCTIONS_BUCKET_NAME,
      Key: key,
      Body: body,
      ContentEncoding: "base64",
      ContentType: "image/jpeg",
    })
    .promise();

  // result.Location is the URL for the uploaded picture

  return result.Location;
}

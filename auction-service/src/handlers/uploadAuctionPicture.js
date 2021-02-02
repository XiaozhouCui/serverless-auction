import middy from "@middy/core";
import httpErrorHandler from "@middy/http-error-handler";
import validator from "@middy/validator";
import cors from "@middy/http-cors";
import createError from "http-errors";
import { getAuctionById } from "./getAuction";
import { uploadPictureToS3 } from "../lib/uploadPictureToS3";
import { setAuctionPictureUrl } from "../lib/setAuctionPictureUrl";
import uploadAuctionPictureSchema from "../lib/schemas/uploadAuctionPictureSchema";

export async function uploadAuctionPicture(event) {
  // get auction id
  const { id } = event.pathParameters;
  // get auction object
  const auction = await getAuctionById(id);

  // validation: only seller can upload picture
  const { email } = event.requestContext.authorizer; // current user's email
  if (auction.seller !== email) {
    throw new createError.Forbidden(`You are not the seller of this auction`);
  }

  // handle picture file
  const base64 = event.body.replace(/^data:image\/\w+;base64,/, "");
  const buffer = Buffer.from(base64, "base64");

  let updatedAuction;

  try {
    // Upload picture to S3 bucket
    const pictureUrl = await uploadPictureToS3(auction.id + ".jpg", buffer);
    // Persist pictureUrl into DynamoDB
    updatedAuction = await setAuctionPictureUrl(auction.id, pictureUrl);
  } catch (error) {
    console.error(error);
    throw new createError.InternalServerError(error);
  }

  return {
    statusCode: 200,
    body: JSON.stringify(updatedAuction),
  };
}

export const handler = middy(uploadAuctionPicture)
  .use(httpErrorHandler())
  .use(validator({ inputSchema: uploadAuctionPictureSchema }))
  .use(cors());

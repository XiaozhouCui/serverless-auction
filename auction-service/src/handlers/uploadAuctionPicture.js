import { getAuctionById } from "./getAuction";
import { uploadPictureToS3 } from "../lib/uploadPictureToS3";

export async function uploadAuctionPicture(event) {
  // get auction id
  const { id } = event.pathParameters;
  // get auction object
  const auction = await getAuctionById(id);
  // handle picture file
  const base64 = event.body.replace(/^data:image\/\w+;base64,/, "");
  const buffer = Buffer.from(base64, "base64");

  const uploadToS3Result = await uploadPictureToS3(auction.id + ".jpg", buffer);
  console.log(uploadToS3Result);

  return {
    statusCode: 200,
    body: JSON.stringify({}),
  };
}

export const handler = uploadAuctionPicture;

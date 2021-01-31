import createError from "http-errors";
import { closeAuction } from "../lib/closeAuction";
import { getEndedAuctions } from "../lib/getEndedAuctions";

async function processAuctions(event, context) {
  try {
    const auctionsToClose = await getEndedAuctions();
    // console.log(auctionsToClose); // will show auction items when running `serverless logs -f processAuctions`
    const closePromises = auctionsToClose.map((auction) =>
      // closeAuction() will return a promise
      closeAuction(auction)
    );
    // wait for all promises to resolve
    await Promise.all(closePromises);

    return { closed: closePromises.length };
  } catch (error) {
    console.error(error);
    throw new createError.InternalServerError(error);
  }
}

export const handler = processAuctions;

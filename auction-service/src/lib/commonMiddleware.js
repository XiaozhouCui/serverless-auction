import middy from "@middy/core";
import httpJsonBodyParser from "@middy/http-json-body-parser";
import httpEventNormalizer from "@middy/http-event-normalizer";
import httpErrorHandler from "@middy/http-error-handler";

// wrap handler functions with middy, in order to add .use() method
export default (handler) =>
  middy(handler).use([
    httpJsonBodyParser(), // auto parse JSON string in event arg
    httpEventNormalizer(), // adjust the API Gateway event objects to prevent errors caused by non-existing objects
    httpErrorHandler(),
  ]);

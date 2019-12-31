const response = require('@pixelter/sls-response-helper');
const connectDb = require('../db/connect');
const shopifyHelper = require('./helper');

module.exports.handle = async event => {
  const queryParams = event.queryStringParameters;
  const { shop, hmac, code, state } = queryParams;

  if (shop && hmac && code && state) {
    const databse = await connectDb();
    const isValidRequest = await shopifyHelper.verifyRequest(
      shop,
      state,
      hmac,
      queryParams,
      databse
    );

    if (isValidRequest) {
      const { haveToken, tokenHash } = await shopifyHelper.getAccessToken(
        shop,
        code,
        state,
        databse
      );

      if (haveToken) {
        const appUrl = shopifyHelper.getAppRedirectUrl(shop, tokenHash);
        return response.redirectResponse(appUrl);
      }
    }

    await databse.close();
  }

  return response.createResponse('Installation failed. Please try again :(');
};

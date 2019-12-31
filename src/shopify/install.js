const response = require('@pixelter/sls-response-helper');
const shopifyHelper = require('./helper');
const connectDb = require('../db/connect');

module.exports.handle = async event => {
  const { shop } = event.queryStringParameters;
  if (shop) {
    const databse = await connectDb();
    const url = await shopifyHelper.installUrl(shop, databse);
    await databse.close();

    return response.redirectResponse(url);
  }

  return response.createResponse('Installation failed. Please try again :(');
};

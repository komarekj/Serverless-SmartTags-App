const response = require('@pixelter/sls-response-helper');
const connectDb = require('../db/connect');
const actions = require('./actions');
const { getShopId } = require('./helpers');

/**
 * API hanlder
 */
module.exports.handle = async event => {
  const databse = await connectDb();

  const { action } = event.pathParameters;
  const data = JSON.parse(event.body);
  const { tokenHash, ...requestData } = data;

  const [actionHandler, needsAuth] = actions[action];
  let actionResponse;

  if (actionHandler) {
    // Authenticate token hash if required
    if (needsAuth) {
      const shopId = await getShopId(tokenHash, databse);
      if (shopId) {
        actionResponse = await actionHandler(requestData, shopId, databse);
      } else {
        // Not valid token hash
        actionResponse = response.createJsonResponse(
          false,
          { msg: 'auth failed' },
          401
        );
      }
    } else {
      // No auth needed
      actionResponse = await actionHandler(requestData, databse);
    }
  } else {
    // No action found
    actionResponse = response.createJsonResponse(false, {
      msg: "action doesn't exist",
    });
  }

  await databse.close();
  return actionResponse;
};

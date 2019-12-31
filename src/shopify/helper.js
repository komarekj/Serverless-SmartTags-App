/* eslint-disable no-underscore-dangle */
const querystring = require('querystring');
const crypto = require('crypto');
const request = require('request-promise');
const nonce = require('nonce')();
const shopModel = require('../db/models/shop');
const authModel = require('../db/models/auth');

/**
 * Settings
 */
const TOKEN_HASH_SALT = 'j"y+c$p:</65!2/j';

/**
 * Shopify Settings
 */
const {
  SHOPIFY_APP_KEY,
  SHOPIFY_APP_SECRET,
  SHOPIFY_APP_ID,
  APP_HOST,
  SHOPIFY_SCOPES,
} = process.env;

/**
 * Installation
 */
module.exports.installUrl = async (shopUrl, db) => {
  // Generate unique install URL
  const state = nonce();
  const redirectUri = `${APP_HOST}/install/callback`;
  const url =
    `https://${shopUrl}` +
    `/admin/oauth/authorize?client_id=${SHOPIFY_APP_KEY}` +
    `&scope=${SHOPIFY_SCOPES}` +
    `&state=${state}` +
    `&redirect_uri=${redirectUri}`;

  // Save the state nonce
  const Shop = db.model(shopModel.name);
  const shop = await Shop.findOneAndUpdate(
    { url: shopUrl },
    {},
    { upsert: true, new: true }
  );

  const Auth = db.model(authModel.name);
  const newAuth = new Auth({
    installState: state,
    url: shopUrl,
    shopId: shop._id,
  });

  await newAuth.save();

  return url;
};

/**
 * Verify Request
 */
const verifyState = async (shopUrl, state, db) => {
  const Auth = db.model(authModel.name);
  const auth = await Auth.findOne({ url: shopUrl, installState: state });
  return auth !== null;
};

const verifyHmac = queryParams => {
  const { hmac, ...pramas } = queryParams;
  const message = querystring.stringify(pramas);
  const providedHmac = Buffer.from(hmac, 'utf-8');
  const generatedHash = Buffer.from(
    crypto
      .createHmac('sha256', SHOPIFY_APP_SECRET)
      .update(message)
      .digest('hex'),
    'utf-8'
  );

  let hashEquals = false;
  try {
    hashEquals = crypto.timingSafeEqual(generatedHash, providedHmac);
  } catch (e) {
    hashEquals = false;
  }

  // True if valid
  return hashEquals;
};

const getTokenHash = token => {
  const hash = crypto.createHmac('sha256', TOKEN_HASH_SALT);
  hash.update(token);
  const value = hash.digest('hex');
  return value;
};

module.exports.verifyRequest = async (
  shopUrl,
  state,
  hmac,
  queryParams,
  db
) => {
  const hasValidState = await verifyState(shopUrl, state, db);
  const haValidHmac = verifyHmac(queryParams);
  return hasValidState && haValidHmac;
};

/**
 * Get permanent access token
 */
module.exports.getAccessToken = async (shopUrl, code, state, db) => {
  const accessTokenRequestUrl = `https://${shopUrl}/admin/oauth/access_token`;
  const accessTokenPayload = {
    client_id: SHOPIFY_APP_KEY,
    client_secret: SHOPIFY_APP_SECRET,
    code,
  };

  try {
    const response = await request.post(accessTokenRequestUrl, {
      json: accessTokenPayload,
    });
    const accessToken = response.access_token;
    const tokenHash = getTokenHash(accessToken);

    const Auth = db.model(authModel.name);
    await Auth.findOneAndUpdate(
      { url: shopUrl, installState: state },
      { accessToken, installState: null, tokenHash },
      { upsert: true, useFindAndModify: false }
    );

    return { haveToken: true, tokenHash };
  } catch (e) {
    // eslint-disable-next-line no-console
    console.log(e);
    return { haveToken: false };
  }
};

/**
 * Get redirect URL
 */
module.exports.getAppRedirectUrl = (shopUrl, tokenHash) =>
  `https://${shopUrl}/admin/apps/${SHOPIFY_APP_ID}/app?shop=${shopUrl}&newTokenHash=${tokenHash}`;

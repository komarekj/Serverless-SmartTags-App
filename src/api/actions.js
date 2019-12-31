const response = require('@pixelter/sls-response-helper');
const ruleModel = require('../db/models/rule');
const shopifyHalper = require('../shopify/helper');
const { scheduleCron } = require('./helpers');

/**
 * Settings
 */
const LIMIT = 20;

/**
 * List all store rules
 */
const list = async (data, shopId, db) => {
  const { page = 1 } = data;
  const skip = LIMIT * (page - 1);

  const Rule = db.model(ruleModel.name);
  const count = await Rule.countDocuments({ shopId });
  const items = await Rule.find({ shopId }, null, { limit: LIMIT, skip });

  return response.createJsonResponse(true, { count, items });
};

/**
 * Get store rule by ID
 */
const get = async (data, shopId, db) => {
  const { _id } = data;

  if (_id) {
    const Rule = db.model(ruleModel.name);
    const rule = await Rule.findOne({ _id, shopId });
    return response.createJsonResponse(true, rule);
  }

  return response.createJsonResponse(false, { msg: 'missing _id' });
};

/**
 * Create store rule
 */
const create = async (data, shopId, db) => {
  const Rule = db.model(ruleModel.name);
  const newRule = new Rule({ shopId, ...data });
  await newRule.save();

  await scheduleCron(shopId, db);

  return response.createJsonResponse(true, newRule);
};

/**
 * Update store rule
 */
const update = async (data, shopId, db) => {
  const { _id, ...updateDate } = data;

  const Rule = db.model(ruleModel.name);
  const updatedRule = await Rule.findOneAndUpdate({ _id, shopId }, updateDate, {
    new: true,
  });

  await scheduleCron(shopId, db);

  return response.createJsonResponse(true, updatedRule);
};

/**
 * Remove store rule
 */
const remove = async (data, shopId, db) => {
  const { _id } = data;

  const Rule = db.model(ruleModel.name);
  await Rule.findOneAndRemove({ _id, shopId });

  await scheduleCron(shopId, db);

  return response.createJsonResponse(true);
};

/**
 * Install URL
 */
const installUrl = async (data, db) => {
  const { storeUrl } = data;

  if (storeUrl) {
    const url = await shopifyHalper.installUrl(storeUrl, db);
    return response.createJsonResponse(true, { url });
  }

  return response.createJsonResponse(false, { msg: 'missing shop url' });
};

/**
 * Action Map
 */
module.exports = {
  list: [list, true],
  get: [get, true],
  create: [create, true],
  update: [update, true],
  remove: [remove, true],
  'install-url': [installUrl, false],
};

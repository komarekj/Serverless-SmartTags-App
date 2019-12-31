/* eslint-disable no-await-in-loop */
/* eslint-disable no-restricted-syntax */
const Shopify = require('shopify-api-node');
const _ = require('lodash');
const shopModel = require('../../db/models/shop');
const authModel = require('../../db/models/auth');
const ruleModel = require('../../db/models/rule');
const cronScheduleModel = require('../../db/models/cronSchedule');

/**
 * Settings
 */
const SHOPIFY_PAGE_SIZE = 250;

/**
 * Cron helpers
 */

// Get scheduled crons from DB
module.exports.getScheduledCrons = async db => {
  const CronSchedule = db.model(cronScheduleModel.name);
  const schduledCrons = await CronSchedule.find({
    finished: false,
    inProgress: false,
  }).sort('field -created');

  // Run only the latest cron & cancel the old ones
  const shopScheduledCrons = _.groupBy(schduledCrons, 'shopId');

  let cronsToRun = [];
  let cronsToCancel = [];

  Object.keys(shopScheduledCrons).forEach(shopId => {
    const shopCrons = shopScheduledCrons[shopId];
    const [latestCron, ...oldCrons] = shopCrons;

    cronsToRun = [...cronsToRun, latestCron];
    cronsToCancel = [...cronsToCancel, ...oldCrons];
  });

  for (const cron of cronsToCancel) {
    await cron.remove();
  }

  return cronsToRun;
};

module.exports.startScheduledCron = async (cronId, db) => {
  const CronSchedule = db.model(cronScheduleModel.name);
  await CronSchedule.findOneAndReplace({ _id: cronId }, { inProgress: true });
};

module.exports.finishScheduleCron = async (cronId, db) => {
  const CronSchedule = db.model(cronScheduleModel.name);
  await CronSchedule.findOneAndReplace(
    { _id: cronId },
    { finished: true, inProgress: false }
  );
};

// Get all active stores from DB
module.exports.getAllShops = async db => {
  const Shop = db.model(shopModel.name);
  const shops = await Shop.find({ active: true });
  return shops;
};

// Get latest auth for a store
module.exports.getShopAuth = async (shopId, db) => {
  const Auth = db.model(authModel.name);
  const latestAuth = await Auth.findOne({ shopId }).sort('field -created');
  return latestAuth;
};

// Get all store related rules
module.exports.getAllRules = async (shopId, db) => {
  const Rule = db.model(ruleModel.name);
  const rules = await Rule.find({ shopId });
  return rules;
};

// Creates shopify connection
module.exports.getShopify = shopAuth => {
  const { url, accessToken } = shopAuth;
  return new Shopify({
    shopName: url,
    accessToken,
  });
};

// Gets all shopify resources from multiple pages
module.exports.listResourceItems = async (resourceType, shopify) => {
  let finalList = [];
  const model = shopify[resourceType];

  if (model) {
    // Get number of pages
    const count = await model.count();
    const pages = Math.ceil(count / SHOPIFY_PAGE_SIZE);

    // List customers per page
    for (const idx of [...Array(pages).keys()]) {
      const page = idx + 1;
      const items = await model.list({
        page,
        limit: SHOPIFY_PAGE_SIZE,
      });

      finalList = [...finalList, ...items];
    }
  }

  return finalList;
};

// Saves updated tag values to Shopify
module.exports.saveNewTags = async (tagsToUpdate, resourceType, shopify) => {
  const model = shopify[resourceType];

  for (const update of tagsToUpdate) {
    await model.update(update.itemId, { tags: update.tags });
  }
};

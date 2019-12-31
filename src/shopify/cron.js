/* eslint-disable no-await-in-loop */
/* eslint-disable no-restricted-syntax */
/* eslint-disable no-underscore-dangle */
const async = require('async');
const connectDb = require('../db/connect');
const resourceHelper = require('./tags/resources');
const ruleHelper = require('./tags/rules');
const tagHelper = require('./tags/tags');

/**
 * Settings
 */
const ASYNC_LIMIT = 10;

/**
 * Hanlde the cron run for selected shops
 */
const handleCron = async (shopsId, db) => {
  try {
    const shopAuth = await resourceHelper.getShopAuth(shopsId, db);
    const rules = await resourceHelper.getAllRules(shopsId, db);

    if (rules) {
      const shopify = resourceHelper.getShopify(shopAuth);
      const groupedRules = ruleHelper.groupRules(rules);
      const resourceTypes = Object.keys(groupedRules);

      for (const resourceType of resourceTypes) {
        const resourceRules = groupedRules[resourceType];
        const resourceItems = await resourceHelper.listResourceItems(
          resourceType,
          shopify
        );
        const tagsToUpdate = await tagHelper.getNewItemTags(
          resourceRules,
          resourceItems,
          resourceType,
          shopify
        );
        await resourceHelper.saveNewTags(tagsToUpdate, resourceType, shopify);
      }
    }
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(err);
  }
};

/**
 * Runs every few hours for all shops
 */
module.exports.regural = async () => {
  const database = await connectDb();

  // Get list of all store ids
  const shops = await resourceHelper.getAllShops(database);

  await async.eachLimit(shops, ASYNC_LIMIT, async shop => {
    await handleCron(shop._id, database);
  });

  await database.close();
  return true;
};

/**
 * Regural checks for scheduled updates
 */
module.exports.scheduled = async () => {
  const database = await connectDb();

  // List all scheduled crons and get list of store ids
  const scheduledCrons = await resourceHelper.getScheduledCrons(database);

  await async.eachLimit(scheduledCrons, ASYNC_LIMIT, async cron => {
    await resourceHelper.startScheduledCron(cron._id, database);
    await handleCron(cron.shopId, database);
    await resourceHelper.finishScheduleCron(cron._id, database);
  });

  await database.close();
  return true;
};

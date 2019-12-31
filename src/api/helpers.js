const authModel = require('../db/models/auth');
const cronScheduleModel = require('../db/models/cronSchedule');

/**
 * Schedule cron after updates
 */
module.exports.scheduleCron = async (shopId, db) => {
  const CronSchedule = db.model(cronScheduleModel.name);
  const newCron = new CronSchedule({ shopId });
  await newCron.save();
};

/**
 * Get Shop ID and verify token
 */
module.exports.getShopId = async (tokenHash, db) => {
  const Auth = db.model(authModel.name);
  const auth = await Auth.findOne({ tokenHash });
  if (auth) return auth.shopId;
  return null;
};

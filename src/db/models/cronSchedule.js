const { Schema } = require('mongoose');

module.exports.name = 'CronSchedule';

module.exports.schema = new Schema({
  created: { type: Date, default: Date.now },
  shopId: Schema.Types.ObjectId,
  finished: { type: Boolean, default: false },
  inProgress: { type: Boolean, default: false },
});

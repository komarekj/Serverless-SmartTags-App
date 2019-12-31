const { Schema } = require('mongoose');

module.exports.name = 'Rule';

const ConditionSchema = new Schema({
  variable: String,
  operator: String,
  value: String,
});

module.exports.schema = new Schema({
  created: { type: Date, default: Date.now },
  shopId: Schema.Types.ObjectId,
  account: String,
  name: String,
  description: String,
  enabled: Boolean,
  tag: String,
  resource: String,
  conditionsType: String,
  conditions: [ConditionSchema],
});

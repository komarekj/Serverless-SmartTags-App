const { Schema } = require('mongoose');

module.exports.name = 'Auth';

module.exports.schema = new Schema({
  created: { type: Date, default: Date.now },
  url: String,
  installState: String,
  accessToken: String,
  tokenHash: String,
  shopId: Schema.Types.ObjectId,
});

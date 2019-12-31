const { Schema } = require('mongoose');

module.exports.name = 'Shop';

module.exports.schema = new Schema({
  created: { type: Date, default: Date.now },
  url: String,
  active: Boolean,
});

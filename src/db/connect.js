const mongoose = require('mongoose');
const models = require('./models');

module.exports = async () => {
  const url = process.env.DB_URL;

  const connection = await mongoose.createConnection(url, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  models.forEach(({ name, schema }) => connection.model(name, schema));

  return connection;
};

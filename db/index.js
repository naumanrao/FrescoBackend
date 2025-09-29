const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config();

const connectdb = () => {
  mongoose
    .connect(process.env.MONGODB_URI, {
      dbName: "ims",
    })
    .then((c) => {
      console.log(`database connected with ${c.connection.host}`);
    })
    .catch((e) => {
      console.log(e);
    });
};

module.exports = connectdb;

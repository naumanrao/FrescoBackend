const mongoose = require("mongoose");

const ConsumedSchema = new mongoose.Schema(
  {
    userID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: true,
    },
    ProductID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "product",
      required: true,
    },
    ConsumedQuantity: {
      type: Number,
      required: true,
    },
    ConsumptionDate: {
      type: String,
      required: true,
    },
    TotalConsumedAmount: {
      type: Number,
      required: true,
    },
  },
  { timestamps: true }
);

const Consumed = mongoose.model("consumed", ConsumedSchema);
module.exports = Consumed;

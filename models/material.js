const mongoose = require("mongoose");

const RawMaterialSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String },
    availableStock: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const RawMaterial = mongoose.model("RawMaterial", RawMaterialSchema);
module.exports = RawMaterial;

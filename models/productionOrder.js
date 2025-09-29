const mongoose = require("mongoose");

const ProductionOrderSchema = new mongoose.Schema(
  {
    userID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'users', // Assuming you have a 'users' collection
      required: true,
    },
    finishedProduct: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'product',
      required: true,
    },
    quantityProduced: {
      type: Number,
      required: true,
      min: [1, 'Quantity produced must be at least 1'],
    },
    // Snapshot of the BOM at the time of production
    bomSnapshot: [
      {
        material: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'product',
          required: true
        },
        // Quantity specified in the ideal BOM per unit of finished product
        idealQuantityPerUnit: {
          type: Number,
          required: true,
          min: 0
        },
        // Ideal waste percentage/quantity specified in the BOM per unit of finished product
        idealWastePerUnit: {
          type: Number,
          required: true,
          min: 0
        },
        // Actual quantity of this material consumed for this production run
        actualQuantityConsumed: {
          type: Number,
          required: true,
          min: 0
        },
        // Actual waste for this specific material in this production run (manual entry override)
        actualWaste: {
          type: Number,
          required: true,
          min: 0
        },
        // Reference to raw material properties for logging
        materialName: String,
        materialUnitType: String,
        materialSize: String,
      }
    ],
    productionDate: {
      type: Date,
      default: Date.now,
    },
    notes: String,
  },
  { timestamps: true }
);

// Add index for faster queries by user and finished product
ProductionOrderSchema.index({ userID: 1, finishedProduct: 1, productionDate: -1 });

const ProductionOrder = mongoose.model("ProductionOrder", ProductionOrderSchema);
module.exports = ProductionOrder;
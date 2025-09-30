const mongoose = require("mongoose");

const ProductSchema = new mongoose.Schema(
  {
    userID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'users',
      required: true,
    },
    type: {
      type: String,
      enum: ['raw', 'ready'],
      required: true,
      default: 'raw'
    },
    unitType: {
      type: String,
      enum: ['discrete', 'bulk'],
      default: 'discrete'
    },
    size: {
      type: String,
      required: function () {
        // Required only if type is 'raw'
        return this.type === 'raw';
      },
      validate: {
        validator: function (value) {
          // For 'raw', restrict to allowed enums
          if (this.type === 'raw') {
            return ['kg', 'g', 'L', 'mL', 'units'].includes(value);
          }
          // For 'ready', allow any string or even empty string
          return true;
        },
        message: props => `${props.value} is not a valid size for raw materials`
      }
    },
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true
    },
    manufacturer: {
      type: String,
      required: [true, 'Manufacturer is required']
    },
    stock: {
      type: Number,
      required: [true, 'Stock is required'],
      min: [0, 'Stock cannot be negative']
    },
    price: Number,
    description: String,
     ingredients: [
      {
        material: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'product',
          required: true
        },
        quantity: {
          type: Number,
          required: true,
          min: 0
        },
        waste: {
          type: Number,
          required: true,
          min: 0
        }
      }
    ]
  },
  { timestamps: true }
);

// Compound index
ProductSchema.index({ userID: 1, type: 1 });

const Product = mongoose.model("product", ProductSchema);
module.exports = Product;

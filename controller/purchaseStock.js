// const Purchase = require("../models/purchase");
const Product = require("../models/product");

const purchaseStock = async (productID, purchaseStockData) => {
  // Updating Purchase stock
  try {
    const myProductData = await Product.findOne({ _id: productID });
    let myUpdatedStock =
      parseInt(myProductData.stock) + parseInt(purchaseStockData);
      let totalPurchaseAmount = parseFloat(myProductData.price) * parseInt(purchaseStockData);
    const PurchaseStock = await Product.findByIdAndUpdate(
      { _id: productID },
      {
        stock: myUpdatedStock,
        totalPurchase: totalPurchaseAmount,
      },
      { new: true }
    );
    console.log(PurchaseStock);
  } catch (error) {
    console.error("Error updating Purchase stock ", error);
  }
};

module.exports = purchaseStock;

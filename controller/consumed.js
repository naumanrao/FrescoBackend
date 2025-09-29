const Consumed = require("../models/consumed");
const soldStock = require("./soldStock");

// Add COnsumed Products
const addConsumedProducts = (req, res) => {
  const addSale = new Consumed({
    userID: req.body.userID,
    ProductID: req.body.productID,
    ConsumedQuantity: req.body.consumedQuantity,
    ConsumptionDate: req.body.consumptionDate,
    TotalConsumedAmount: req.body.totalConsumedAmount,
  });

  addSale
    .save()
    .then((result) => {
      soldStock(req.body.productID, req.body.consumedQuantity);
      res.status(200).send(result);
    })
    .catch((err) => {
      res.status(402).send(err);
    });
};

// Get All Consumed Data
const getConsumedProductsData = async (req, res) => {
  const findAllConsumedData = await Consumed.find({ userID: req.params.userID })
    .sort({ _id: -1 })
    .populate("ProductID");
  res.json(findAllConsumedData);
};

// Get total consumed amount
const getTotalConsumedAmount = async (req, res) => {
  let totalConsumedAmount = 0;
  const consumedData = await Consumed.find({ userID: req.params.userID });
  consumedData.forEach((sale) => {
    totalConsumedAmount += sale.TotalConsumedAmount;
  });
  res.json({ totalConsumedAmount });
};

// const getMonthlySales = async (req, res) => {
//   try {
//     const sales = await Consumed.find();

//     // Initialize array with 12 zeros
//     const salesAmount = [];
//     salesAmount.length = 12;
//     salesAmount.fill(0);

//     sales.forEach((sale) => {
//       const monthIndex = parseInt(sale.SaleDate.split("-")[1]) - 1;

//       salesAmount[monthIndex] += sale.TotalSaleAmount;
//     });

//     res.status(200).json({ salesAmount });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: "Server error" });
//   }
// };

module.exports = {
  addConsumedProducts,
  // getMonthlySales,
  getConsumedProductsData,
  getTotalConsumedAmount,
};

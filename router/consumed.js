const express = require("express");
const app = express();
const consumed = require("../controller/consumed");

// Add Sales
app.post("/add", consumed.addConsumedProducts);

// Get All Sales
app.get("/get/:userID", consumed.getConsumedProductsData);
// app.get("/getmonthly", sales.getMonthlySales);

app.get("/get/:userID/totalconsumedamount", consumed.getTotalConsumedAmount);

module.exports = app;

// http://localhost:4000/api/sales/add POST
// http://localhost:4000/api/sales/get GET

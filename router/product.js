const express = require("express");
const app = express();
const product = require("../controller/product");

// Add Product
app.post("/add", product.addProduct);

// Get All Products
app.get("/get/:userID", product.getAllProducts);


app.post("/bulk-upload", product.bulkUpload);
// routes/product.js
app.get('/get-raw-materials/:userId', product.getRawMaterials);
// Delete Selected Product Item
app.get("/delete/:id", product.deleteSelectedProduct);

// Update Selected Product
app.post("/update", product.updateSelectedProduct);

// Search Product
app.get("/search", product.searchProduct);

// app.post("/deduct-stock", product.deductRawMaterials);
app.post("/update-inventory", product.updateInventory);
// http://localhost:4000/api/product/search?searchTerm=fa

// Set or update BOM for a finished product
app.post("/bom/set", product.setBOM);

// Get BOM for a finished product
app.get("/bom/get/:productId", product.getBOM);

// --- New Production Order Route ---

// Create a Production Order
app.post("/production-orders/create", product.createProductionOrder);
app.get("/production-orders/:userID", product.getAllProductionOrders); 

// Get a Single Production Order by ID
app.get("/production-orders/details/:id", product.getProductionOrderById);

module.exports = app;

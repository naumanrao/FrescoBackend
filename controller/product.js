const Product = require("../models/product");
const Purchase = require("../models/purchase");
const Sales = require("../models/sales");
const ProductionOrder = require("../models/productionOrder"); // <-- IMPORT THE NEW MODEL
const mongoose = require("mongoose");

// Add Product
const addProduct = async (req, res) => {
  const session = await mongoose.startSession();
  
  try {
    session.startTransaction();
    const [newProduct] = await Product.create([req.body], { session });

    // if (newProduct.type === 'ready') {
    //   for (const ingredient of newProduct.ingredients) {
    //     const rawMaterial = await Product.findById(ingredient.material).session(session);
        
    //     if (!rawMaterial) throw new Error(`Raw material ${ingredient.material} not found`);
        
    //     const quantity = Number(ingredient.quantity);
    //     const waste = Number(ingredient.waste);
    //     const productStock = Number(newProduct.stock);
        
    //     if ([quantity, waste, productStock].some(isNaN)) {
    //       throw new Error('Invalid numerical values in ingredient calculation');
    //     }

    //     const requiredQuantity = (quantity + waste) * productStock;
        
    //     if (rawMaterial.unitType === 'discrete' && !Number.isInteger(requiredQuantity)) {
    //       throw new Error(`Invalid quantity for ${rawMaterial.name}: Requires whole numbers`);
    //     }

    //     if (rawMaterial.stock < requiredQuantity) {
    //       throw new Error(`Insufficient stock for ${rawMaterial.name} (Need ${requiredQuantity}, Have ${rawMaterial.stock})`);
    //     }

    //     rawMaterial.stock -= requiredQuantity;
    //     await rawMaterial.save({ session });
    //   }
    // }

    await session.commitTransaction();
    res.status(201).json(newProduct);

  } catch (error) {
    await session.abortTransaction();
    res.status(400).json({
      success: false,
      error: error.message,
      debug: { received: req.body }
    });
  } finally {
    session.endSession();
  }
};

// Get All Products
const getAllProducts = async (req, res) => {
  const findAllProducts = await Product.find({
    userID: req.params.userID,
  }).sort({ _id: -1 })
  res.json(findAllProducts);
};

// Delete Selected Product
const deleteSelectedProduct = async (req, res) => {
  const deleteProduct = await Product.deleteOne({ _id: req.params.id });
  const deletePurchaseProduct = await Purchase.deleteOne({
    ProductID: req.params.id,
  });

  const deleteSaleProduct = await Sales.deleteOne({ ProductID: req.params.id });
  res.json({ deleteProduct, deletePurchaseProduct, deleteSaleProduct });
};

// Update Selected Product
const updateSelectedProduct = async (req, res) => {
  try {
    const updatedResult = await Product.findByIdAndUpdate(
      { _id: req.body.productID },
      {
        name: req.body.name,
        manufacturer: req.body.manufacturer,
        description: req.body.description,
        stock: req.body.stock,
      },
      { new: true }
    );
    console.log(updatedResult);
    res.json(updatedResult);
  } catch (error) {
    console.log(error);
    res.status(402).send("Error");
  }
};

// Search Products
const searchProduct = async (req, res) => {
  const searchTerm = req.query.searchTerm;
  const products = await Product.find({
    name: { $regex: searchTerm, $options: "i" },
  });
  res.json(products);
};


const getRawMaterials = async (req, res) => {
  try {
    const rawMaterials = await Product.find({
      userID: req.params.userId,
      type: 'raw'
    });
    res.json(rawMaterials);
  } catch (error) {
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
};


const updateInventory = async (req, res) => {
  try {
    const { updates } = req.body;
    const operations = updates.map(update => 
      Product.findByIdAndUpdate(update.productId, { $inc: { stock: update.quantity } }, { new: true })
    );
    
    const results = await Promise.all(operations);
    res.json(results);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const bulkUpload = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const { type, items, userId } = req.body;
    const results = [];
    const errors = [];

    for (const [index, item] of items.entries()) {
      try {
        // Process ready products
        // if (type === 'ready') {
        //   const ingredients = item.ingredients || [];
          
        //   // Validate and reserve stock first
        //   for (const ingredient of ingredients) {
        //     const material = await Product.findById(ingredient.material).session(session);
            
        //     if (!material) throw new Error(`Material ${ingredient.material} not found`);
        //     if (material.type !== 'raw') throw new Error(`${material.name} is not a raw material`);
            
        //     const required = (Number(ingredient.quantity) + Number(ingredient.waste)) * Number(item.stock);
            
        //     if (material.stock < required) {
        //       throw new Error(`Insufficient stock for ${material.name} (Need ${required}, Have ${material.stock})`);
        //     }
            
        //     material.stock -= required;
        //     await material.save({ session });
        //   }
        // }

        const product = new Product({ ...item, userID: userId });
        const doc = await product.save({ session });
        results.push(doc);

      } catch (error) {
        errors.push(`Row ${index + 1}: ${error.message}`);
      }
    }

    if (errors.length > 0) {
      await session.abortTransaction();
      return res.status(400).json({ 
        success: false,
        errorCount: errors.length,
        errors
      });
    }

    await session.commitTransaction();
    res.status(201).json({
      success: true,
      insertedCount: results.length,
      data: results
    });

  } catch (error) {
    await session.abortTransaction();
    res.status(500).json({
      success: false,
      error: `Server Error: ${error.message}`
    });
  } finally {
    session.endSession();
  }
};

// Bill of Materials (BOM) logic
// Set or update BOM for a finished product
const setBOM = async (req, res) => {
  try {
    const { productId, ingredients } = req.body;
    // Validate product exists and is a finished product
    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    if (product.type !== 'ready') return res.status(400).json({ success: false, message: 'BOM can only be set for finished (ready) products' });

    // Validate ingredients array
    if (!Array.isArray(ingredients) || ingredients.length === 0) {
      return res.status(400).json({ success: false, message: 'Ingredients array required' });
    }

    // Optionally: validate each ingredient (material exists, etc.)
    // For now, just set the BOM
    product.ingredients = ingredients;
    await product.save();
    res.json({ success: true, message: 'BOM updated', product });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get BOM for a finished product
const getBOM = async (req, res) => {
  try {
    const { productId } = req.params;
    const product = await Product.findById(productId).populate('ingredients.material', 'name size unitType manufacturer');
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    if (product.type !== 'ready') return res.status(400).json({ success: false, message: 'BOM only for finished (ready) products' });
    res.json({ success: true, bom: product.ingredients });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// --- NEW PRODUCTION ORDER LOGIC ---
const createProductionOrder = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { userID, finishedProductId, quantityProduced, ingredientAdjustments, notes } = req.body;

    // 1. Validate input
    if (!userID || !finishedProductId || !quantityProduced || quantityProduced <= 0) {
      throw new Error('Missing required fields: userID, finishedProductId, and a positive quantityProduced.');
    }

    // 2. Fetch the finished product and populate its BOM
    const finishedProduct = await Product.findById(finishedProductId)
      .populate('ingredients.material') // Populate the raw material details
      .session(session);

    if (!finishedProduct) {
      throw new Error('Finished product not found.');
    }
    if (finishedProduct.type !== 'ready') {
      throw new Error('Production orders can only be created for "ready" products.');
    }
    if (!finishedProduct.ingredients || finishedProduct.ingredients.length === 0) {
      throw new Error('Finished product does not have a Bill of Materials (BOM) defined.');
    }

    // Prepare BOM snapshot for the production order log
    const bomSnapshot = [];

    for (const bomItem of finishedProduct.ingredients) {
      const rawMaterial = bomItem.material; // This is the populated material document

      if (!rawMaterial) {
        // This should ideally not happen if BOM is properly set with valid material IDs
        throw new Error(`Raw material with ID ${bomItem.material} in BOM not found.`);
      }

      // Get ideal quantity and waste from BOM
      const idealQuantityPerUnit = Number(bomItem.quantity);
      const idealWastePerUnit = Number(bomItem.waste);

      // Check for manual adjustment for this ingredient
      const adjustment = ingredientAdjustments?.find(adj => adj.materialId.toString() === rawMaterial._id.toString());
      const manualWastageOverride = adjustment ? Number(adjustment.manualWaste) : null;

      // Determine actual waste for this specific ingredient in this run
      let actualWasteForMaterial = idealWastePerUnit * quantityProduced; // Default to ideal total waste
      if (manualWastageOverride !== null && !isNaN(manualWastageOverride)) {
        actualWasteForMaterial = manualWastageOverride; // Override with manual entry
        if (actualWasteForMaterial < 0) throw new Error(`Manual waste for ${rawMaterial.name} cannot be negative.`);
      }

      // Calculate total actual material to be consumed (quantity + actual waste)
      const actualQuantityToConsume = (idealQuantityPerUnit * quantityProduced) + actualWasteForMaterial;

      // Validate discrete materials require whole numbers
      if (rawMaterial.unitType === 'discrete' && !Number.isInteger(actualQuantityToConsume)) {
        throw new Error(
          `Invalid quantity for ${rawMaterial.name}: Discrete items require whole numbers (Calculated: ${actualQuantityToConsume}). Adjust 'quantityProduced' or 'manualWaste'.`
        );
      }

      // 3. Check raw material stock availability
      if (rawMaterial.stock < actualQuantityToConsume) {
        throw new Error(
          `Insufficient stock for ${rawMaterial.name}.\n` +
          `Required: ${actualQuantityToConsume} ${rawMaterial.size || 'units'}\n` +
          `Available: ${rawMaterial.stock} ${rawMaterial.size || 'units'}`
        );
      }

      // 4. Deduct raw material stock
      rawMaterial.stock -= actualQuantityToConsume;
      await rawMaterial.save({ session });

      bomSnapshot.push({
        material: rawMaterial._id,
        idealQuantityPerUnit: idealQuantityPerUnit,
        idealWastePerUnit: idealWastePerUnit,
        actualQuantityConsumed: actualQuantityToConsume,
        actualWaste: actualWasteForMaterial,
        materialName: rawMaterial.name,
        materialUnitType: rawMaterial.unitType,
        materialSize: rawMaterial.size,
      });
    }

    // 5. Update finished product stock
    finishedProduct.stock += quantityProduced;
    await finishedProduct.save({ session });

    // 6. Create the Production Order log
    const newProductionOrder = new ProductionOrder({
      userID,
      finishedProduct: finishedProductId,
      quantityProduced,
      bomSnapshot,
      notes,
    });
    await newProductionOrder.save({ session });

    // 7. Commit transaction
    await session.commitTransaction();
    res.status(201).json({
      success: true,
      message: 'Production order created successfully.',
      productionOrder: newProductionOrder,
      updatedFinishedProduct: {
        _id: finishedProduct._id,
        name: finishedProduct.name,
        stock: finishedProduct.stock
      },
      consumedRawMaterials: bomSnapshot.map(item => ({
        materialName: item.materialName,
        consumed: item.actualQuantityConsumed,
        waste: item.actualWaste
      }))
    });

  } catch (error) {
    // 8. Abort transaction on error
    await session.abortTransaction();
    console.error("Production Order Error:", error);
    res.status(400).json({
      success: false,
      error: error.message,
      debug: {
        receivedPayload: req.body
      }
    });
  } finally {
    session.endSession();
  }
};
const getAllProductionOrders = async (req, res) => {
  try {
    const { userID } = req.params; // Expect userID from URL params
    const orders = await ProductionOrder.find({ userID })
      .populate('finishedProduct', 'name manufacturer') // Populate finished product details
      .sort({ productionDate: -1 }); // Latest orders first
    res.json(orders);
  } catch (error) {
    console.error('Error fetching all production orders:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get a Single Production Order by ID
const getProductionOrderById = async (req, res) => {
  try {
    const { id } = req.params; // Expect order ID from URL params
    const order = await ProductionOrder.findById(id)
      .populate('finishedProduct', 'name manufacturer stock') // Populate finished product details
      .populate('bomSnapshot.material', 'name size unitType'); // Populate raw material details in snapshot
    
    if (!order) {
      return res.status(404).json({ success: false, message: 'Production order not found' });
    }
    res.json(order);
  } catch (error) {
    console.error('Error fetching production order by ID:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = {
  addProduct,
  getAllProducts,
  deleteSelectedProduct,
  updateSelectedProduct,
  searchProduct,
  updateInventory,
  getRawMaterials,
  bulkUpload,
  setBOM,       
  getBOM,      
  createProductionOrder, 
  getAllProductionOrders,   
  getProductionOrderById,
};
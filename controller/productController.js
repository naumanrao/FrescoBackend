// ... (existing imports)
const ProductionOrder = require("../models/productionOrder"); // Import the new model

// ... (existing functions)

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
    let totalStockUpdateForFinishedProduct = quantityProduced; // Start with the produced quantity

    for (const bomItem of finishedProduct.ingredients) {
      const rawMaterial = bomItem.material; // This is the populated material document

      if (!rawMaterial) {
        throw new Error(`Raw material with ID ${bomItem.material._id} not found in BOM.`);
      }

      // Get ideal quantity and waste from BOM
      const idealQuantityPerUnit = Number(bomItem.quantity);
      const idealWastePerUnit = Number(bomItem.waste);

      // Calculate total ideal required material for the desired production quantity
      const totalIdealMaterialRequired = (idealQuantityPerUnit + idealWastePerUnit) * quantityProduced;

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
    finishedProduct.stock += totalStockUpdateForFinishedProduct;
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
      updatedFinishedProduct: finishedProduct,
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

// ... (existing exports)
module.exports = {
  // ... (existing exports)
  createProductionOrder,
  // ... (don't forget setBOM, getBOM if they are in this file)
};
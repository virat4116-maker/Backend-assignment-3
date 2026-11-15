const express = require("express");
const mongoose = require("mongoose");
const Product = require("../models/Product");

const router = express.Router();

// CREATE: POST /api/products
router.post("/", async (req, res, next) => {
  try {
    const product = await Product.create(req.body);
    res.status(201).json(product);
  } catch (error) {
    next(error);
  }
});

// LOW-STOCK REPORT: GET /api/products/low-stock
router.get("/low-stock", async (req, res, next) => {
  try {
    const lowStockItems = await Product.find({
      $expr: { $lte: ["$quantity", "$reorderLevel"] }
    }).sort({ quantity: 1 });

    res.status(200).json({
      count: lowStockItems.length,
      lowStockItems
    });
  } catch (error) {
    next(error);
  }
});

// CATEGORY SUMMARY: GET /api/products/category-summary
router.get("/category-summary", async (req, res, next) => {
  try {
    const summary = await Product.aggregate([
      {
        $group: {
          _id: "$category",
          totalProducts: { $sum: 1 },
          totalQuantity: { $sum: "$quantity" },
          inventoryValue: {
            $sum: { $multiply: ["$price", "$quantity"] }
          }
        }
      },
      { $sort: { _id: 1 } },
      {
        $project: {
          _id: 0,
          category: "$_id",
          totalProducts: 1,
          totalQuantity: 1,
          inventoryValue: 1
        }
      }
    ]);

    res.status(200).json(summary);
  } catch (error) {
    next(error);
  }
});

// READ ALL with filtering, sorting and pagination:
// GET /api/products?category=Stationery&search=pen&page=1&limit=10&sort=price&order=asc
router.get("/", async (req, res, next) => {
  try {
    const {
      category,
      search,
      minPrice,
      maxPrice,
      page = 1,
      limit = 10,
      sort = "createdAt",
      order = "desc"
    } = req.query;

    const currentPage = Math.max(parseInt(page, 10) || 1, 1);
    const pageLimit = Math.min(Math.max(parseInt(limit, 10) || 10, 1), 100);

    const filter = {};

    if (category) {
      filter.category = { $regex: category, $options: "i" };
    }

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { sku: { $regex: search, $options: "i" } },
        { supplier: { $regex: search, $options: "i" } }
      ];
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      filter.price = {};
      if (minPrice !== undefined) filter.price.$gte = Number(minPrice);
      if (maxPrice !== undefined) filter.price.$lte = Number(maxPrice);
      if (Object.values(filter.price).some(Number.isNaN)) {
        return res.status(400).json({ message: "Price filters must be numbers" });
      }
    }

    const allowedSortFields = ["name", "price", "quantity", "category", "createdAt"];
    const sortField = allowedSortFields.includes(sort) ? sort : "createdAt";
    const sortOrder = order.toLowerCase() === "asc" ? 1 : -1;

    const [products, totalProducts] = await Promise.all([
      Product.find(filter)
        .sort({ [sortField]: sortOrder })
        .skip((currentPage - 1) * pageLimit)
        .limit(pageLimit),
      Product.countDocuments(filter)
    ]);

    res.status(200).json({
      totalProducts,
      currentPage,
      totalPages: Math.ceil(totalProducts / pageLimit),
      products
    });
  } catch (error) {
    next(error);
  }
});

// READ ONE: GET /api/products/:id
router.get("/:id", async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    res.status(200).json(product);
  } catch (error) {
    next(error);
  }
});

// UPDATE PRODUCT DETAILS: PUT /api/products/:id
router.put("/:id", async (req, res, next) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.status(200).json(product);
  } catch (error) {
    next(error);
  }
});

// RESTOCK: PATCH /api/products/:id/restock  body: { "quantity": 5 }
router.patch("/:id/restock", async (req, res, next) => {
  try {
    const amount = Number(req.body.quantity);
    if (!Number.isInteger(amount) || amount <= 0) {
      return res.status(400).json({ message: "Restock quantity must be a positive whole number" });
    }

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { $inc: { quantity: amount } },
      { new: true, runValidators: true }
    );

    if (!product) return res.status(404).json({ message: "Product not found" });
    res.status(200).json({ message: "Stock restocked successfully", product });
  } catch (error) {
    next(error);
  }
});

// SALE: PATCH /api/products/:id/sale  body: { "quantity": 2 }
router.patch("/:id/sale", async (req, res, next) => {
  try {
    const amount = Number(req.body.quantity);
    if (!Number.isInteger(amount) || amount <= 0) {
      return res.status(400).json({ message: "Sale quantity must be a positive whole number" });
    }

    const product = await Product.findOneAndUpdate(
      { _id: req.params.id, quantity: { $gte: amount } },
      { $inc: { quantity: -amount } },
      { new: true, runValidators: true }
    );

    if (!product) {
      const exists = await Product.exists({ _id: req.params.id });
      if (!exists) return res.status(404).json({ message: "Product not found" });
      return res.status(400).json({ message: "Insufficient stock for this sale" });
    }

    res.status(200).json({ message: "Sale recorded successfully", product });
  } catch (error) {
    next(error);
  }
});

// DELETE: DELETE /api/products/:id
router.delete("/:id", async (req, res, next) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    res.status(200).json({
      message: "Product deleted",
      id: product._id
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;

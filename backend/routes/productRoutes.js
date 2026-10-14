
const express = require("express");
const router = express.Router();

const Product = require("../models/Product");

// GET all products
router.get("/", async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    res.status(200).json(products);
  } catch (error) {
    console.error("Fetch products error:", error.message);
    res.status(500).json({ message: "Failed to fetch products" });
  }
});

// GET one product
router.get("/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.status(200).json(product);
  } catch (error) {
    res.status(400).json({ message: "Invalid product ID" });
  }
});

// CREATE product
router.post("/", async (req, res) => {
  try {
    const { name, description, price, category, image, images, stock } = req.body;

    if (!name || !description || price === undefined || !category) {
      return res.status(400).json({
        message: "Name, description, price, and category are required",
      });
    }

    const product = await Product.create({
      name,
      description,
      price,
      category,
      image,
      images,
      stock,
    });

    res.status(201).json({
      message: "Product created successfully",
      product,
    });
  } catch (error) {
    console.error("Create product error:", error.message);
    res.status(400).json({ message: error.message });
  }
});

// UPDATE product
router.put("/:id", async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.status(200).json({
      message: "Product updated successfully",
      product,
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// DELETE product
router.delete("/:id", async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.status(200).json({ message: "Product deleted successfully" });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;

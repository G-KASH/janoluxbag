
const express = require("express");
const router = express.Router();

router.post("/", (req, res) => {
  try {
    const { customer, paymentMethod, items } = req.body;

    if (
      !customer ||
      !customer.fullName ||
      !customer.phone ||
      !customer.county ||
      !customer.deliveryAddress
    ) {
      return res.status(400).json({
        success: false,
        message: "Please complete your name, phone, county and delivery address."
      });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Your cart is empty."
      });
    }

    if (!["cash_on_delivery", "mpesa"].includes(paymentMethod)) {
      return res.status(400).json({
        success: false,
        message: "Please select a valid payment method."
      });
    }

    let total = 0;

    for (const item of items) {
      const price = Number(item.price);
      const quantity = Number(item.quantity);

      if (
        !Number.isFinite(price) ||
        price < 0 ||
        !Number.isInteger(quantity) ||
        quantity < 1 ||
        !item.name
      ) {
        return res.status(400).json({
          success: false,
          message: "A product in your order has invalid details."
        });
      }

      total += price * quantity;
    }

    const orderReference = `JAN-${Date.now()}`;

    const order = {
      orderReference,
      customer,
      paymentMethod,
      items,
      total,
      status: "received",
      createdAt: new Date().toISOString()
    };

    // Temporary: display the order in the backend terminal.
    console.log("New JanoluxBag order received:", order);

    return res.status(201).json({
      success: true,
      message: "Your order was received successfully.",
      orderReference,
      total
    });
  } catch (error) {
    console.error("Order error:", error);

    return res.status(500).json({
      success: false,
      message: "The server could not process your order."
    });
  }
});

module.exports = router;

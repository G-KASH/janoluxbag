
const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    price: {
      type: Number,
      required: true,
      min: 0
    },
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    image: {
      type: String,
      default: ""
    }
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    orderReference: {
      type: String,
      required: true,
      unique: true
    },

    customer: {
      fullName: { type: String, required: true, trim: true },
      phone: { type: String, required: true, trim: true },
      email: { type: String, default: "", trim: true },
      county: { type: String, required: true, trim: true },
      deliveryAddress: { type: String, required: true, trim: true },
      deliveryNotes: { type: String, default: "" }
    },

    items: {
      type: [orderItemSchema],
      required: true,
      validate: {
        validator: items => items.length > 0,
        message: "An order must contain at least one product."
      }
    },

    total: {
      type: Number,
      required: true,
      min: 1
    },

    paymentMethod: {
      type: String,
      enum: ["cash_on_delivery", "mpesa"],
      required: true
    },

    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed"],
      default: "pending"
    },

    status: {
      type: String,
      enum: ["received", "processing", "shipped", "delivered", "cancelled"],
      default: "received"
    },

    mpesa: {
      checkoutRequestId: { type: String, default: "" },
      merchantRequestId: { type: String, default: "" },
      receiptNumber: { type: String, default: "" },
      resultDescription: { type: String, default: "" }
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Order", orderSchema);


const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

dotenv.config();

const connectDB = require("./config/db");
const productRoutes = require("./routes/productRoutes");
const mpesaRoutes = require("./routes/mpesaRoutes");

const app = express();

connectDB();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    message: "JanoluxBag API is running",
  });
});

app.use("/api/products", productRoutes);
app.use("/api/mpesa", mpesaRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`JanoluxBag server running on port ${PORT}`);
});

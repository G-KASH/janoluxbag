const express = require("express");

const router = express.Router();

router.get("/", (req, res) => {
  res.json({
    message: "Product API is working",
  });
});

module.exports = router;
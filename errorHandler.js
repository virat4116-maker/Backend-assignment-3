function errorHandler(error, req, res, next) {
  console.error(error);

  if (error.code === 11000) {
    return res.status(400).json({
      message: "A product with this SKU already exists"
    });
  }

  if (error.name === "ValidationError") {
    const messages = Object.values(error.errors).map((item) => item.message);
    return res.status(400).json({
      message: "Validation failed",
      errors: messages
    });
  }

  if (error.name === "CastError" || error instanceof require("mongoose").Error.CastError) {
    return res.status(400).json({ message: "Invalid product ID or data type" });
  }

  res.status(error.status || 500).json({
    message: error.message || "Internal server error"
  });
}

module.exports = errorHandler;

function errorHandler(error, req, res, next) {
  if (error.name === "ValidationError") {
    const errors = Object.values(error.errors).map((entry) => entry.message);
    return res.status(400).json({ message: "Validation failed", errors });
  }

  if (error.code === 11000) {
    const duplicateField = Object.keys(error.keyPattern || {})[0] || "field";
    return res.status(409).json({
      message: `Duplicate value for ${duplicateField}. This field must be unique.`
    });
  }

  if (error.name === "CastError") {
    return res.status(400).json({ message: "Invalid ID format" });
  }

  console.error(error);
  return res.status(500).json({ message: "Internal server error" });
}

module.exports = errorHandler;

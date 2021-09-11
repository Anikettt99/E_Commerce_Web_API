function errorHandler(err, req, res, next) {
  if (err) {
    return res.status(500).json({ message: err.name });
  }

  return res.status(500).json({ message: "Unknown error" });
}

module.exports = errorHandler;

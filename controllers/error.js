exports.notFound = (req, res, next) => {
  const error = new Error("Not found");
  error.statusCode = 404;
  next(error);
};

exports.errorHandler = (error, req, res, next) => {
  console.log(error);
  res.status(error.statusCode || 500).json({
    error: {
      message: error.message,
      details: error.details,
    },
  });
};

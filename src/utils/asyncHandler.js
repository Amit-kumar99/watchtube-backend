const asyncHandler = (fxn) => {
  return (req, res, next) => {
    Promise.resolve(fxn(req, res, next)).catch((err) => next(err));
  }
}

module.exports = {
  asyncHandler,
}
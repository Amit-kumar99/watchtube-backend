const { asyncHandler } = require("../utils/asyncHandler");

const registerUser = asyncHandler( async (req, res) => {
  res.json({ message: "ok" })
})

module.exports = {
  registerUser,
}
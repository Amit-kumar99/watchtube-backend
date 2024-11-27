const { asyncHandler } = require("../utils/asyncHandler");
const { ApiResponse } = require("../utils/ApiResponse");

const getHealthCheck = asyncHandler(async (req, res) => {
res.json(new ApiResponse(200, {}, "Backend server is healthy & available."));
});

module.exports = {
  getHealthCheck
}
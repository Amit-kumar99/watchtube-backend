require("dotenv").config();
const { asyncHandler } = require("../utils/asyncHandler");
const jwt = require("jsonwebtoken");
const { User } = require("../models/user.model");
const { ApiError } = require("../utils/ApiError");

const authenticateJwt = asyncHandler(async (req, _, next) => {
  try {
    if (!(req?.cookies || req?.headers)) {
      throw new ApiError(401, "Unauthorized request");
    }
    const token =
      req.cookies?.accessToken || req.headers?.authorization?.split(" ")[1];
    if (!token) {
      new ApiError(401, "Unauthorized request");
    }
    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    const userId = decodedToken?._id;
    const user = await User.findById(userId).select("-password -refreshToken -watchHistory");
    if (!user) {
      throw new ApiError("User not found");
    }
    req.user = user;
    next();
  } catch (error) {
    throw new ApiError(401, "Invalid token, unauthorized");
  }
});

module.exports = {
  authenticateJwt,
};

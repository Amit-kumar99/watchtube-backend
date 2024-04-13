const { asyncHandler } = require("../utils/asyncHandler");
const User = require("../models/user.model");
const { hashPassword } = require("../helpers/bcryptHelper");
const { uploadOnCloudinary } = require("../utils/cloudinary");
const { ApiResponse } = require("../utils/ApiResponse");
const { ApiError } = require("../utils/ApiError");

const registerUser = asyncHandler(async (req, res) => {
  const { fullName, username, email, password } = req.body;

  if (
    fullName.trim() === "" ||
    username.trim() === "" ||
    email.trim() === "" ||
    password.trim() === ""
  ) {
    throw new ApiError(401, "All fields are required");
  }
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new ApiError(401, "User already exists");
  }
  const existingUsername = await User.findOne({ username });
  if (existingUsername) {
    throw new ApiError(401, "Username already exists");
  }
  const avatarLocalPath = req.files?.avatar[0]?.path;
  let coverImageLocalPath;
  if (
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0
  ) {
    coverImageLocalPath = req.files.coverImage[0].path;
  }
  if (!avatarLocalPath) {
    throw new ApiError(401, "Avatar image is required");
  }
  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);
  const hashedPassword = await hashPassword(password);
  const user = await User.create({
    ...req.body,
    username: username.toLowerCase(),
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    password: hashedPassword,
  });
  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );
  if (!createdUser) {
    throw new ApiError(401, "Something went wrong while registering the user");
  }
  return res.json(
    new ApiResponse(200, createdUser, "user signed up successfully")
  );
});

module.exports = {
  registerUser,
};

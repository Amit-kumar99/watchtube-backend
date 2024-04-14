const { asyncHandler } = require("../utils/asyncHandler");
const User = require("../models/user.model");
const { hashPassword, verifyPassword } = require("../helpers/bcryptHelper");
const { uploadOnCloudinary } = require("../utils/cloudinary");
const { ApiResponse } = require("../utils/ApiResponse");
const { ApiError } = require("../utils/ApiError");
const generateAccessAndRefreshTokens = require("../helpers/jwtHelper");

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
  if (Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
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

const loginUser = asyncHandler(async (req, res) => {
  const { username, email, password } = req.body;
  if (!(username || email)) {
    throw new ApiError(401, "Username or Email is required");
  }
  const user = await User.findOne({
    $or: [{ username }, { email }],
  });
  if (!user) {
    throw new ApiError(401, "No such username or email exists");
  }
  const isCorrectPassword = await verifyPassword(password, user.password);
  if (!isCorrectPassword) {
    throw new ApiError(401, "Wrong password");
  }
  const userId = user._id;
  const { accessToken, refreshToken } =
    await generateAccessAndRefreshTokens(userId);
  const loggedInUser = await User.findById(userId).select(
    "-password -refreshToken"
  );
  const options = {
    httpOnly: true,
    secure: true,
  };
  return res
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
        "User logged in successfully"
      )
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  await User.findByIdAndUpdate(userId, {
    $unset: {
      refreshToken: 1,
    },
  });
  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "user logged out"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies.refreshToken ||
    req.headers.authorization.split(" ")[1].refreshToken;
  if (!incomingRefreshToken) {
    throw new ApiError(401, "unauthorized request");
  }
  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );
    const user = await User.findById(decodedToken?._id);
    if (!user) {
      throw new ApiError(401, "Invalid refresh token");
    }
    if (incomingRefreshToken !== user?.refreshToken) {
      throw new ApiError(401, "Refresh token is expired or used");
    }
    const { accessToken, refreshToken } =
    await generateAccessAndRefreshTokens(user._id);
    const options = {
      httpOnly: true,
      secure: true,
    };
    return res
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", refreshToken, options)
      .json(
        new ApiResponse(
          200,
          { accessToken, refreshToken },
          "Access token refreshed"
        )
      );
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid refresh token");
  }
});

module.exports = {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
};

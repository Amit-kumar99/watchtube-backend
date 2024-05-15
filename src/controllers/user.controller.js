const { asyncHandler } = require("../utils/asyncHandler");
const { User } = require("../models/user.model");
const { hashPassword, verifyPassword } = require("../helpers/bcryptHelper");
const {
  uploadOnCloudinary,
  deleteOnCloudinary,
} = require("../utils/cloudinary");
const { ApiResponse } = require("../utils/ApiResponse");
const { ApiError } = require("../utils/ApiError");
const generateAccessAndRefreshTokens = require("../helpers/jwtHelper");
const jwt = require("jsonwebtoken");
const { mongoose } = require("mongoose");
const {
  extractPublicIdFromUrl,
  extractResourceType,
} = require("../helpers/cloudinaryHelper");

const registerUser = asyncHandler(async (req, res) => {
  const { fullName, username, email, password } = req.body;

  if (
    !fullName?.trim() ||
    !username?.trim() ||
    !email?.trim() ||
    !password?.trim()
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

  try {
    const user = await User.create({
      ...req.body,
      username: username.toLowerCase(),
      avatar: avatar?.url,
      coverImage: coverImage?.url || "",
      password: hashedPassword,
    }).select("-password -refreshToken");

    return res.json(new ApiResponse(200, user, "user signed up successfully"));
  } catch (error) {
    if (avatar) {
      await deleteOnCloudinary(avatar.public_id, avatar.resource_type);
    }
    if (coverImage) {
      await deleteOnCloudinary(coverImage.public_id, coverImage.resource_type);
    }
    throw new ApiError(501, error.message);
  }
});

const loginUser = asyncHandler(async (req, res) => {
  const { username, email, password } = req.body;

  if (!(username?.trim() || email?.trim())) {
    throw new ApiError(404, "Username or Email is required");
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

  try {
    const loggedInUser = await User.findById(userId).select(
      "-password -refreshToken"
    );

    const options = {
      httpOnly: true,
      sameSite: "None",
      secure: true,
      path: "/",
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
  } catch (error) {
    throw new ApiError(501, error.message);
  }
});

const logoutUser = asyncHandler(async (req, res) => {
  const userId = req.user?._id;
  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(404, "userId required");
  }
  try {
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
  } catch (error) {
    throw new ApiError(501, error.message);
  }
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies?.refreshToken ||
    req.headers?.authorization?.split(" ")[1]?.refreshToken;
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

    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
      user._id
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
          { accessToken, refreshToken },
          "Access token refreshed"
        )
      );
  } catch (error) {
    throw new ApiError(401, error.message);
  }
});

const changeCurrentPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  const user = await User.findById(req.user?._id);
  if (!user) {
    throw new ApiError(404, "invalid userId");
  }

  const isCorrectPassword = await verifyPassword(oldPassword, user.password);
  if (!isCorrectPassword) {
    throw new ApiError(401, "Invalid password");
  }

  user.password = await hashPassword(newPassword);
  await user.save({ validateBeforeSave: false });

  return res.json(new ApiResponse(200, {}, "Password changed successfully"));
});

const getCurrentUser = asyncHandler(async (req, res) => {
  return res.json(new ApiResponse(200, req.user, "Current user fetched"));
});

const updateAccountDetails = asyncHandler(async (req, res) => {
  const { fullName, email } = req.body;
  if (!fullName?.trim() || !email?.trim()) {
    throw new ApiError(401, "All fields are required");
  }

  try {
    const user = await User.findByIdAndUpdate(
      req.user?._id,
      {
        $set: {
          fullName,
          email,
        },
      },
      { new: true }
    ).select("-password -refreshToken");

    res.json(
      new ApiResponse(200, user, "Account details updated successfully")
    );
  } catch (error) {
    throw new ApiError(501, error.message);
  }
});

const updateUserAvatar = asyncHandler(async (req, res) => {
  const avatarLocalPath = req.file?.path;
  if (!avatarLocalPath) {
    throw new ApiError(401, "Avatar file is missing");
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath);
  if (!avatar?.url) {
    throw new ApiError(401, "Error while uploading avatar file");
  }

  const oldAvatarUrl = await User.findById(req.user._id).avatar;

  try {
    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        $set: {
          avatar: avatar?.url,
        },
      },
      { new: true }
    ).select("-password -refreshToken");

    //delete previous avatar file on cloudinary after successful upload of new avatar
    const publicId = extractPublicIdFromUrl(oldAvatarUrl);
    const resourceType = extractResourceType(oldAvatarUrl);
    await deleteOnCloudinary(publicId, resourceType);

    res.json(new ApiResponse(200, user, "Avatar updated successfully"));
  } catch (error) {
    throw new ApiError(401, error.message);
  }
});

const updateUserCoverImage = asyncHandler(async (req, res) => {
  const coverImageLocalPath = req.file?.path;
  if (!coverImageLocalPath) {
    throw new ApiError(401, "Cover image file is missing");
  }

  const coverImage = await uploadOnCloudinary(coverImageLocalPath);
  if (!coverImage?.url) {
    throw new ApiError(401, "Error while uploading cover image file");
  }

  const oldCoverImageUrl = await User.findById(req.user._id).coverImage;

  try {
    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        $set: {
          coverImage: coverImage.url,
        },
      },
      { new: true }
    ).select("-password -refreshToken");

    //delete previous coverImage file on cloudinary after successful upload of new coverImage
    const publicId = extractPublicIdFromUrl(oldCoverImageUrl);
    const resourceType = extractResourceType(oldCoverImageUrl);
    await deleteOnCloudinary(publicId, resourceType);

    res.json(new ApiResponse(200, user, "Avatar updated successfully"));
  } catch (error) {
    throw new ApiError(401, error.message);
  }
});

const getUserChannelProfile = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  if (!userId?.trim()) {
    throw new ApiError(401, "userId required");
  }

  try {
    const channelProfile = await User.aggregate([
      {
        $match: {
          _id: new mongoose.Types.ObjectId(userId),
        },
      },
      {
        $lookup: {
          from: "subscriptions",
          localField: "_id",
          foreignField: "channel",
          as: "subscribers",
        },
      },
      {
        $lookup: {
          from: "subscriptions",
          localField: "_id",
          foreignField: "subscriber",
          as: "subscribedTo",
        },
      },
      {
        $lookup: {
          from: "videos",
          localField: "_id",
          foreignField: "owner",
          as: "owner",
        },
      },
      {
        $addFields: {
          subscribersCount: {
            $size: "$subscribers",
          },
          subscribedToCount: {
            $size: "$subscribedTo",
          },
          isSubscribed: {
            $cond: {
              if: { $in: [req.user?._id, "$subscribers.subscriber"] },
              then: true,
              else: false,
            },
          },
          videosCount: {
            $size: "$owner",
          },
        },
      },
      {
        $project: {
          fullName: 1,
          username: 1,
          subscribersCount: 1,
          subscribedToCount: 1,
          isSubscribed: {
            $cond: {
              if: { $eq: ["$userId", req.user?._id] },
              then: "$$REMOVE",
              else: "$isSubscribed",
            },
          },
          videosCount: 1,
          avatar: 1,
          coverImage: 1,
        },
      },
    ]);

    res.json(
      new ApiResponse(
        200,
        channelProfile[0],
        "User channel fetched successfully"
      )
    );
  } catch (error) {
    throw new ApiError(501, error.message);
  }
});

const getWatchHistory = asyncHandler(async (req, res) => {
  try {
    const watchHistory = await User.aggregate([
      {
        $match: {
          _id: req.user._id,
        },
      },
      {
        $lookup: {
          from: "videos",
          localField: "watchHistory",
          foreignField: "_id",
          as: "videos",
          pipeline: [
            {
              $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner",
                pipeline: [
                  {
                    $project: {
                      username: 1,
                    },
                  },
                ],
              },
            },
          ],
        },
      },
      {
        $project: {
          _id: 1,
          videos: 1,
        },
      },
    ]);

    res.json(
      new ApiResponse(
        200,
        watchHistory[0],
        "Watch history fetched successfully"
      )
    );
  } catch (error) {
    throw new ApiError(501, error.message);
  }
});

module.exports = {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentUser,
  updateAccountDetails,
  updateUserAvatar,
  updateUserCoverImage,
  getUserChannelProfile,
  getWatchHistory,
};

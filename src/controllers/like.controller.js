const { asyncHandler } = require("../utils/asyncHandler");
const { Like } = require("../models/like.model");
const { ApiResponse } = require("../utils/ApiResponse");
const { ApiError } = require("../utils/ApiError");

const toggleVideoLike = asyncHandler(async () => {
  const { videoId } = req.params;
  if (!videoId) {
    throw new ApiError(401, "videoId is required");
  }
  try {
    const existingLike = await Like.find({ video: videoId });
    if (!existingLike) {
      await Like.create({
        video: videoId,
        likedBy: req.user?._id,
      });
      res.json(new ApiResponse(200, {}, "video liked"));
    }
    await Like.deleteById(existingLike._id);
    res.json(new ApiResponse(200, {}, "video unliked"));
  } catch (error) {
    throw new ApiError(401, error.message);
  }
});

const toggleCommentLike = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  if (!commentId) {
    throw new ApiError(401, "commentId is required");
  }
  try {
    const existingLike = await Like.find({ comment: commentId });
    if (!existingLike) {
      await Like.create({
        comment: commentId,
        likedBy: req.user._id,
      });
      res.json(200, {}, "comment liked");
    }
    await Like.deleteById(existingLike._id);
    res.json(new ApiResponse(200, {}, "comment unliked"));
  } catch (error) {
    throw new ApiError(401, error.message);
  }
});

const toggleTweetLike = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;
  if (!tweetId) {
    throw new ApiError(401, "tweetId is required");
  }
  try {
    const existingLike = await Like.find({ tweet: tweetId });
    if (!existingLike) {
      await Like.create({
        tweet: tweetId,
        likedBy: req.user._id,
      });
      res.json(200, {}, "tweet liked");
    }
    await Like.deleteById(existingLike._id);
    res.json(new ApiResponse(200, {}, "tweet unliked"));
  } catch (error) {
    throw new ApiError(401, error.message);
  }
});

const getAllLikedVideos = asyncHandler(async (req, res) => {
  try {
    const likedVideos = await Like.aggregate([
      {
        $match: {
          likedBy: req.user._id,
          video: { $exists: true },
        },
      },
      {
        $lookup: {
          from: "video",
          localField: "video",
          foreignField: "_id",
          as: "likedVideos",
          pipeline: [
            {
              $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "videoOwners",
                pipeline: [
                  {
                    $project: {
                      fullName: 1,
                      username: 1,
                      avatar: 1,
                    },
                  },
                ],
              },
            },
          ],
        },
      },
    ]);
    res.json(new ApiResponse(200, likedVideos, "liked videos fetched"));
  } catch (error) {
    throw new ApiError(401, error.message);
  }
});

module.exports = {
  toggleVideoLike,
  toggleCommentLike,
  toggleTweetLike,
  getAllLikedVideos,
};

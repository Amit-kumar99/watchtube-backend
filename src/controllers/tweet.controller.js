const { asyncHandler } = require("../utils/asyncHandler");
const { Tweet } = require("../models/tweet.model");
const { ApiResponse } = require("../utils/ApiResponse");
const { ApiError } = require("../utils/ApiError");
const { mongoose } = require("mongoose");

const createTweet = asyncHandler(async (req, res) => {
  const { channelId } = req.params;
  if (!channelId?.trim()) {
    throw new ApiError("channelId is required");
  }
  if (channelId !== req.user._id.toString()) {
    throw new ApiError(
      401,
      "You are not authorized to create tweet in this channel"
    );
  }
  const { content } = req.body;
  if (!content?.trim()) {
    throw new ApiError(401, "content is required");
  }
  try {
    const tweet = await Tweet.create({
      content,
      tweetedBy: req.user._id,
    });
    res.json(new ApiResponse(200, tweet, "tweet created"));
  } catch (error) {
    throw new ApiError(401, error.message);
  }
});

const getAllTweets = asyncHandler(async (req, res) => {
  const { channelId } = req.params;
  if (!channelId?.trim()) {
    throw new ApiError("channelId is required");
  }
  try {
    const tweets = await Tweet.aggregate([
      {
        $match: {
          tweetedBy: new mongoose.Types.ObjectId(channelId),
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "tweetedBy",
          foreignField: "_id",
          as: "owner",
          pipeline: [
            {
              $project: {
                username: 1,
                avatar: 1,
              },
            },
          ],
        },
      },
      {
        $lookup: {
          from: "likes",
          localField: "_id",
          foreignField: "tweet",
          as: "likes",
        },
      },
      {
        $addFields: {
          likesCount: {
            $size: "$likes",
          },
          isLiked: {
            $cond: {
              if: { $in: [req.user?._id, "$likes.likedBy"] },
              then: true,
              else: false,
            },
          },
        },
      },
      {
        $project: {
          _id: 1,
          content: 1,
          createdAt: 1,
          likesCount: 1,
          isLiked: 1,
          owner: 1,
        },
      },
    ]);
    res.json(
      new ApiResponse(
        200,
        tweets,
        "Tweets along with likes fetched successfully"
      )
    );
  } catch (error) {
    throw new ApiError(401, error.message);
  }
});

const updateTweet = asyncHandler(async (req, res) => {
  const { channelId, tweetId } = req.params;
  const { content } = req.body;
  if (!channelId?.trim()) {
    throw new ApiError("channelId is required");
  }
  if (channelId !== req.user._id.toString()) {
    throw new ApiError(401, "You are not authorized to create tweet here");
  }
  if (!tweetId?.trim()) {
    throw new ApiError(401, "tweetId is required");
  }
  if (!content?.trim()) {
    throw new ApiError(401, "content is required");
  }
  const tweet = await Tweet.findById(tweetId);
  if (!tweet) {
    throw new ApiError(401, "Invalid tweetId");
  }
  try {
    const tweet = await Tweet.findByIdAndUpdate(
      tweetId,
      {
        $set: {
          content,
        },
      },
      { new: true }
    );
    res.send(new ApiResponse(200, tweet, "tweet updated successfully"));
  } catch (error) {
    throw new ApiError(401, error.message);
  }
});

const deleteTweet = asyncHandler(async (req, res) => {
  const { channelId, tweetId } = req.params;
  if (!channelId?.trim()) {
    throw new ApiError("channelId is required");
  }
  if (channelId !== req.user._id.toString()) {
    throw new ApiError(
      401,
      "You are not authorized to delete tweet in this channel"
    );
  }
  if (!tweetId?.trim()) {
    throw new ApiError(401, "tweetId is required");
  }
  const tweet = await Tweet.findById(tweetId);
  if (!tweet) {
    throw new ApiError(401, "Invalid tweetId");
  }
  try {
    await Tweet.deleteOne({ _id: tweetId });
    res.json(new ApiResponse(200, {}, "tweet deleted successfully"));
  } catch (error) {
    throw new ApiError(401, error.message);
  }
});

module.exports = {
  createTweet,
  getAllTweets,
  updateTweet,
  deleteTweet,
};

const { asyncHandler } = require("asyncHandler");
const { Tweet } = require("../models/tweet.model");
const { ApiResponse } = require("../utils/ApiResponse");
const { ApiError } = require("../utils/ApiError");

const createTweet = asyncHandler(async () => {
  const { userId } = req.params;
  if (!userId?.trim()) {
    throw new ApiError("userId is required");
  }
  if (userId !== req.user._id) {
    throw new ApiError(401, "You are not authorized to create tweet here");
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

const getAllTweets = asyncHandler(async () => {
  const { userId } = req.params;
  if (!userId?.trim()) {
    throw new ApiError("userId is required");
  }
  try {
    const tweets = await Tweet.aggregate([
      {
        $match: {
          tweetedBy: new mongoose.Schema.Types.ObjectId(userId),
        },
      },
      {
        $lookup: {
          from: "user",
          localField: "tweetedBy",
          foreignField: "_id",
          as: "owners",
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
        },
      },
      {
        $project: {
          _id: 1,
          tweetCreatedAt: "$createdAt",
          username: 1,
          avatar: 1,
          likesCount: 1,
        },
      },
    ]);
    res.json(
      new ApiResponse(
        200,
        tweets[0],
        "Tweets along with likes fetched successfully"
      )
    );
  } catch (error) {
    throw new ApiError(401, error.message);
  }
});

const updateTweet = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  if (!userId?.trim()) {
    throw new ApiError("userId is required");
  }
  if (userId !== req.user._id) {
    throw new ApiError(401, "You are not authorized to create tweet here");
  }
  const { tweetId } = req.params;
  if (!tweetId?.trim()) {
    throw new ApiError(401, "tweetId is required");
  }
  const { content } = req.body;
  if (!content?.trim()) {
    throw new ApiError(401, "content is required");
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
    res.send(200, tweet, "tweet updated successfully");
  } catch (error) {
    throw new ApiError(401, error.message);
  }
});

const deleteTweet = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  if (!userId?.trim()) {
    throw new ApiError("userId is required");
  }
  if (userId !== req.user._id) {
    throw new ApiError(401, "You are not authorized to create tweet here");
  }
  const { tweetId } = req.params;
  if (!tweetId?.trim()) {
    throw new ApiError(401, "tweetId is required");
  }
  try {
    await Tweet.deleteOne({ _id: tweetId });
    res.send(200, {}, "tweet updated successfully");
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

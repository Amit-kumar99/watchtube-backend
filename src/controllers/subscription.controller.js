const { Subscription } = require("../models/subscription.model");
const { asyncHandler } = require("../utils/asyncHandler");
const { ApiError } = require("../utils/ApiError");
const { ApiResponse } = require("../utils/ApiResponse");
const { User } = require("../models/user.model");
const { mongoose } = require("mongoose");

const toggleSubscription = asyncHandler(async (req, res) => {
  const { channelId } = req.params;
  if (!channelId?.trim()) {
    throw new ApiError(401, "channelId is required");
  }
  if (channelId === req.user._id) {
    throw new ApiError(401, "You can't subscriber to your own channel");
  }
  const channel = await User.findOne({ _id: channelId });
  if (!channel) {
    throw new ApiError(401, "Invalid channelId");
  }
  try {
    const existingSubscription = await Subscription.find({
      subscriber: req.user._id,
      channel: channelId,
    });
    if (existingSubscription.length === 0) {
      const newSubscription = await Subscription.create({
        subscriber: req.user?._id,
        channel: channelId,
      });
      return res.json(
        new ApiResponse(200, newSubscription, "Subscribed successfully")
      );
    }
    await Subscription.findByIdAndDelete(existingSubscription[0]._id);
    res.json(new ApiResponse(200, {}, "Unsubscribed successfully"));
  } catch (error) {
    throw new ApiError(401, error.message);
  }
});

const getAllSubscribedToChannels = asyncHandler(async (req, res) => {
  const subscriberId = req.user?._id;
  try {
    const subscribedToChannels = await Subscription.aggregate([
      {
        $match: {
          subscriber: subscriberId,
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "channel",
          foreignField: "_id",
          as: "channels",
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
        $project: {
          _id: 1,
          channels: 1,
        },
      },
    ]);
    res.json(
      new ApiResponse(
        200,
        subscribedToChannels,
        "All subscribed channels fetched"
      )
    );
  } catch (error) {
    throw new ApiError(401, error.message);
  }
});

const getUserSubscribedChannels = asyncHandler(async (req, res) => {
  const channelId = req.user._id;
  try {
    const subscribers = await Subscription.aggregate([
      {
        $match: {
          channel: channelId,
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "subscriber",
          foreignField: "_id",
          as: "subscribers",
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
        $project: {
          _id: 1,
          subscribers: 1,
        },
      },
    ]);
    res.json(new ApiResponse(200, subscribers, "subscribers fetched"));
  } catch (error) {
    throw new ApiError(401, error.message);
  }
});

module.exports = {
  toggleSubscription,
  getAllSubscribedToChannels,
  getUserSubscribedChannels,
};

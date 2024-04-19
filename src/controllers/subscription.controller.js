const { Subscription } = require("../models/subscription.model");
const { asyncHandler } = require("../utils/asyncHandler");
const { ApiError } = require("../utils/ApiError");
const { ApiResponse } = require("../utils/ApiResponse");

const toggleSubscription = asyncHandler(async (req, res) => {
  const { channelId } = req.params;
  if (!channelId?.trim()) {
    throw new ApiError(401, "ChannelId is required");
  } /* The `channel` field in the `subscriptionSchema` is defining a reference to another document in
  the database. */

  const channel = await UserActivation.findOne({ _id: channelId });
  if (!channel) {
    throw new ApiError(401, "Invalid channelId");
  }
  try {
    const existingSubscription = await Subscription.find({
      subscriber: req.user._id,
      channel: channelId,
    });
    if (!existingSubscription) {
      const newSubscription = await Subscription.create({
        subscriber: req.user?._id,
        channel: channelId,
      });
      res.json(
        new ApiResponse(200, newSubscription, "Subscribed successfully")
      );
    }
    await Subscription.findByIdAndDelete(existingSubscription._id);
    res.json(new ApiResponse(200, {}, "Unsubscribed successfully"));
  } catch (error) {
    throw new ApiError(
      401,
      error.message || "Error while subscribing or unsubscribing"
    );
  }
});

const getAllSubscribedToChannels = asyncHandler(async (req, res) => {
  try {
    const { subscriberId } = req.params;
    if (!subscriberId?.trim()) {
      throw new ApiError(401, "subscriberId is required");
    }
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
        },
      },
      {
        $project: {
          username: 1,
          avatar: 1,
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
  const { channelId } = req.params;
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
        },
      },
      {
        $project: {
          username: 1,
          avatar: 1,
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

const { ApiError } = require("../utils/ApiError");
const { ApiResponse } = require("../utils/ApiResponse");
const { uploadOnCloudinary } = require("../utils/cloudinary");
const { asyncHandler } = require("../utils/asyncHandler");
const { Video } = require("../models/video.model");
const { User } = require("../models/user.model");
const { mongoose } = require("mongoose");

const getAllVideos = asyncHandler(async (req, res) => {
  const page = req.query?.page || 1;
  const limit = req.query?.limit || 10;

  const options = {
    page,
    limit,
  };

  try {
    const videos = Video.aggregate([
      {
        $lookup: {
          from: "users",
          localField: "owner",
          foreignField: "_id",
          as: "owner",
          pipeline: [
            {
              $project: {
                avatar: 1,
                username: 1,
              },
            },
          ],
        },
      },
    ]);
    const paginatedVideos = await Video.aggregatePaginate(videos, options);

    res.json(
      new ApiResponse(
        200,
        {
          currentPage: paginatedVideos.page,
          totalPages: paginatedVideos.totalPages,
          videos: paginatedVideos.docs,
          hasNextPage: paginatedVideos.hasNextPage,
          hasPrevPage: paginatedVideos.hasPrevPage,
        },
        "all videos fetched"
      )
    );
  } catch (error) {
    throw new ApiError(501, error.message);
  }
});

const getAllVideosByUserId = asyncHandler(async (req, res) => {
  const page = req.query?.page || 1;
  const limit = req.query?.limit || 10;
  const { userId } = req.params;

  const options = {
    page,
    limit,
  };

  try {
    const aggregatedVideos = Video.aggregate([
      {
        $match: {
          owner: new mongoose.Types.ObjectId(userId),
        },
      },
      {
        $project: {
          _id: 1,
          thumbnail: 1,
          duration: 1,
          title: 1,
          views: 1,
          createdAt: 1,
        },
      },
    ]);
    const paginatedVideos = await Video.aggregatePaginate(
      aggregatedVideos,
      options
    );
    res.json(
      new ApiResponse(
        200,
        {
          currentPage: paginatedVideos.page,
          totalPages: paginatedVideos.totalPages,
          videos: paginatedVideos.docs,
          hasNextPage: paginatedVideos.hasNextPage,
          hasPrevPage: paginatedVideos.hasPrevPage,
        },
        "Videos fetched successfully"
      )
    );
  } catch (error) {
    throw new ApiError(401, error.message);
  }
});

const uploadVideo = asyncHandler(async (req, res) => {
  const { title } = req.body;
  if (!title) {
    throw new ApiError(401, "title is required");
  }
  const videoLocalPath = req.files?.video[0].path;
  const thumbnailLocalPath = req.files?.thumbnail[0].path;
  if (!videoLocalPath) {
    throw new ApiError(400, "video file not found");
  }
  if (!thumbnailLocalPath) {
    throw new ApiError(400, "thumbnail file not found");
  }
  try {
    const video = await uploadOnCloudinary(videoLocalPath);
    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);
    const newVideo = await Video.create({
      ...req.body,
      thumbnail: thumbnail?.url,
      videoFile: video?.url,
      duration: video?.duration,
      owner: req.user._id,
    });
    res.json(new ApiResponse(200, newVideo, "Video uploaded successfully"));
  } catch (error) {
    throw new ApiError(
      501,
      error.message ||
        "Something went wrong in MongoDB while uploading the video"
    );
  }
});

const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  if (!videoId) {
    throw new ApiError(401, "videoId is required");
  }
  try {
    const video = await Video.aggregate([
      {
        $match: {
          _id: new mongoose.Types.ObjectId(videoId),
        },
      },
      {
        $lookup: {
          from: "subscriptions",
          localField: "owner",
          foreignField: "channel",
          as: "subscribers",
        },
      },
      {
        $lookup: {
          from: "likes",
          localField: "_id",
          foreignField: "video",
          as: "likes",
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "owner",
          foreignField: "_id",
          as: "owner",
          pipeline: [
            {
              $project: {
                avatar: 1,
                username: 1,
              },
            },
          ],
        },
      },
      {
        $addFields: {
          subscribersCount: {
            $size: "$subscribers",
          },
          likesCount: {
            $size: "$likes",
          },
          isSubscribed: {
            $cond: {
              if: { $in: [req.user?._id, "$subscribers.subscriber"] },
              then: true,
              else: false,
            },
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
          videoFile: 1,
          title: 1,
          description: 1,
          duration: 1,
          views: 1,
          createdAt: 1,
          owner: 1,
          subscribersCount: 1,
          likesCount: 1,
          isSubscribed: 1,
          subscribers: 1,
          isLiked: 1,
        },
      },
    ]);
    //can be put in messaging queue, not so critical task
    await Video.findByIdAndUpdate(
      videoId,
      {
        $inc: {
          views: 1,
        },
      },
      { new: true }
    );
    await User.findByIdAndUpdate(req.user._id, {
      $push: {
        watchHistory: videoId,
      },
    });
    res.json(new ApiResponse(200, video[0], "Video fetched"));
  } catch (error) {
    throw new ApiError(401, error.message);
  }
});

const updateVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const { title, description } = req.body;
  if (!videoId) {
    throw new ApiError(401, "videoId is required");
  }
  if (!title?.trim()) {
    throw new ApiError(401, "title is required");
  }
  const thumbnailLocalPath = req.file?.path;
  if (!thumbnailLocalPath) {
    throw new ApiError(401, "thumbnail local path is required");
  }
  const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);
  try {
    const updatedVideo = await Video.findByIdAndUpdate(
      videoId,
      {
        $set: {
          title,
          description,
          thumbnail: thumbnail?.url,
        },
      },
      { new: true }
    );
    res.json(new ApiResponse(200, updatedVideo, "Video updated successfully"));
  } catch (error) {
    throw new ApiError(401, error.message || "Invalid videoId");
  }
});

const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  if (!videoId) {
    throw new ApiError(401, "videoId is required");
  }
  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(401, "Invalid videoId");
  }
  try {
    await Video.deleteOne({
      _id: videoId,
    });
    res.json(new ApiResponse(200, {}, "Video deleted successfully"));
  } catch (error) {
    throw new ApiError(401, error.message);
  }
});

const togglePublishStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  if (!videoId) {
    throw new ApiError(401, "videoId is required");
  }
  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(401, "invalid videoId");
  }
  const isPublished = !video.isPublished;
  console.log(isPublished);
  try {
    const video = await Video.findByIdAndUpdate(
      videoId,
      {
        $set: {
          isPublished,
        },
      },
      { new: true }
    );
    res.json(new ApiResponse(200, video, "Video publish status updated"));
  } catch (error) {
    throw new ApiError(401, error.message || "Invalid videoId");
  }
});

module.exports = {
  getAllVideos,
  getAllVideosByUserId,
  uploadVideo,
  getVideoById,
  updateVideo,
  deleteVideo,
  togglePublishStatus,
};

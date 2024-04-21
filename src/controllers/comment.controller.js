const { asyncHandler } = require("../utils/asyncHandler");
const { Comment } = require("../models/comment.model");
const { ApiResponse } = require("../utils/ApiResponse");
const { ApiError } = require("../utils/ApiError");
const { mongoose } = require("mongoose");
const { Video } = require("../models/video.model");

const getAllComments = asyncHandler(async (req, res) => {
  try {
    const comments = await Comment.find({ owner: req.user?._id }).populate({
      path: "video",
      select: "thumbnail title",
    });
    res.json(new ApiResponse(200, comments, "comments fetched"));
  } catch (error) {
    throw new ApiError(401, error.message);
  }
});

const getVideoComments = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  if (!videoId?.trim()) {
    throw new ApiError(401, "videoId is required");
  }
  const page = req.query.page || 1;
  const limit = req.query.limit || 10;
  const options = {
    page,
    limit,
  };
  try {
    const aggregateComments = Comment.aggregate([
      {
        $match: {
          video: new mongoose.Types.ObjectId(videoId),
        },
      },
      {
        $lookup: {
          from: "likes",
          localField: "_id",
          foreignField: "comment",
          as: "commentLikes",
        },
      },
      {
        $addFields: {
          likesCount: {
            $size: "$commentLikes",
          },
        },
      },
      {
        $project: {
          _id: 1,
          content: 1,
          likesCount: 1,
        },
      },
    ]);

    const paginatedComments = await Comment.aggregatePaginate(
      aggregateComments,
      options
    );

    res.json(
      new ApiResponse(
        200,
        {
          currentPage: paginatedComments.page,
          totalPages: paginatedComments.totalPages,
          comments: paginatedComments.docs,
          hasNextPage: paginatedComments.hasNextPage,
          hasPrevPage: paginatedComments.hasPrevPage,
        },
        "All video comments along with likes fetched"
      )
    );
  } catch (error) {
    throw new ApiError(401, error.message);
  }
});

const addVideoComment = asyncHandler(async (req, res) => {
  const { content } = req.body;
  if (!content?.trim()) {
    throw new ApiError(401, "content is required");
  }
  const { videoId } = req.params;
  if (!videoId?.trim()) {
    throw new ApiError(401, "videoId is required");
  }
  try {
    const comment = await Comment.create({
      content,
      video: videoId,
      owner: req.user._id,
    });
    res.send(new ApiResponse(200, comment, "commented on video successfully"));
  } catch (error) {
    throw new ApiError(401, error.message);
  }
});

const deleteVideoComment = asyncHandler(async (req, res) => {
  const { videoId, commentId } = req.params;
  if (!videoId?.trim()) {
    throw new ApiError(401, "videoId is required");
  }
  if (!commentId?.trim()) {
    throw new ApiError(401, "commentId is required");
  }
  try {
    const comment = await Comment.findById(commentId);
    const video = await Video.findById(videoId);
    if (
      !(
        comment.owner.toString() === req.user._id.toString() ||
        video.owner.toString() === req.user._id.toString()
      )
    ) {
      throw new ApiError(401, "you are not authorized to deleted this comment");
    }
    await Comment.deleteOne({ _id: commentId });
    res.json(new ApiResponse(200, {}, "comment deleted successfully"));
  } catch (error) {
    throw new ApiError(501, error.message);
  }
});

module.exports = {
  getAllComments,
  getVideoComments,
  addVideoComment,
  deleteVideoComment,
};

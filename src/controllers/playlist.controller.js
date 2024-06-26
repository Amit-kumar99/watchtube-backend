const { Playlist } = require("../models/playlist.model");
const { asyncHandler } = require("../utils/asyncHandler");
const { ApiError } = require("../utils/ApiError");
const { ApiResponse } = require("../utils/ApiResponse");
const { mongoose } = require("mongoose");

const createPlaylist = asyncHandler(async (req, res) => {
  const { name } = req.body;
  const { videoId } = req.params;
  if (!name?.trim()) {
    throw new ApiError(401, "name is required");
  }
  if (!videoId?.trim()) {
    throw new ApiError(401, "videoId is required");
  }
  try {
    const playlist = await Playlist.create({
      name,
      videos: [videoId],
      owner: req.user._id,
    });
    res.json(new ApiResponse(200, playlist, "playlist created successfully"));
  } catch (error) {
    throw new ApiError(401, error.message);
  }
});

const getAllPlaylists = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  if (!userId?.trim()) {
    throw new ApiError(401, "userId is required");
  }
  try {
    const playlists = await Playlist.aggregate([
      {
        $match: {
          owner: new mongoose.Types.ObjectId(userId),
        },
      },
      {
        $addFields: {
          videosCount: {
            $size: "$videos",
          },
        },
      },
    ]);
    res.json(new ApiResponse(200, playlists, "playlists fetched successfully"));
  } catch (error) {
    throw new ApiError(401, error.message);
  }
});

const getAllUserPlaylistsWithIsCheckedForAVideo = asyncHandler(
  async (req, res) => {
    const { videoId } = req.params;
    try {
      const playlists = await Playlist.aggregate([
        {
          $match: {
            owner: req.user?._id,
          },
        },
        {
          $addFields: {
            isChecked: {
              $cond: {
                if: { $in: [new mongoose.Types.ObjectId(videoId), "$videos"] },
                then: true,
                else: false,
              },
            },
          },
        },
      ]);
      res.json(
        new ApiResponse(
          200,
          playlists,
          "playlists with isChecked for a video fetched"
        )
      );
    } catch (error) {
      throw new ApiError(401, error.message);
    }
  }
);

const getPlaylistById = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  if (!playlistId?.trim()) {
    throw new ApiError(401, "playlistId is required");
  }
  try {
    const playlist = await Playlist.findById(playlistId)
      .populate({
        path: "videos",
        select: "thumbnail owner duration title views createdAt",
        populate: {
          path: "owner",
          select: "username",
        },
      })
      .populate({ path: "owner", select: "username" });
    const videosCount = playlist.videos.length;
    res.json(
      new ApiResponse(
        200,
        { playlist, videosCount },
        "playlist fetched successfully"
      )
    );
  } catch (error) {
    throw new ApiError(401, error.message);
  }
});

const toggleAddVideoToPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params;
  if (!playlistId?.trim()) {
    throw new ApiError(401, "playlistId is required");
  }
  if (!videoId?.trim()) {
    throw new ApiError(401, "videoId is required");
  }
  const playlist = await Playlist.findById(playlistId);
  if (playlist?.owner.toString() !== req?.user?._id?.toString()) {
    throw new ApiError(401, "You are not authorized to modify this playlist");
  }
  try {
    if (
      playlist.videos.some((video) => video.toString() === videoId.toString())
    ) {
      const existingPlaylist = await Playlist.findByIdAndUpdate(
        playlistId,
        {
          $pull: { videos: videoId },
        },
        { new: true }
      );
      return res.json(
        new ApiResponse(200, existingPlaylist, "video removed from playlist")
      );
    }
    const newPlaylist = await Playlist.findByIdAndUpdate(
      playlistId,
      {
        $push: { videos: videoId },
      },
      { new: true }
    );
    res.json(new ApiResponse(200, newPlaylist, "video added to playlist"));
  } catch (error) {
    throw new ApiError(401, error.message);
  }
});

const deletePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  if (!playlistId?.trim()) {
    throw new ApiError(401, "playlistId is required");
  }
  const playlist = await Playlist.findById(playlistId);
  if (playlist?.owner.toString() !== req?.user?._id?.toString()) {
    throw new ApiError(401, "You are not authorized to delete this playlist");
  }
  try {
    await Playlist.deleteOne({ _id: playlistId });
    res.json(new ApiResponse(200, {}, "playlist deleted successfully"));
  } catch (error) {
    throw new ApiError(401, error.message);
  }
});

const updatePlaylistDetails = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  if (!playlistId?.trim()) {
    throw new ApiError(401, "playlistId is required");
  }
  const { name } = req.body;
  if (!name?.trim()) {
    throw new ApiError(401, "playlist name is required");
  }
  const playlist = await Playlist.findById(playlistId);
  if (playlist?.owner.toString() !== req?.user?._id.toString()) {
    throw new ApiError(401, "You are not authorized to modify this playlist");
  }
  try {
    const playlist = await Playlist.findByIdAndUpdate(
      playlistId,
      {
        $set: {
          name,
        },
      },
      { new: true }
    );
    res.json(new ApiResponse(200, playlist, "playlist updated successfully"));
  } catch (error) {
    throw new ApiError(401, error.message);
  }
});

module.exports = {
  createPlaylist,
  getAllPlaylists,
  getAllUserPlaylistsWithIsCheckedForAVideo,
  getPlaylistById,
  toggleAddVideoToPlaylist,
  deletePlaylist,
  updatePlaylistDetails,
};

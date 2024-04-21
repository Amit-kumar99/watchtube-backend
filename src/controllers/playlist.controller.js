const { Playlist } = require("../models/playlist.model");
const { asyncHandler } = require("../utils/asyncHandler");
const { ApiError } = require("../utils/ApiError");
const { ApiResponse } = require("../utils/ApiResponse");
//TODO: postman
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
    const playlists = await Playlist.find({ owner: userId });
    res.json(new ApiResponse(200, playlists, "playlists fetched successfully"));
  } catch (error) {
    throw new ApiError(401, error.message);
  }
});

const getPlaylistById = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  if (!playlistId?.trim()) {
    throw new ApiError(401, "playlistId is required");
  }
  try {
    const playlist = await Playlist.findById(playlistId)
      .populate({
        path: "videos",
        select: "thumbnail duration title views createdAt",
      })
      .populate({ path: "owner", select: "username" });
    res.json(new ApiResponse(200, playlist, "playlist fetched successfully"));
  } catch (error) {
    throw new ApiError(401, error.message);
  }
});

const addVideoToPlaylist = asyncHandler(async (req, res) => {
  // how to get playlist id, since i'm planning to use checkbox to check the playlist name, but name can be redundant
  const { playlistId, videoId } = req.params;
  if (!playlistId?.trim()) {
    throw new ApiError(401, "playlistId is required");
  }
  if (!videoId?.trim()) {
    throw new ApiError(401, "videoId is required");
  }
  try {
    const playlist = await Playlist.findByIdAndUpdate(
      playlistId,
      {
        $push: { videos: videoId },
      },
      { new: true }
    );
    res.json(new ApiResponse(200, playlist, "video added to playlist"));
  } catch (error) {
    throw new ApiError(401, error.message);
  }
});

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params;
  if (!playlistId?.trim()) {
    throw new ApiError(401, "playlistId is required");
  }
  if (!videoId?.trim()) {
    throw new ApiError(401, "videoId is required");
  }
  try {
    const playlist = await Playlist.findByIdAndUpdate(
      playlistId,
      {
        $pull: { videos: videoId },
      },
      { new: true }
    );
    res.json(new ApiResponse(200, playlist, "video removed from playlist"));
  } catch (error) {
    throw new ApiError(401, error.message);
  }
});

const deletePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  if (!playlistId?.trim()) {
    throw new ApiError(401, "playlistId is required");
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
  getPlaylistById,
  addVideoToPlaylist,
  removeVideoFromPlaylist,
  deletePlaylist,
  updatePlaylistDetails,
};

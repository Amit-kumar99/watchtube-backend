const { Router } = require("express");
const { authenticateJwt } = require("../middlewares/auth.middleware");
const {
  createPlaylist,
  getAllPlaylists,
  getAllUserPlaylistsWithIsCheckedForAVideo,
  getPlaylistById,
  toggleAddVideoToPlaylist,
  deletePlaylist,
  updatePlaylistDetails,
} = require("../controllers/playlist.controller");

const router = Router();

router.post("/create/:videoId", authenticateJwt, createPlaylist);
router.get("/getAll/:userId", authenticateJwt, getAllPlaylists);
router.get("/getAllForAVideo/:videoId", authenticateJwt, getAllUserPlaylistsWithIsCheckedForAVideo);
router.get("/get/:playlistId", authenticateJwt, getPlaylistById);
router.patch("/toggleAddVideo/:playlistId/:videoId", authenticateJwt, toggleAddVideoToPlaylist);
router.delete("/delete/:playlistId", authenticateJwt, deletePlaylist);
router.patch("/update/:playlistId", authenticateJwt, updatePlaylistDetails);

module.exports = router;

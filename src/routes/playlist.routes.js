const { Router } = require("express");
const { authenticateJwt } = require("../middlewares/auth.middleware");
const {
  createPlaylist,
  getAllPlaylists,
  getPlaylistById,
  addVideoToPlaylist,
  removeVideoFromPlaylist,
  deletePlaylist,
  updatePlaylistDetails,
} = require("../controllers/playlist.controller");

const router = Router();

router.post("/create/:videoId", authenticateJwt, createPlaylist);
router.get("/getAll/:userId", getAllPlaylists);
router.get("/get/:playlistId", getPlaylistById);
router.post("/addVideo/:playlistId/:videoId", authenticateJwt, addVideoToPlaylist);
router.post("/removeVideo/:playlistId/:videoId", authenticateJwt, removeVideoFromPlaylist);
router.post("/delete/:playlistId", authenticateJwt, deletePlaylist);
router.post("/update/:playlistId", authenticateJwt, updatePlaylistDetails);

module.exports = router;

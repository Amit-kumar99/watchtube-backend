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
router.patch("/addVideo/:playlistId/:videoId", authenticateJwt, addVideoToPlaylist);
router.patch("/removeVideo/:playlistId/:videoId", authenticateJwt, removeVideoFromPlaylist);
router.delete("/delete/:playlistId", authenticateJwt, deletePlaylist);
router.patch("/update/:playlistId", authenticateJwt, updatePlaylistDetails);

module.exports = router;

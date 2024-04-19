const { Router } = require("Router");
const {
  uploadVideo,
  getAllVideos,
  getVideoById,
  updateVideo,
  deleteVideo,
  togglePublishStatus,
} = require("../controllers/video.controller");
const { authenticateJwt } = require("../middlewares/auth.middleware");

const router = Router();

router.get("/:userId", authenticateJwt, getAllVideos);
router.post(
  "/upload",
  authenticateJwt,
  upload.fields([
    {
      name: "video",
      maxCount: 1,
    },
    {
      name: "thumbnail",
      maxCount: 1,
    },
  ]),
  uploadVideo
);
router.get("/:videoId", authenticateJwt, getVideoById);
router.post("/update", authenticateJwt, updateVideo);
router.delete("/delete", authenticateJwt, deleteVideo);
router.post("/togglePublishStatus", authenticateJwt, togglePublishStatus);

module.exports = router;

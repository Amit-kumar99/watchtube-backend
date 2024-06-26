const { Router } = require("express");
const {
  uploadVideo,
  getAllVideos,
  getAllVideosByUserId,
  getVideoById,
  updateVideo,
  deleteVideo,
  togglePublishStatus,
} = require("../controllers/video.controller");
const { authenticateJwt } = require("../middlewares/auth.middleware");
const { upload } = require("../middlewares/multer.middleware");

const router = Router();

router.get("/getAll", getAllVideos);
router.get("/profile/:userId", authenticateJwt, getAllVideosByUserId);
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
router.patch(
  "/update/:videoId",
  authenticateJwt,
  upload.single("thumbnail"),
  updateVideo
);
router.delete("/delete/:videoId", authenticateJwt, deleteVideo);
// router.post("/toggleVisibilty/:videoId", authenticateJwt, toggleVisibilty);

module.exports = router;

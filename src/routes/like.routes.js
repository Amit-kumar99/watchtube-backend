const { Router } = require("express");
const { authenticateJwt } = require("../middlewares/auth.middleware");
const {
  toggleVideoLike,
  toggleCommentLike,
  toggleTweetLike,
  getAllLikedVideos,
} = require("../controllers/like.controller");

const router = Router();

router.use(authenticateJwt);

router.post("/toggleVideoLike", toggleVideoLike);
router.post("/toggleCommentLike", toggleCommentLike);
router.post("/toggleTweetLike", toggleTweetLike);
router.get("/allLikedVideos", getAllLikedVideos);

module.exports = router;

const { Router } = require("express");
const { authenticateJwt } = require("../middlewares/auth.middleware");
const {
  toggleVideoLike,
  toggleTweetLike,
  toggleCommentLike,
  getAllLikedVideos,
} = require("../controllers/like.controller");

const router = Router();

router.use(authenticateJwt);

router.post("/toggleVideoLike/:videoId", toggleVideoLike);
router.post("/toggleTweetLike/:tweetId", toggleTweetLike);
router.post("/toggleCommentLike/:commentId", toggleCommentLike);
router.get("/allLikedVideos", getAllLikedVideos);

module.exports = router;

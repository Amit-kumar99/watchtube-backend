const { Router } = require("express");
const { authenticateJwt } = require("../middlewares/auth.middleware");
const {
  getAllComments,
  getVideoComments,
  addVideoComment,
  deleteVideoComment,
} = require("../controllers/comment.controller");

const router = Router();

router.get("/commentsHistory", authenticateJwt, getAllComments);
router.get("/videoComments/:videoId", authenticateJwt, getVideoComments);
router.post("/addVideoComment/:videoId", authenticateJwt, addVideoComment);
router.delete(
  "/deleteVideoComment/:videoId/:commentId",
  authenticateJwt,
  deleteVideoComment
);

module.exports = router;

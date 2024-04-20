const { Router } = require("express");
const { authenticateJwt } = require("../middlewares/auth.middleware");
const {
  getAllComments,
  getVideoComments,
  addVideoComment,
  deleteComment,
} = require("../controllers/comment.controller");

const router = Router();

router.get("/commentsHistory", authenticateJwt, getAllComments);
router.get("/videoComments", getVideoComments);
router.post("/add", authenticateJwt, addVideoComment);
router.post("/delete", authenticateJwt, deleteComment);

module.exports = router;

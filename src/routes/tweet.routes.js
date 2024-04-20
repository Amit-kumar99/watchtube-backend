const { Router } = require("express");
const {
  createTweet,
  getAllTweets,
  updateTweet,
  deleteTweet,
} = require("../controllers/tweet.controller");
const { authenticateJwt } = require("../middlewares/auth.middleware");

const router = Router();

router.post("/:userId", authenticateJwt, createTweet);
router.get("/:userId", getAllTweets);
router.post("/:userId/:tweetId", authenticateJwt, updateTweet);
router.post("/:userId/:tweetId", authenticateJwt, deleteTweet);

module.exports = router;

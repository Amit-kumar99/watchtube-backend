const { Router } = require("express");
const {
  createTweet,
  getAllTweets,
  updateTweet,
  deleteTweet,
} = require("../controllers/tweet.controller");
const { authenticateJwt } = require("../middlewares/auth.middleware");

const router = Router();

router.post("/create/:channelId", authenticateJwt, createTweet);
router.get("/get/:channelId", getAllTweets);
router.patch("/update/:channelId/:tweetId", authenticateJwt, updateTweet);
router.delete("/delete/:channelId/:tweetId", authenticateJwt, deleteTweet);

module.exports = router;

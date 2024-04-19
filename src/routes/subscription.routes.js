const { Router } = require("express");
const {
  toggleSubscription,
  getAllSubscribedToChannels,
  getUserSubscribedChannels,
} = require("../controllers/subscription.controller");
const { authenticateJwt } = require("../middlewares/auth.middleware");

const router = Router();

router.use(authenticateJwt);

router.post("/:channelId", toggleSubscription);
router.get("/:subscribedId", getAllSubscribedToChannels);
router.get("/:channelId", getUserSubscribedChannels);

module.exports = router;

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
router.get("/subscribedTo", getAllSubscribedToChannels);
router.get("/subscribers", getUserSubscribedChannels);

module.exports = router;

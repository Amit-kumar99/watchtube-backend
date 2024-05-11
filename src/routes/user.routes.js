const { Router } = require("express");
const {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentUser,
  updateAccountDetails,
  updateUserAvatar,
  updateUserCoverImage,
  getUserChannelProfile,
  getWatchHistory,
} = require("../controllers/user.controller");
const { upload } = require("../middlewares/multer.middleware");
const { authenticateJwt } = require("../middlewares/auth.middleware");

const router = Router();

router.post(
  "/register",
  upload.fields([
    {
      name: "avatar",
      maxCount: 1,
    },
    {
      name: "coverImage",
      maxCount: 1,
    },
  ]),
  registerUser
);

router.post("/login", loginUser);

router.post("/logout", authenticateJwt, logoutUser);

router.post("/refresh-token", refreshAccessToken);

router.patch("/change-password", authenticateJwt, changeCurrentPassword);

router.get("/current-user", authenticateJwt, getCurrentUser);

router.patch("/update-account", authenticateJwt, updateAccountDetails);

router.patch(
  "/update-avatar",
  authenticateJwt,
  upload.single("avatar"),
  updateUserAvatar
);

router.patch(
  "/update-coverImage",
  authenticateJwt,
  upload.single("coverImage"),
  updateUserCoverImage
);

router.get("/channel/:userId", authenticateJwt, getUserChannelProfile);

router.get("/watchHistory", authenticateJwt, getWatchHistory);

module.exports = router;

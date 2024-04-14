const { Router } = require("express");
const { registerUser, loginUser, logoutUser, refreshAccessToken } = require("../controllers/user.controller");
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

module.exports = router;

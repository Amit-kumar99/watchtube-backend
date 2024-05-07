require("dotenv").config();
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");

const app = express();

app.use(
  cors({
    // origin: process.env.CORS_ORIGIN,
    origin: true,
    credentials: true,
  })
);

app.use(express.json({ limit: "100mb" }));
app.use(express.urlencoded({ extended: true, limit: "100mb" }));
app.use(express.static("public"));
app.use(cookieParser());

//routes
const userRoutes = require("./routes/user.routes");
const videoRoutes = require("./routes/video.routes");
const subscriptionRoutes = require("./routes/subscription.routes");
const tweetRoutes = require("./routes/tweet.routes");
const commentRoutes = require("./routes/comment.routes");
const likeRoutes = require("./routes/like.routes");
const playlistRoutes = require("./routes/playlist.routes");

app.use("/api/v1/users", userRoutes);
app.use("/api/v1/videos", videoRoutes);
app.use("/api/v1/subscriptions", subscriptionRoutes);
app.use("/api/v1/tweets", tweetRoutes);
app.use("/api/v1/comments", commentRoutes);
app.use("/api/v1/likes", likeRoutes);
app.use("/api/v1/playlists", playlistRoutes);

module.exports = {
  app,
};

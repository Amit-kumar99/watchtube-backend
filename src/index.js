require("dotenv").config();
const { connectDB } = require("./db");
const { app } = require("./app");

const port = process.env.PORT || 8000;

;(async () => {
  try {
    await connectDB();
    app.listen(port, () => {
      console.log("Listening on port: " + port);
    });
  } catch (err) {
    console.error("Failed to start express server:", err);
  }
})();

app.on("error", (err) => {
  console.log("Express app error", err);
});
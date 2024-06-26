require("dotenv").config();
const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const connectionInstance = await mongoose.connect(`${process.env.MONGO_URI}/${process.env.DB_NAME}`);
    console.log(`MongoDB connected, host: ${connectionInstance.connection.host}`);
  } catch (error) {
    console.log("MongoDB Connection failed " + error);
  }
}

module.exports = {
  connectDB,
}

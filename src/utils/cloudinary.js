require("dotenv").config();
const { v2: cloudinary } = require("cloudinary");
const fs = require("fs");
const { ApiError } = require("./ApiError");

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) return null;
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });
    console.log("file has been uploaded on cloudinary", response.url);
    fs.unlinkSync(localFilePath);
    return response;
  } catch (error) {
    fs.unlinkSync(localFilePath);
    throw new ApiError(401, "cloudinary upload error");
  }
};

const deleteOnCloudinary = async (publicId, resourceType) => {
  try {
    if (!publicId) {
      throw new ApiError(401, "No such publicId exists in cloudinary");
    }
    await cloudinary.uploader.destroy(publicId, { resourceType });
    console.log("cloudinary file deleted successfully");
  } catch (error) {
    throw new ApiError(401, "cloudinary delete error");
  }
};

module.exports = {
  uploadOnCloudinary,
  deleteOnCloudinary,
};

import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";
import fs from "fs";
dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadToCloudinary = async (path, folder = "visionMysuru2050") => {
  //check file size and type before uploading
  const size = fs.statSync(path).size;
  if (size > 2 * 1024 * 1024) {
    throw new Error("File size exceeds 2MB");
  }
  try {
    const data = await cloudinary.uploader.upload(path, {
      folder: folder,
      use_filename: true,
      unique_filename: false,
    });
    return { url: data.secure_url, public_id: data.public_id };
  } catch (err) {
    console.error(err);
    throw err;
  }
};

const deleteFromCloudinary = async (publicId) => {
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (err) {
    console.error("Cloudinary cleanup failed:", err.message);
  }
};

export { cloudinary, uploadToCloudinary, deleteFromCloudinary };

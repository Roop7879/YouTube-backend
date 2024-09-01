import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET, // Click 'View API Keys' above to copy your API secret
});

const uploadOnCloudinary = async function (localfilepath) {
  try {
    if (!localfilepath) return null;

    //upload the file on cloudinary
    const response = await cloudinary.uploader.upload(localfilepath, {
      resource_type: "auto",
    });

    //file has been uploaded now we have to unlink it
    // console.log("file is uploaded on cludinary", response.url);
    fs.unlinkSync(localfilepath)
    return response;

  } catch (error) {
    fs.unlinkSync(localfilepath); //remove the locally save temp file as the upload operation got failed
    return null;
  }
};

export {uploadOnCloudinary}

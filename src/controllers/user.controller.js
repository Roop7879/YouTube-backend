import { asyncHandler } from "../utils/asynchandler.js";
import { ApiError } from "../utils/apiErrors.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/apiResponse.js";

const registerUser = asyncHandler(async (req, res) => {
  /*
    - get user information
    - validation: not empty
    - check if user already exist: by username,email
    - check for images, check for avatar
    - upload them on cloudinary
    - create user obj: create entry in db
    - remove pass. and refresh token field in response
    - check for user creation 
    */

  const { fullname, email, username, password } = req.body;

  //checking the fields are empty or not
  if (!fullname || !email || !username || !password) {
    throw new ApiError(400, "All fields are required");
  }
  //checking the user alredy exist or not
  const existedUser = await User.findOne({
    $or: [{ email }, { username }] //$or checks the value inside the object and return true/false
  });

  if (existedUser) {
    throw new ApiError(409, "User with this credential already exits");
  }

  //taking the path of avatar and coverImage
  const avatarLocalPath = req.files?.avatar[0]?.path;
  
  let coverImageLocalPath;
  if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0){
    coverImageLocalPath = req.files.coverImage[0].path
  }
  
  //checking that path come or not
  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar is required");
  }

  

  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  if (!avatar) {
    throw new ApiError(400, "Avatar is required");
  }


//create user in our database
  const user = await User.create({
    fullname,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    email,
    password,
    username: username.toLowerCase(),
  });

  //check user is crated successfully or not

  const userCreated = await User.findById(user._id).select(
    "-password -refreshTokens"
  );

  if (!userCreated) {
    throw new ApiError(500, "Error in registering the user");
  }

  //send response to user
  return res
    .status(201)
    .json(new ApiResponse(200, userCreated, "User registered successfully"));
});

export { registerUser };
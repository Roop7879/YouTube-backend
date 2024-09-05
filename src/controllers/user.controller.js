import { asyncHandler } from "../utils/asynchandler.js";
import { ApiError } from "../utils/apiErrors.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/apiResponse.js";
import jwt from "jsonwebtoken";

const generateAccessAndRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshTokens = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      "Something went wrong while generating refresh and access token"
    );
  }
};

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
    $or: [{ email }, { username }], //$or checks the value inside the object and return true/false
  });

  if (existedUser) {
    throw new ApiError(409, "User with this credential already exits");
  }

  //taking the path of avatar and coverImage
  const avatarLocalPath = req.files?.avatar[0]?.path;

  let coverImageLocalPath;
  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0
  ) {
    coverImageLocalPath = req.files.coverImage[0].path;
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

const loginUser = asyncHandler(async (req, res) => {
  /*
    -take take username/email and password
    -check in database
    -generate refresh/access token
    -send cookies
   */

  const { email, username, password } = req.body;
  if (!(email || username)) {
    throw new ApiError(400, "username or email is required");
  }

  const findUser = await User.findOne({
    $or: [{ email }, { username }],
  });

  if (!findUser) {
    throw new ApiError(404, "User does not exist");
  }

  const isPasswordValid = await findUser.isPasswordCorrect(password);

  if (!isPasswordValid) {
    throw new ApiError(401, "Wrong password");
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
    findUser._id
  );

  const loggedInUser = await User.findById(findUser._id).select(
    "-password -refreshTokens"
  );
  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
        "User Logged in Successfully"
      )
    );
});

const LogoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $unset: {
        refreshTokens: 1,
      },
    },
    {
      new: true,
    }
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "user logged out Successfully"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;
  if (!incomingRefreshToken) {
    throw new ApiError(401, "unauthorized request");
  }

  try {
    const decodedRefreshToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );
    if (!decodedRefreshToken) {
      throw new ApiError(401, "Token not found");
    }

    const user = await User.findById(decodedRefreshToken?._id);
    if (!user) {
      throw new ApiError(401, "invalid refresh token");
    }

    if (incomingRefreshToken !== user?.refreshTokens) {
      throw new ApiError(401, "Refresh Token is expired");
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
      user._id
    );

    options = {
      httpOnly: true,
      secure: true,
    };
    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", refreshToken, options)
      .json(
        new ApiResponse(
          200,
          { accessToken, refreshToken },
          "Access token refreshed"
        )
      );
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid refresh");
  }
});

const changePassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  const user = await User.findById(req.user?._id);
  const checkOldPass = await user.isPasswordCorrect(oldPassword);

  if (!checkOldPass) {
    throw new ApiError(400, "Enter correct old password");
  }

  user.password = newPassword;
  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password changed successfully"));
});

const getCurrnetUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new ApiResponse(200, req.user, "Currnet user fetched successfully"));
});

const updateAccountDetails = asyncHandler(async (req, res) => {
  const { fullname, email } = req.body;
  if (!fullname || !email) {
    throw new ApiError(400, "All fields are required");
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        fullname,
        email,
      },
    },
    { new: true }
  ).select("-password");

  return res.status(200).json(new ApiResponse(200, user, "A"));
}); 

const updateUserAvatar = asyncHandler(async (req, res) => {
  const avatarLocal = req.file?.path;
  if (!avatarLocal) {
    throw new ApiError(400, "Avatar file is missing");
  }
  const avatar = await uploadOnCloudinary(avatarLocal);

  if (!avatar.url) {
    throw new ApiError(400, "Error while uploading on avatar");
  }

  await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        avatar: avatar.url,
      },
    },
    { new: true }.select("-password")
  );
  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Avatar updated successfully"));
});


const updateUserCoverImage = asyncHandler(async (req, res) => {
  const coverImageLocal = req.file?.path;
  if (!coverImageLocal) {
    throw new ApiError(400, "Cover Image file is missing");
  }
  const coverImage = await uploadOnCloudinary(coverImageLocal);

  if (!coverImage.url) {
    throw new ApiError(400, "Error while uploading CoverImage");
  }

  await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        coverImage: coverImage.url,
      },
    },
    { new: true }.select("-password")
  );
  return res
    .status(200)
    .json(new ApiResponse(200, {}, "CoverImage updated successfully"));
});

const getUserChannelProfile = asyncHandler(async(req,res)=>{
  const{username} = req.params
  if(!username){
    throw new ApiError(400, "Username is missimg");
  } 

  const channel = await User.aggregate([
    {
      $match: {
        username: username?.toLowerCase()
      }
    },
    {
      //channel ke subscribers(i.e., how many peoples follow this channel )
      $lookup:{
        from: "subscriptions",
        localField:"_id",
        foreignField:"channel",
        as: "subscribers"
      }
    },
    {
      $lookup:{
        from:'subscriptions',
        localField:'_id',
        foreignField:"subscriber",
        as:'subscribedTo'
      }
    },
    {
      $addFields:{
        subscribersCount:{$set : "$subscribers"},
        subscribedToCount:{$set : "$subscribedTo"},
        isSubscribed: {
          $cond:{
            if: {$in: [req.user?._id, "$subscribers.subscriber"]},
            then: true,
            else: false
          }
        }
      }
    },
    {
      $project:{
        fullname: 1,
        username:1,
        subscribersCount:1,
        subscribedToCount:1,
        email:1,
        isSubscribed: 1,
        avatar:1,
        coverImage:1
      }
    }
  ])

  // console.log(channel)  
  if(!channel?.length){
    throw new ApiError(404, "Channel does not exist");
  }

  return res.status(200)
  .json(new ApiResponse(200,channel[0],"User channel fetched Successfully"))
})

export {
  registerUser,
  loginUser,
  LogoutUser,
  refreshAccessToken,
  changePassword,
  getCurrnetUser,
  updateAccountDetails,
  updateUserAvatar,
  updateUserCoverImage,
  getUserChannelProfile
};
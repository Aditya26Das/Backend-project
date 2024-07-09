import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/apiError.js";
import ApiResponse from "../utils/apiResponse.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary , deleteFromCloudinary} from "../utils/cloudinary.server.js";
import jwt from "jsonwebtoken";

const generateAccessAndRefreshTokens = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });
    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      "Something Went Wrong While Generating Refresh and Access tokens!"
    );
  }
};

const registerUser = asyncHandler(async (req, res) => {
  //get user details from frontend
  const { fullName, email, userName, password } = req.body;

  //validation from user - not empty
  if (
    [fullName, email, userName, password].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "This field is are Compulsory !!!");
  }

  //check if user already exist - via username and email
  const existedUser = await User.findOne({
    $or: [{ userName }, { email }],
  });

  if (existedUser) {
    throw new ApiError(
      409,
      "User with same UserName and Email Already Exists !"
    );
  }

  //check for images and check for avatar
  const avatarLocalPath = req.files?.avatar[0]?.path;

  let coverImageLocalPath;
  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0
  ) {
    coverImageLocalPath = req.files.coverImage[0].path;
  }

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar File is required !");
  }

  //upload them to cloudinary
  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);
  if (!avatar) {
    throw new ApiError(400, "Avatar File is required !");
  }

  //create user object - create entry in db
  const user = await User.create({
    fullName: fullName,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    email: email,
    password: password,
    userName: userName.toLowerCase(),
  });
  //remove password and refresh token field from response
  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while registering user!");
  }

  //check for user creation - return response or return error
  return res
    .status(201)
    .json(new ApiResponse(200, createdUser, "User registered successfully !"));
});

const loginUser = asyncHandler(async (req, res) => {
  // data from req body
  const { email, userName, password } = req.body;
  if (!(email || userName)) {
    throw new ApiError(400, "Username or Email is required");
  }

  //Get user's userName or email
  const user = await User.findOne({
    $or: [{ userName }, { email }],
  });

  //find the user
  if (!user) {
    throw new ApiError(404, "User doesnot exist");
  }

  //password check
  const isCorrect = await user.isPasswordCorrect(password);
  if (!isCorrect) {
    throw new ApiError(401, "Wrong Password !!!");
  }

  //generate and send access and refresh token and get them
  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
    user._id
  );

  //send through cookies
  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
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
      new ApiResponse(200, {
        user: loggedInUser,
        accessToken,
        refreshToken,
        msg: "User logged in successfully",
      })
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  const currentUser = req.user._id;
  await User.findByIdAndUpdate(
    currentUser,
    {
      $unset: {
        refreshToken: 1,
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
    .json(new ApiResponse(200, {}, "User Logged Out"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;

  if (!incomingRefreshToken) {
    return new ApiError(401, "Unauthorized Request !!!");
  }

  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    const user = await User.findById(decodedToken?._id);

    if (!user) {
      return new ApiError(401, "Invalid refresh token!");
    }

    if (incomingRefreshToken != user?.refreshToken) {
      return new ApiError(401, "Refresh token is expire or used!");
    }

    const options = {
      httpOnly: true,
      secure: true,
    };

    const { accessToken, newRefreshToken } =
      await generateAccessAndRefreshTokens(user._id);

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newRefreshToken, options)
      .json(
        new ApiResponse(
          200,
          { accessToken, refreshToken: newRefreshToken },
          "Access Token Refreshed"
        )
      );
  } catch (error) {
    throw new ApiError(401, {}, error?.message || "Invalid Refresh Token");
  }
});

const changePassword = asyncHandler(async(req,res) => {
  const {oldPassword , newPassword , confPassword} = req.body
  const user = await User.findById(req.user?._id)
  const val = await user.isPasswordCorrect(oldPassword)
  if (!val) {
    throw new ApiError(400,"Password incorrect")
  }

  if(!(newPassword === confPassword))
  {
    throw new ApiError(400,"New password and Confirm Password different")
  }

  user.password = newPassword
  await user.save({validateBeforeSave : false})
  return res
  .status(200)
  .json(
    new ApiResponse(
      200,
      {},
      "Password changed Successfully"
    )
  )
});

const getCurrentUser = asyncHandler(async(req,res) => {
  return res
  .status(200)
  .json(200,{},req.user,"Current User fetched successfully")
})

const updateAccountDetails = asyncHandler(async(req,res) => {
  const {fullName,email} = req.body

  if(!fullName || !email)
  {
    throw new ApiError(401,"Either fullname or email should be provided")
  }

  const user = req.user
  if(!user)
  {
    throw new ApiError(401,"No User found")
  }

  const userId = user._id
  const data = await User.findByIdAndUpdate(
    userId,
    {
      $set : {
        fullName : fullName,
        email : email
      }
    },
    {
      new: true
    }
  ).select("-password")

  return res
  .status(200)
  .json(
    new ApiResponse(
      200,
      data,
      "Account Updated successfully"
    )
  )
})

const updateUserAvatar = asyncHandler(async(req,res)=>{
  const userId = req.user?._id
  const newAvatarLocalPath = req.file?.path

  if(!userId)
  {
    throw new ApiError(401,"User doesnot exist")
  }

  if (!newAvatarLocalPath) {
    throw new ApiError(401,"Avatar is missing")
  }

  const newAvatar = await uploadOnCloudinary(newAvatarLocalPath)

  if (!newAvatar.url) {
    throw new ApiError(401,"Error while uploading on cloudinary")
  }

  const val = await User.findById(userId)
  const pathUrl = val.avatar

  const user = await User.findByIdAndUpdate(
    userId,
    {
      $set: {
        avatar : newAvatar.url
      }
    },
    {
      new: true
    }
  ).select("-password")

  if (pathUrl) {
    await deleteFromCloudinary(pathUrl)
  }

  return res
  .status(201)
  .json(
    new ApiResponse(
      201,
      user,
      "Avatar Updated successfully"
    )
  )
})

const updateUserCoverImage = asyncHandler(async(req,res)=>{
  const userId = req.user?._id
  const newCoverImageLocalPath = req.file?.path

  if(!userId)
  {
    throw new ApiError(401,"User doesnot exist")
  }

  if (!newCoverImageLocalPath) {
    throw new ApiError(401,"CoverImage is missing")
  }

  const newCoverImage = await uploadOnCloudinary(newCoverImageLocalPath)

  if (!newCoverImage.url) {
    throw new ApiError(401,"Error while uploading on cloudinary")
  }

  const val = await User.findById(userId)
  const pathUrl = val.coverImage

  const user = await User.findByIdAndUpdate(
    userId,
    {
      $set: {
        coverImage : newCoverImage.url
      }
    },
    {
      new: true
    }
  ).select("-password")

  if (pathUrl) {
    await deleteFromCloudinary(pathUrl)
  }

  return res
  .status(201)
  .json(
    new ApiResponse(
      201,
      user,
      "CoverImage Updated successfully"
    )
  )
})

const getUserChannelProfile = asyncHandler(async(req,res)=>{
  const {userName} = req.params;
  if (!userName?.trim()) {
    throw new ApiError(400,"No such username found")
  }

  const channel = await User.aggregate([
    {
      $match: {
        userNmae: userName?.toLowerCase()
      }
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "channel",
        as: "subscribers"
      }
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "subscriber",
        as: "subscribedTo"
      }
    },
    {
      $addFields: {
        subscribersCount : {
          $size : "$subscribers"
        },
        channelsSubscribedToCount : {
          $size : "$subscribedTo"
        },
        isSubscribed : {
          $cond : {
            if: {$in: [req.user?._id, "$subscribers.subscriber"]},
            then : true,
            else : false
          }
        }
      }
    },
    {
      $project: {
        fullName: 1,
        userName: 1,
        subscribersCount: 1,
        channelsSubscribedToCount: 1,
        isSubscribed: 1,
        avatar: 1,
        coverImage: 1,
        email: 1
      }
    }
  ])
  
  if (!channel?.length) {
    throw new ApiError(400,"Channel doesnot exist")
  }

  return res
  .status(200)
  .json(
    new ApiResponse(200,channel[0],"User Channel Fetched Successfully")
  )
})

const getWatchHistory = asyncHandler(async(req, res) => {
  const user = await User.aggregate([
      {
          $match: {
              _id: new mongoose.Types.ObjectId(req.user._id)
          }
      },
      {
          $lookup: {
              from: "videos",
              localField: "watchHistory",
              foreignField: "_id",
              as: "watchHistory",
              pipeline: [
                  {
                      $lookup: {
                          from: "users",
                          localField: "owner",
                          foreignField: "_id",
                          as: "owner",
                          pipeline: [
                              {
                                  $project: {
                                      fullName: 1,
                                      username: 1,
                                      avatar: 1
                                  }
                              }
                          ]
                      }
                  },
                  {
                      $addFields:{
                          owner:{
                              $first: "$owner"
                          }
                      }
                  }
              ]
          }
      }
  ])

  return res
  .status(200)
  .json(
      new ApiResponse(
          200,
          user[0].watchHistory,
          "Watch history fetched successfully"
      )
  )
})


export { registerUser, loginUser, logoutUser , refreshAccessToken, changePassword, getCurrentUser, updateAccountDetails, updateUserAvatar, updateUserCoverImage, getUserChannelProfile, getWatchHistory};
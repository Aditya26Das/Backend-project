import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/apiError.js";
import ApiResponse from "../utils/apiResponse.js"
import {User} from "../models/user.model.js"
import {uploadOnCloudinary} from "../utils/cloudinary.server.js"

const registerUser = asyncHandler( async (req,res) => {
    //get user details from frontend
    const {fullname, email, userName, password} = req.body;

    //validation from user - not empty
    if (
        [fullname,email,userName,password].some((field) => field?.trim() === "")
    ) {
        throw new ApiError(400,"All Fields are Compulsory !!!")
    }

    //check if user already exist - via username and email
    const existedUser = User.findOne(
        {
            $or:[{ userName },{ email }]
        }
    )

    if(existedUser)
    {
        throw new ApiError(409,"User with same UserName and Email Already Exists !")
    }

    //check for images and check for avatar
    const avatarLocalPath = req.files?.avatar[0]?.path;
    const coverImageLocalPath = req.files?.coverImage[0]?.path;

    if(!avatarLocalPath)
    {
        throw new ApiError(400, "Avatar File is required !")
    }

    //upload them to cloudinary
    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)
    if(!avatar)
    {
        throw new ApiError(400, "Avatar File is required !")
    }

    //create user object - create entry in db
    const user = await User.create({
        fullname,
        avatar : avatar.url,
        coverImage : coverImage?.url || "",
        email,
        password,
        userName : userName.toLowerCase()
    })

    //remove password and refresh token field from response
    const createdUser = await user.findById(user._id).select("-password -refreshToken")
    if (!createdUser) {
        throw new ApiError(500,"Something went wrong while registering user!")
    }
    //check for user creation - return response or return error
    return res.status(201).json(
        new ApiResponse(200,createdUser,"User registered successfully !")
    )
} )

const loginUser = asyncHandler( async (req,res) => {
    res.status(200).json({
        message: "User Logged In"
    })
} )

export { registerUser , loginUser }
import asyncHandler from "../utils/asyncHandler.js";

const registerUser = asyncHandler( async (req,res) => {
    res.status(200).json({
        message: "User Regstered"
    })
} )

const loginUser = asyncHandler( async (req,res) => {
    res.status(200).json({
        message: "User Logged In"
    })
} )

export { registerUser , loginUser }
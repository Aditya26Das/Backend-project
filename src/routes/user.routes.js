import express from "express";
import {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changePassword,
  getCurrentUser,
  updateAccountDetails,
  updateUserAvatar,
  updateUserCoverImage,
  getUserChannelProfile,
  getWatchHistory,
} from "../controllers/user.controllers.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJwt } from "../middlewares/auth.middleware.js";

const userRouter = express.Router();

userRouter.route("/register").post(
  upload.fields([
    { name: "avatar", maxCount: 1 },
    { name: "coverImage", maxCount: 1 },
  ]),
  registerUser,
  (req, res) => {
    console.log(req.files);
  }
);

userRouter.route("/login").post(loginUser);

//Secured Routes
userRouter.route("/logout").post(verifyJwt, logoutUser);
userRouter.route("/refresh-token").post(refreshAccessToken);
userRouter.route("/change-password").post(verifyJwt, changePassword);
userRouter.route("/current-user").post(verifyJwt, getCurrentUser);
userRouter.route("/update-account-details").patch(updateAccountDetails);
userRouter
  .route("/update-avatar")
  .patch(
    verifyJwt,
    updateAccountDetails,
    upload.single("avatar"),
    updateUserAvatar
  );
userRouter
  .route("/update-cover-image")
  .patch(
    verifyJwt,
    updateAccountDetails,
    upload.single("coverImage"),
    updateUserCoverImage
  );
userRouter.route("/c/:username").get(getUserChannelProfile);
userRouter.route("/c/:username").get(verifyJwt, getWatchHistory);

export default userRouter;

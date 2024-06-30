import express from "express";
import { registerUser , loginUser } from "../controllers/user.controllers.js";
import { upload } from "../middlewares/multer.middleware.js"

const userRouter = express.Router();

userRouter.route("/register").post(
    upload.fields(
        [
            {name:'avatar',maxCount:1},
            {name:'coverImage',maxCount:1}
        ]
    ),
    registerUser,
    (req,res) =>
    {
        console.log(req.files)
    },
);
userRouter.route("/login").post(loginUser);

export default userRouter;
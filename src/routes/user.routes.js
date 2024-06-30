import express from "express";
import { registerUser , loginUser , logoutUser} from "../controllers/user.controllers.js";
import { upload } from "../middlewares/multer.middleware.js"
import { verifyJwt } from "../middlewares/auth.middleware.js";

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

//Secured Routes
userRouter.route("/logout").post(verifyJwt,logoutUser);

export default userRouter;
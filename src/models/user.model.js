import mongoose , {Schema} from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const userSchema = new Schema(
    {
        userName : {
            type : String,
            required : [true, "Username is Required."],
            unique : true,
            lowerCase : true,
            trim : true,
            index : true
        },
        password : {
            type : String,
            required : [true, "Password is Required."],
        },
        email : {
            type : String,
            required : [true, "Email is Required."],
            unique : true,
            lowercase : true,
            trim : true
        },
        fullName : {
            type : String,
            required : [true, "Fullname is Required."],
            unique : false,
            lowercase : false,
            trim : true,
            index : true        
        },
        watchHistory :[
            {
                type : Schema.Types.ObjectId,
                ref: "Video"
            }
        ],
        avatar : {
            type : String, //Cloudinary Url
            required : [true, "Avatar is Required."],
        },
        coverImage : {
            type : String,
        },
        refreshToken : {
            type : String,
        }
    },
    {
        timestamps : true
    }
)

userSchema.pre("save", async function (next) {
    if (this.isModified("password")) {
        this.password = await bcrypt.hash(this.password,10);       
    }
    next(); 
})

userSchema.methods.isPasswordCorrect = async function (password) {
    return await bcrypt.compare(password,this.password);
}

userSchema.methods.generateAccessToken = function(){
    jwt.sign(
        {
            _id : this._id,
            email: this.email,
            userName: this.userName,
            fullName: this.fullName
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        }
    );
}

userSchema.methods.generateRefreshToken = function(){
    jwt.sign(
        {
            _id : this._id
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY
        }
    );
}

export const User = mongoose.model("User",userSchema);

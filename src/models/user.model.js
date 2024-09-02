import mongoose, { Schema } from "mongoose";
import bcrypt from 'bcrypt'
import jwt from "jsonwebtoken";

const userSchema = new Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    fullname: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    avatar: {
      type: String, //we use cloudnary url
      required: true,
    },
    coverImage: {
      type: String,
    },
    watchHistory: [
      {
        type: Schema.Types.ObjectId,
        ref: "Video",
      },
    ],
    password: {
      type: String,
      required: [true, "Password is required"],
    },
    refreshTokens: {
      type: String,
    },
  },
  { timestamps: true }
);

//encrypt password
userSchema.pre('save', async function(next) {
  if(!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10)
  next()
  
});

//check or compare password
userSchema.methods.isPasswordCorrect = async function(password) {
  return await bcrypt.compare(password, this.password)
}

//generate access token--- (they are short live)
userSchema.methods.generateAccessToken = function(){
  return jwt.sign({
    _id: this._id,
    email: this.email,
    username: this.username,
    fullname: this.fullname
  },
  process.env.SECRET_ACCESS_TOKEN,
  {
    expiresIn: process.env.ACCESS_TOKEN_EXPIRY
  }
)
}

//Generate refresh token----(they are long live)
userSchema.methods.generateRefreshToken = function(params) {
  return jwt.sign({
    _id: this._id,
  },
  process.env.REFRESH_TOKEN_SECRET,
  {
    expiresIn: process.env.REFRESH_TOKEN_EXPITY
  }
)
}

const User = mongoose.model("User", userSchema);

export { User };

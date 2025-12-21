import mongoose from "mongoose";
import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt'

const userSchema= new mongoose.Schema( 
  {
    username:{
      type:String,
      required:true,
      unique:true,
      lowercase:true,
      trim:true,
      index:true
    },
    email:{
      type:String,
      required:true,
      unique:true,
      lowercase:true,
      trim:true,
    },
    fullname:{
      type:String,
      required:true,
      trim:true,
      index:true
    },
     avatar:{
      type:String,
      required:true
    },
     coverimage:{
      type:String,
    },
    watchHistory:[
      {
        type:mongoose.Schema.Types.ObjectId,
        ref:"Video"
      }
    ],
    password:{
      type:String,
      required:[true,"Password is required"]
    },
    refreshtoken:{
      type:String
    }
  },{timestamps:true}
);
 
// this time do not use arrow function because its not provided the this context ,aur this keyword power thrn use normal function with async and await because it is time consumeing process

// so writes in this way
userSchema.pre("save", async function (next) {
  if(!this.isModified("password")) return next();
  this.password= await bcrypt.hash(this.password,10)
  next() // yaha next call karne se yeh problem ayega ki jab bhi koi field save hogi tho phir se pass word set hoga jise complexity badegi aur problem hogi tho 

  // jab password mai koi change perform ho tabhi voh change ho new concept and learning
})

// aur agar mere yeh validate bhi kar degi sahi hai ki nhi mera password ko bcrypt library
userSchema.methods.isPasswordCorrect=async function(password){
  return await bcrypt.compare(password,this.password)
}

userSchema.methods.generateAccessToken = function(){
    return jwt.sign(
        {
            _id: this._id,
            email: this.email,
            username: this.username,
            fullname: this.fullName
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}
 
userSchema.methods.generateRefreshToken = function(){
    return jwt.sign(
        {
            _id: this._id,
            
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY
        }
    )
}

export const user=mongoose.model("User",userSchema)
import mongoose from "mongoose";

const likeSchema=new mongoose.Schema(
  {
    video:{
      type:mongoose.Schema.Types.ObjectId,
      ref:"Video"
    },
    comment:{
      type:mongoose.Schema.Types.ObjectId,
      ref:"Comment"
    },
    likedby:{
      type:mongoose.Schema.Types.ObjectId,
      ref:"User"
    },
    likedby:{
      type:mongoose.Schema.Types.ObjectId,
      ref:"Tweet"
    }
  },{timestamps:true}
)




export const comment=mongoose.model("Like",likeSchema)
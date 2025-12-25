import mongoose from "mongoose";


const tweetSchema=new mongoose.Schema(
  {
    content:{
      type:string,
      required:true
    },
    owner:{
      type:mongoose.Schema.Types.ObjectId,
      ref:"User"
    }
  },{timestamps:true}
)


export const comment=mongoose.model("Tweet",tweetSchema)
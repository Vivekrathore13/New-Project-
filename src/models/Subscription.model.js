import mongoose, { Schema } from "mongoose";

const SubsSchema=new mongoose.Schema(
  {
    subscriber:{
      type:mongoose.Schema.Types.ObjectId,
      // one who is subscribing
      ref:"User"
    },
    channel:{
      type:mongoose.Schema.Types.ObjectId,
      //one to whom is subscribing
      ref:"User"
    }
  },{timestamps:true}
)

export const Subs= mongoose.model("Subscription",SubsSchema)
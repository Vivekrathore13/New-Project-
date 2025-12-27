
import mongoose, { isValidObjectId } from "mongoose"
import {Tweet} from "../models/tweet.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const createTweet = asyncHandler(async (req, res) => {
    //TODO: create tweet
    //sabse pahel mujhe tweet create karna hai tho mujhe 

    //steps 

/*  1.-> user ko validate karna hoga ki user hai ki nhihai 
    2.-> get content from user by its user id 
    3-> user ke tweet ko db mai store karna hoga using crud operations
    4-> phir save karna hoga 
*/

const {content}=req.body

const validuser= await User.findById(req.user._id)

if(!validuser){
  throw new ApiError(401,"user is not valid for tweet")
}

if (!content?.trim()) {
  throw new ApiError(400, "Content is required")
}


const tweet= await Tweet.create({content,owner:req.user._id})


if(!tweet){
  throw new ApiError(500,"something wrong while in creating usertweet")
}

return res.status(201).json(
  new ApiResponse(201,tweet,"tweet created successfully")
)

})

const getUserTweets = asyncHandler(async (req, res) => {
    // TODO: get user tweets

    const {userId}=req.params
    
    if(!userId){
      throw new ApiError(404,"User id not Found")
    }

    const existedUser= await User.findById(userId)

    if(!existedUser){
      throw new ApiError(401,"User can't exist")
    }

    const userTweet= await Tweet.aggregate([
      {
        $match:{
          owner: new mongoose.Types.ObjectId(userId)
        },
      },
        {
          $sort:{createdAt:-1}
      },
      {
        $lookup:{
          from:"users",
          foreignField:"_id",
          localField:"owner",
          as:"ownerinfo",
          pipeline:[{
            $project:{
              username:1,
              fullName:1,
              avatar:1
            }
          }]
        }
      },
      {
        $unwind:{
          path:"$ownerinfo",
          preserveNullAndEmptyArrays:true
        }
      },
      {
        $addFields:{
            username:"$ownerinfo.username",
            fullName:"$ownerinfo.fullName",
            avatar:"$ownerinfo.avatar"
        }
      },
      {
        $project:{
              content:1,
              username:1,
              fullName:1,
              avatar:1,
              createdAt:1,
              updatedAt:1
        }
      }
    ])
    return res.status(200).json(
      new ApiResponse(200,{tweets:userTweet})
    )
})

const updateTweet = asyncHandler(async (req, res) => {
    //TODO: update tweet
    const {tweetId}=req.params
    if(!tweetId){
      throw new ApiError(401,"tweet id not exist")
    }
    const existingTweet = await Tweet.findById(tweetId);
    if(!existingTweet){
      throw new ApiError(401,"Tweet not found")
    }

    //owner authorization 

    if(!existingTweet.owner.equals(req.user?._id)){
      throw new ApiError(403,"user unauthorized to perform this action")
    }
    const { content } = req.body;
    if(!content || !content.trim()){
      throw new ApiError(400,"content must not be empty")
    }

    existingTweet.content=content.trim()

    await existingTweet.save();

    return res.status(200).json(
      new ApiResponse(200,{tweet:existingTweet},"Tweet update sucessfully")
    )
})

const deleteTweet = asyncHandler(async (req, res) => {
    //TODO: delete tweet
    const {tweetId}=req.params
     if(!tweetId){
      throw new ApiError(401,"tweet id not exist")
    }
    const existingTweet = await Tweet.findById(tweetId);
    if(!existingTweet){
      throw new ApiError(401,"Tweet not found")
    }
    if(!existingTweet.owner.equals(req.user?._id)){
      throw new ApiError(403,"user unauthorized to perform this action")
    }

    await Tweet.findByIdAndDelete(tweetId);

    return res.status(200).json(
      new ApiResponse(200,{},"Tweet delete sucessfully")
    )
})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}

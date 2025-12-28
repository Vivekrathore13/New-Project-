import mongoose, {isValidObjectId} from "mongoose"
import {User} from "../models/user.model.js"
import { Subscription } from "../models/subscription.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const toggleSubscription = asyncHandler(async (req, res) => {
    const {channelId} = req.params
    // TODO: toggle subscription
    if(!channelId){
        throw new ApiError(400,"channel id is not found")
    }
    const userExist=await User.findById(req.user._id)
    if(!userExist){
        throw new ApiError(404,"user not found")
    }

    const channel = await User.findById(channelId)

    if(!channel){
        throw new ApiError(400,"channel not exist")
    }

    const existingSub  = await Subscription.findOne({
    channel: channelId,
    subscriber: req.user._id,
  });

  if(existingSub){
    const count=await Subscription.findByIdAndDelete(existingSub._id)
    return res.status(200).json(
        new ApiResponse(200,{subscribed:false ,subscribers:count},"Subscription Remove")
    )
  }

  const newSubscriber = await Subscription.create({
    channel: channelId,
    subscriber: req.user._id,
  });

  const count = await Subscription.countDocuments({
    channel: channelId,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, { subscribed: true, subscribers:count }, "Channel subscribed"));
})

/*
Steps

get channelId from params
validate that channelId exists
validate channelId is a valid Mongo ObjectId
check whether channel (User) exists in DB
find all subscribers in Subscription model where
channel = channelId
optionally populate subscriber details (username, avatar etc.)
return:
total subscriber count
list of subscribers
handle empty list case (return 0 subscribers)
*/
// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
  const { channelId } = req.params;

  if (!channelId) {
    throw new ApiError(400, "Channel id not found");
  }

  // check channel exists
  const channel = await User.findById(channelId).select("-password -refreshToken");
  if (!channel) {
    throw new ApiError(404, "Channel not found");
  }

  const subscribers = await Subscription.aggregate([
    {
      $match: {
        channel: new mongoose.Types.ObjectId(channelId),
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "subscriber",
        foreignField: "_id",
        as: "subscriberInfo",
        pipeline: [
          {
            $project: {
              username: 1,
              fullName: 1,
              avatar: 1,
            },
          },
        ],
      },
    },
    {
      $unwind: "$subscriberInfo",
    },
    {
      $project: {
        _id: 0,
        subscriberId: "$subscriberInfo._id",
        username: "$subscriberInfo.username",
        fullName: "$subscriberInfo.fullName",
        avatar: "$subscriberInfo.avatar",
      },
    },
  ]);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        totalSubscribers: subscribers.length,
        subscribers,
      },
      "Subscribers fetched successfully"
    )
  );
});


/*
Steps

get subscriberId from params
validate that subscriberId exists
validate subscriberId is valid Mongo ObjectId
check user exists in DB
find all subscriptions in Subscription model where
subscriber = subscriberId
optionally populate channel details (name, avatar etc.)
return:
total subscribed channel count
list of channels
handle case when user hasn't subscribed to anyone yet
*/

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params

    if(!subscriberId){
        throw new ApiError(400,"subscribe id is not exist")
    }

    const existUser=await User.findById(subscriberId).select("-password,-refreshToken")

    if(!existUser){
        throw new ApiError(404,"user not found")
    }

    const getChannels=await Subscription.aggregate([
        {
            $match:{
                subscriber:new mongoose.Types.ObjectId(subscriberId)
            }
        },
        {
            $lookup:{
                from:"users",
                foreignField:"_id",
                localField:"channel",
                as:"ChannelInfo",
                pipeline:[
                    {
                        $project:{
                            username: 1,
                            fullName: 1,
                            avatar: 1
                        }
                    }
                ]
            }
        },{
        $unwind:{
            path: "$ChannelInfo",
            preserveNullAndEmptyArrays: true
        }
    },{
        $project:{
            _id: 0,
            channelId: "$ChannelInfo._id",
            username: 1,
            fullName: 1,
            avatar: 1
        }
    }
    ])
    return res.status(200).json(new ApiResponse(200 , {subscriber: getChannels , totalSubscribedChannels: getChannels.length} , "all channel details subscribed by the subscriber are fetched successfully"))
})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}
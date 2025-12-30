import mongoose from "mongoose";
import { Video } from "../models/video.model.js";
import { Subscription } from "../models/subscription.model.js";
import { Like } from "../models/like.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const getChannelStats = asyncHandler(async (req, res) => {
  // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.
  const { channelId } = req.params;

  if (!channelId) {
    throw new ApiError(400, "Channel id not found");
  }

  const videoStats = await Video.aggregate([
    {
      $match: {
        owner: new mongoose.Types.ObjectId(channelId),
      },
    },
    {
      $lookup: {
        from: "likes",
        foreignField: "_id",
        localField: "video",
        as: "likes",
      },
    },
    {
      $group: {
        _id: null,
        totalVideos: { $sum: 1 },
        totalViews: { $sum: "$views" },
        totalLikes: { $sum: { $size: "$likes" } },
      },
    },
  ]);
  const stats = videoStats[0] || {
    totalVideos: 0,
    totalViews: 0,
    totalLikes: 0,
  };

  // ---------- SUBSCRIBER COUNT ----------
  const subscriberCount = await Subscription.countDocuments({
    channel: channelId,
  });

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        totalVideos: stats.totalVideos,
        totalViews: stats.totalViews,
        totalLikes: stats.totalLikes,
        totalSubscribers: subscriberCount,
      },
      "Channel stats fetched successfully"
    )
  );
});

const getChannelVideos = asyncHandler(async (req, res) => {

  const { channelId } = req.params;

  if (!channelId) {
    throw new ApiError(400, "Channel id is not found");
  }

  if (!isValidObjectId(channelId)) {
    throw new ApiError(400, "Invalid channel id");
  }

  const ChannelExist = await User.findById(channelId);

  if (!ChannelExist) {
    throw new ApiError(404, "Channel not found");
  }

  const ChannelVideos = await Video.aggregate([
    {
      $match: {
        owner: new mongoose.Types.ObjectId(channelId),
        isPublished: true,
      },
    },

    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "ownerInfo",
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
      $unwind: {
        path: "$ownerInfo",
        preserveNullAndEmptyArrays: true,
      },
    },

    {
      $project: {
        owner: 0,
      },
    },
  ]);

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { videos: ChannelVideos },
        "All the videos have been fetched successfully"
      )
    );
});


export { getChannelStats, getChannelVideos };

import mongoose, { isValidObjectId } from "mongoose";
import { Like } from "../models/like.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";
import { application } from "express";
import {Video} from "../models/video.model.js"
import {Comment} from "../models/comment.model.js"
import {Tweet} from "../models/tweet.model.js"

const toggleVideoLike = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: toggle like on video
  if (!videoId) {
    throw new ApiError(400, "Video id is not found");
  }

  const existedUser = await User.findById(req.user._id);

  if (!existedUser) {
    throw new ApiError(401, "user cannot exist");
  }
  const videoexist = await Video.findById(videoId);

  if (!videoexist) {
    throw new ApiError(404, "video is not exist in db ");
  }

  const existingLike = await Like.findOne({
    video: videoId,
    likedBy: req.user._id,
  });

  if (existingLike) {
    await Like.findByIdAndDelete(existingLike._id);
    return res
      .status(200)
      .json(new ApiResponse(200, { likedBy: false }, "Liked remove"));
  }

  const newLike = await Like.create({
    video: videoId,
    likedBy: req.user._id,
  });

  const likeCount = await Like.countDocuments({
    video: videoId,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, { likedBy: true, likeCount }, "Video Liked"));
});

const toggleCommentLike = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  //TODO: toggle like on comment
  if (!commentId) {
    throw new ApiError(400, "CommentId is not found");
  }

  const existedUser = await User.findById(req.user._id);

  if (!existedUser) {
    throw new ApiError(401, "User not Found");
  }

  const comment = await Comment.findById(commentId);

  if (!comment) {
    throw new ApiError(400, "Comment not exist");
  }

  const existingCommentLike = await Like.findOne({
    comment: commentId,
    likedBy: req.user._id,
  });

  if (existingCommentLike) {
    await Like.findByIdAndDelete(existingCommentLike._id);

    const commentLikeCount = await Like.countDocuments({
      comment: commentId,
    });

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { liked: false, likeCount: commentLikeCount },
          "Comment like removed"
        )
      );
  }
  // -------- LIKE ----------
  await Like.create({
    comment: commentId,
    likedBy: req.user._id,
  });

  const commentLikeCount = await Like.countDocuments({
    comment: commentId,
  });

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { liked: true, likeCount: commentLikeCount },
        "Comment liked"
      )
    );
});

const toggleTweetLike = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;
  //TODO: toggle like on tweet
  if (!tweetId) {
    throw new ApiError(400, "tweet id is not found");
  }

  const tweet = await Tweet.findById(tweetId);

  if (!tweet) {
    throw new ApiError(404, "Tweet does not exist");
  }

  const existedUser = await User.findById(req.user._id);

  if (!existedUser) {
    throw new ApiError(401, "user does not exist");
  }

  const existingTweetLike = await Like.findOne({
    tweet: tweetId,
    likedBy: req.user._id,
  });

  if (existingTweetLike) {
    await Like.findByIdAndDelete(existingTweetLike._id);

    const likeCount = await Like.countDocuments({
      tweet: tweetId,
    });
    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { likeCount, liked: false },
          "Liked remove by tweet"
        )
      );
  }

  await Like.create({
    tweet: tweetId,
    likedBy: req.user._id,
  });

  const likeCount = await Like.countDocuments({
    tweet: tweetId,
  });
  return res
    .status(200)
    .json(new ApiResponse(200, { liked: true, likeCount }, "tweet liked"));
});

const getLikedVideos = asyncHandler(async (req, res) => {


  const likedVideos = await Like.aggregate([
    {
      $match: {
        likedBy: new mongoose.Types.ObjectId(req.user._id),
        video: { $exists: true, $ne: null }
      }
    },
    {
      $lookup: {
        from: "videos",
        localField: "video",
        foreignField: "_id",
        as: "videoDetails"
      }
    },
    { $unwind: "$videoDetails" },
    {
      $lookup: {
        from: "users",
        localField: "videoDetails.owner",
        foreignField: "_id",
        as: "ownerInfo",
        pipeline: [
          {
            $project: {
              username: 1,
              fullName: 1,
              avatar: 1
            }
          }
        ]
      }
    },
    { $unwind: "$ownerInfo" },
    {
      $addFields: {
        "videoDetails.owner": "$ownerInfo"
      }
    },
    {
      $replaceRoot: {
        newRoot: "$videoDetails"
      }
    }
  ]);

  const likeCount = likedVideos.length;

  return res.status(200).json(
    new ApiResponse(
      200,
      { likedVideos, likeCount },
      "Liked video details fetched successfully"
    )
  );
});


export { toggleCommentLike, toggleTweetLike, toggleVideoLike, getLikedVideos };

import mongoose from "mongoose";
import { Comment } from "../models/comment.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Video } from "../models/video.model.js";
import { User } from "../models/user.model.js";
import { Like } from "../models/like.model.js";
import { create } from "domain";

/*
Steps

get videoId from params
get page and limit from query
validate video exists
fetch comments:
filter by videoId
skip = (page − 1) × limit
limit
sort newest first
populate user fields (optional)
username
avatar
return:
comments list
total count (optional)
page info
*/
const getVideoComments = asyncHandler(async (req, res) => {
  //TODO: get all comments for a video
  const { videoId } = req.params;
  const { page = 1, limit = 10 } = req.query;

  if(!videoId){
    throw new ApiError(400,"video id is not found")
  }

  const videoexist= await Video.findById(videoId)

  if(!videoexist){
    throw new ApiError(400,"video not found")
  }
  const options = {
    page: parseInt(page),
    limit: parseInt(limit),
  };

  const filteredPaginatedComment= await Comment.aggregatePaginate(Comment.aggregate([

    {
        $match:{
            video: new mongoose.Types.ObjectId(videoId)
        }
    },
    {
        $sort:{
            createdAt:-1
        }
    },
    {
        $lookup:{
            from:"users",
            foreignField:"_id",
            localField:"owner",
            as:"owner"
        },
    },
    {
        $unwind:"$owner"
    },
    {
        $project:{
            content:1,
            createdAt:1,
             "owner._id": 1,
             "owner.username": 1,
             "owner.fullName": 1,
             "owner.avatar": 1
        }
    }
  ]),options
);
     return res.status(200).json(
    new ApiResponse(
      200,
      filteredPaginatedComment,
      "Video comments fetched successfully"
    )
  );
});

/*
Steps (logic only)
get videoId from params
get content from body
validate:
content not empty
valid videoId
check video exists in DB
create comment:
content
videoId
req.user._id (owner)
return:
success message
created comment
*/
const addComment = asyncHandler(async (req, res) => {
  // TODO: add a comment to a video
  const {videoId}=req.params
  const {content}=req.body

  if(!videoId){
    throw new ApiError(400,"Video id is not found")
  }

  if(!content){
    throw new ApiError(400,"content is not found")
  }
  const validuser= await User.findById(req.user._id)
  
  if(!validuser){
    throw new ApiError(401,"user is not valid for tweet")
  }
  
  if (!content?.trim()) {
    throw new ApiError(400, "Content is required")
  }
    const videoexist = await Video.findById(videoId)
    if(!videoexist){
        throw new ApiError(400,"video is not found")
    }

  const comment= await Comment.create({content,owner:req.user._id , video:videoId})

  if(!comment){
  throw new ApiError(500,"Something went wrong while creating comment")
}

return res.status(201).json(
  new ApiResponse(201,comment,"success comment created successfully")
)

});

/*
Steps

get commentId from params
get newContent from body
check comment exists
check logged user is owner:
comment.owner === req.user._id
update content
save
return updated comment
*/
const updateComment = asyncHandler(async (req, res) => {
  // TODO: update a comment
  const {commentId}=req.params
  if(!commentId){
    throw new ApiError(400,"commend id is required")
  }
  const commentExist= await Comment.findById(commentId)

  if(!commentExist){
    throw new ApiError(400,"comment is not found")
  }
 
  if(!commentExist.owner.equals(req.user?._id)){
    throw new ApiError(403,"user unauthorized to perform this action")
  }

  const { content } = req.body;
      if(!content || !content.trim()){
        throw new ApiError(400,"content must not be empty")
      }
  
      commentExist.content=content.trim()
      await commentExist.save();
      return res.status(200).json(
      new ApiResponse(200,{comment:commentExist},"comment update successfully")
    )
});
/*
Steps

get commentId from params
check comment exists
check ownership
delete comment
optionally delete likes related to comment
return success
*/
const deleteComment = asyncHandler(async (req, res) => {
  // TODO: delete a comment
  const {commentId}=req.params
  if(!commentId){
    throw new ApiError(400,"comment id is not found")
  }

  const commentExist= await Comment.findById(commentId)

  if(!commentExist){
    throw new ApiError(404,"comment is not found")
  }
 
  if(!commentExist.owner.equals(req.user?._id)){
    throw new ApiError(403,"user unauthorized to perform this action")
  }

  await Comment.findByIdAndDelete(commentId);

  await Like.deleteMany({ comment: commentId });

  
      return res.status(200).json(
        new ApiResponse(200,{},"Comment delete sucessfully")
      )
});

export { getVideoComments, addComment, updateComment, deleteComment };

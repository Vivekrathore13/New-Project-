import mongoose, { isValidObjectId, skipMiddlewareFunction } from "mongoose";
import { Playlist } from "../models/playlist.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";
import { Video } from "../models/video.model.js";

const createPlaylist = asyncHandler(async (req, res) => {
  const { name, description } = req.body;

  //TODO: create playlist

  if ([name, description].some((field) => field?.trim() === "")) {
    throw new ApiError(400, "All fields are required");
  }
  const userExist=await User.findById(req.user?._id).select("-password -refreshToken")

  if(!userExist){
    throw new ApiError(404,"User not found")
  }
  const exists = await Playlist.findOne({
  owner: req.user._id,
  name: name.trim(),
});

  const newPlaylist= await Playlist.create({
    name:name.trim(),
    description:description.trim(),
    owner: req.user._id,        // 🔥 IMPORTANT: link playlist to user
    videos: [],
  })
   return res.status(200).json(
    new ApiResponse(
      200,
      {playlist:newPlaylist},
      "new playlist has been added successfully"
    )
  );
});

const getUserPlaylists = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  //TODO: get user playlists
  if(!userId){
    throw new ApiError(400,"user id is not exist")
  }

  const userExist=await User.findById(userId)

  if(!userExist){
    throw new ApiError(400, "user is not found")
  }

  const PlayListCollection=await Playlist.findById(userId).select("-password -refreshToken")

  if(!PlayListCollection){
    throw new ApiError(404,"PlayList is not found")
  }

  const playlistWithVideoCount = PlayListCollection.map(pl => ({
        ...pl,
        videoCount: pl.videos.length
    }))
     return res.status(200).json(new ApiResponse(200 , {playlists: playlistWithVideoCount}, "user playlists has been fetched successfully"))
});

const getPlaylistById = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    //TODO: get playlist by id
    if(!playlistId){
        throw new ApiError(400 , "playlist id is required");
    }
    const isPlaylistExist = await Playlist.findById(playlistId);
    if(!isPlaylistExist){
        throw new ApiError(404 , "playlist not found");
    }
  const playlistVideos =   await Playlist.aggregate([{
        $match:{
            _id: new mongoose.Types.ObjectId(playlistId)
        }
    },
    {
        $lookup:{
            from: "videos",
            foreignField: "_id",
            localField: "videos",
            as: "playlistVideos",
            pipeline:[
                {
                    $lookup:{
                        from: "users",
                        foreignField: "_id",
                        localField: "owner",
                        as: "videoOwner",
                        pipeline:[{
                            $project:{
                                username: 1,
                                fullName: 1,
                                avatar: 1
                            }
                        }]
                    }
                },
                {
                    $unwind:{
                        path: "$videoOwner",
                        preserveNullAndEmptyArrays: true
                    }
                },
                {
                    $addFields:{
                        owner: "$videoOwner"
                    }
                },
                {
                    $project:{
                        videoOwner: 0
                    }
                },
                {
                    $sort:{
                        createdAt: -1
                    }
                }
            ]
        },
        
    },
    {
        $lookup:{
            from: "users",
            foreignField: "_id",
            localField: "owner",
            as: "playlistOwner"
        }
    },
    {
        $unwind:{
            path: "$playlistOwner",
            preserveNullAndEmptyArrays: true
        }
    },
    {
        $addFields:{
            videoCount: {
                $size: "$playlistVideos"
            },
            playlistUsername: "$playlistOwner.username",
            playlistFullName: "$playlistOwner.fullName",
            playlistAvatar: "$playlistOwner.avatar"
        }
    },
    {
        $project:{
            name: 1,
            description: 1,
            playlistUsername: 1,
            playlistFullName: 1,
            playlistAvatar: 1,
            playlistVideos: 1,
            videoCount: 1,
            createdAt: 1,
            updatedAt: 1
        }
    }])
    if(!playlistVideos.length){
        throw new ApiError(404 , "playlist is missing")
    }
    return res.status(200).json(new ApiResponse(200 , {playlist: playlistVideos[0]} , "all the videos with their owner of playlist has been fetched successfully"));
})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params;

  if(!playlistId || !videoId){
    throw new ApiError(400,"Playlist id and Video Id is not found")
  }

  const ExistPlaylist=await Playlist.findById(playlistId)
  const ExistVideo=await Video.findById(videoId)

  if(!ExistPlaylist){
    throw new ApiError(404,"PlayList is Not Found")
  }

   if(!ExistVideo){
    throw new ApiError(404,"Video is Not Found")
  }

 const alreadyPresent = (ExistPlaylist.videos || []).includes(videoId);


if (alreadyPresent) {
  throw new ApiError(400, "Video already exists in this playlist");
}


await Playlist.findByIdAndUpdate(
  playlistId,
  { $addToSet: { videos: videoId } },   // prevents duplicates automatically
  { new: true }
);


return res.status(200).json(
    new ApiResponse(
      200,
      ExistPlaylist,
      "Video added to playlist successfully"
    )
  );

});

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params;

  if (!playlistId || !videoId) {
    throw new ApiError(400, "Playlist id and Video id are required");
  }

  const ExistPlaylist = await Playlist.findById(playlistId);
  const ExistVideo = await Video.findById(videoId);

  if (!ExistPlaylist) {
    throw new ApiError(404, "Playlist not found");
  }

  if (!ExistVideo) {
    throw new ApiError(404, "Video not found");
  }

  // owner authorization
  if (!ExistPlaylist.owner.equals(req.user?._id)) {
    throw new ApiError(403, "User unauthorized to perform this action");
  }

  // check if video exists in playlist
  const isPresent = ExistPlaylist.videos.some(
    (v) => v.toString() === videoId.toString()
  );

  if (!isPresent) {
    throw new ApiError(400, "Video does not exist in this playlist");
  }

  // remove video
  ExistPlaylist.videos.pull(videoId);

  await ExistPlaylist.save();

  return res.status(200).json(
    new ApiResponse(
      200,
      ExistPlaylist,
      "Video removed from playlist successfully"
    )
  );
});


const deletePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;

  if (!playlistId) {
    throw new ApiError(400, "Playlist id is required");
  }

  const existPlaylist = await Playlist.findById(playlistId);

  if (!existPlaylist) {
    throw new ApiError(404, "Playlist not found");
  }

  // owner authorization
  if (!existPlaylist.owner.equals(req.user?._id)) {
    throw new ApiError(403, "User unauthorized to perform this action");
  }

  await Playlist.findByIdAndDelete(playlistId);

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        {},
        "Playlist deleted successfully"
      )
    );
});


const updatePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  const { name, description } = req.body;

  if (!playlistId) {
    throw new ApiError(400, "Playlist id is required");
  }

  const existPlaylist = await Playlist.findById(playlistId);

  if (!existPlaylist) {
    throw new ApiError(404, "Playlist not found");
  }

  // owner authorization
  if (!existPlaylist.owner.equals(req.user?._id)) {
    throw new ApiError(403, "User unauthorized to perform this action");
  }

  // update fields only if provided
  if (name) {
    existPlaylist.name = name.trim();
  }

  if (description) {
    existPlaylist.description = description.trim();
  }

  await existPlaylist.save();

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        existPlaylist,
        "Playlist updated successfully"
      )
    );
});

export {
  createPlaylist,
  getUserPlaylists,
  getPlaylistById,
  addVideoToPlaylist,
  removeVideoFromPlaylist,
  deletePlaylist,
  updatePlaylist,
};

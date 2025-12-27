import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/video.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { 
  deleteFromCloudinary, 
  getPublicIdFromUrl, 
  uploadOnCloudinary 
} from "../utils/cloudinary.js";

const getAllVideos = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    query = "",
    sortBy = "createdAt",
    sortType = "desc",
    userId,
  } = req.query;

  const sortOrder = sortType === "asc" ? 1 : -1;

  const options = {
    page: parseInt(page),
    limit: parseInt(limit),
  };

  const filteredPaginatedVideos = await Video.aggregatePaginate(
    Video.aggregate([
      {
        $match: {
          isPublished: true,
          $or: [
            { title: { $regex: query, $options: "i" } },
            { description: { $regex: query, $options: "i" } },
          ],
          ...(userId && { owner: new mongoose.Types.ObjectId(userId) }),
        },
      },
      { $sort: { [sortBy]: sortOrder } },
      {
        $lookup: {
          from: "users",
          localField: "owner",
          foreignField: "_id",
          as: "ownerInfo",
          pipeline: [
            { $project: { username: 1, fullName: 1, avatar: 1 } }
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
          title: 1,
          description: 1,
          thumbnail: 1,
          duration: 1,
          views: 1,
          createdAt: 1,
          "owner.username": "$ownerInfo.username",
          "owner.fullName": "$ownerInfo.fullName",
          "owner.avatar": "$ownerInfo.avatar",
        },
      },
    ]),
    options
  );

  return res.status(200).json(
    new ApiResponse(
      200,
      filteredPaginatedVideos,
      "Published videos with owner info fetched successfully"
    )
  );
});


// ---------------------- CLOUDINARY VERSION ----------------------

const publishAVideo = asyncHandler(async (req, res) => {
  const { title, description } = req.body;

  if ([title, description].some((field) => field?.trim() === "")) {
    throw new ApiError(400, "This fields are required");
  }

  const existedUser = await User.findById(req.user._id);
  if (!existedUser) {
    throw new ApiError(401, "unsuthorized error");
  }

  // thumbnail upload to cloudinary
  if (
    !req.files?.thumbnail?.length ||
    !req.files.thumbnail[0].path
  ) {
    throw new ApiError(400, "thumbnail file is missing");
  }

  const thumbnailUrl = await uploadOnCloudinary(
    req.files.thumbnail[0].path
  );

  // video upload to cloudinary
  if (
    !req.files?.videoFile?.length ||
    !req.files.videoFile[0].path
  ) {
    throw new ApiError(400, "video file is missing");
  }

  const videoFileUrl = await uploadOnCloudinary(
    req.files.videoFile[0].path,
    "video"
  );

  if (!thumbnailUrl?.url || !videoFileUrl?.url) {
    throw new ApiError(
      500,
      "error uploading video files or thumbnail on cloudinary"
    );
  }

  const newVideo = await Video.create({
    title: title.trim(),
    description: description.trim(),
    thumbnail: thumbnailUrl.url,
    videoFile: videoFileUrl.url,
    owner: req.user?.id,
    duration: videoFileUrl.duration,
  });

  return res.status(200).json(
    new ApiResponse(
      200,
      { video: newVideo },
      "new video has been added successfully"
    )
  );
});


// ---------------------- GET BY ID ----------------------

const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!videoId) {
    throw new ApiError(404, "Video id is not found");
  }

  const videoget = await Video.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(videoId),
      },
    },
    {
      $lookup: {
        from: "users",
        foreignField: "_id",
        localField: "owner",
        as: "ownerinfo",
        pipeline: [
          { $project: { username: 1, fullName: 1, avatar: 1 } }
        ],
      },
    },
    {
      $unwind: {
        path: "$ownerinfo",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $addFields: {
        username: "$ownerinfo.username",
        fullName: "$ownerinfo.fullName",
        avatar: "$ownerinfo.avatar",
      },
    },
    { $project: { owner: 0 } },
  ]);

  if (!videoget.length) {
    throw new ApiError(404, "video not found");
  }

  return res.status(200).json(
    new ApiResponse(
      200,
      { videoget: videoget[0] },
      "videos are get successfully"
    )
  );
});


// ---------------------- UPDATE VIDEO (CLOUDINARY THUMBNAIL) ----------------------

const updateVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const { title, description } = req.body;

  if (!videoId) {
    throw new ApiError(400, "video id is not provided");
  }

  const existingVideo = await Video.findById(videoId);
  if (!existingVideo) {
    throw new ApiError(404, "video not found");
  }

  if (String(existingVideo.owner) !== req.user?.id) {
    throw new ApiError(402, "Unauthorized for this action");
  }

  const oldThumbnail = existingVideo.thumbnail;

  let thumbnailUrl;

  // if new thumbnail uploaded → replace on cloudinary
  if (req.file?.path) {
    if (oldThumbnail) {
      const publicId = getPublicIdFromUrl(oldThumbnail);
      await deleteFromCloudinary(publicId);
    }

    const uploaded = await uploadOnCloudinary(req.file.path);
    thumbnailUrl = uploaded.url;
  }

  existingVideo.title = title?.trim() || existingVideo.title;
  existingVideo.description =
    description?.trim() || existingVideo.description;
  existingVideo.thumbnail = thumbnailUrl || existingVideo.thumbnail;

  await existingVideo.save();

  return res.status(200).json(
    new ApiResponse(
      200,
      { newVideo: existingVideo },
      "video updated successfully"
    )
  );
});


// ---------------------- DELETE VIDEO (FULL CLOUDINARY CLEAN) ----------------------

const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!videoId) {
    throw new ApiError(400, "video id is not provided");
  }

  const existingVideo = await Video.findById(videoId);
  if (!existingVideo) {
    throw new ApiError(404, "video not found");
  }

  if (String(existingVideo.owner) !== req.user?.id) {
    throw new ApiError(402, "unauthorized to perform this action");
  }

  if (existingVideo.thumbnail) {
    const thumbId = getPublicIdFromUrl(existingVideo.thumbnail);
    await deleteFromCloudinary(thumbId);
  }

  if (existingVideo.videoFile) {
    const videoIdPublic = getPublicIdFromUrl(existingVideo.videoFile);
    await deleteFromCloudinary(videoIdPublic);
  }

  await Video.findByIdAndDelete(videoId);

  return res.status(200).json(
    new ApiResponse(200, {}, "video deleted successfully")
  );
});


// ---------------------- TOGGLE ----------------------

const togglePublishStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!videoId) {
    throw new ApiError(400, "video id is not provided");
  }

  const existingVideo = await Video.findById(videoId);
  if (!existingVideo) {
    throw new ApiError(404, "video not found");
  }

  if (String(existingVideo.owner) !== req.user?.id) {
    throw new ApiError(402, "unauthorized to perform this action");
  }

  existingVideo.isPublished = !existingVideo.isPublished;
  await existingVideo.save();

  const status = existingVideo.isPublished
    ? "Published"
    : "Unpublished";

  return res.status(200).json(
    new ApiResponse(
      200,
      { video: existingVideo, status },
      `video has been ${status.toLowerCase()} successfully`
    )
  );
});

export {
  getAllVideos,
  publishAVideo,
  getVideoById,
  updateVideo,
  deleteVideo,
  togglePublishStatus,
};

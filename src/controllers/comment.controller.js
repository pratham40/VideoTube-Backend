import { Comment } from "../models/comment.model.js";
import { Video } from "../models/video.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js"

const addComment = asyncHandler(async (req, res) => {
    // TODO: add a comment to a video
    const {comment} = req.body;

    const {videoId} = req.params

    if (!comment) {
        throw new ApiError(400,"comment length is greater than 0")
    }

    const video = await Video.findById(videoId)

    if (!video) {
        throw new ApiError(404,"video is required for comment")
    }

    const videoComment = await Comment.create({
        content:comment,
        video:videoId,
        Owner:req.user._id
    })

    if (!videoComment) {
        throw new ApiError(500,"error in adding comment to video")
    }

    return res.status(201).json(
        new ApiResponse(200,videoComment,"comment added to video successfully")
    )
})


export {
    addComment
}
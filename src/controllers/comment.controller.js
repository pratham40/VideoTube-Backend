import mongoose from "mongoose";
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


const getVideoComments = asyncHandler(async (req, res) => {
    //TODO: get all comments for a video
    const {videoId} = req.params
    const {page = 1, limit = 3} = req.query

    const video = await Video.findById(videoId)

    if (!video) {
        throw new ApiError(404,"video not found")
    }

    const videoComments = Comment.aggregate([
        {
            $match:{
                video:new mongoose.Types.ObjectId(videoId)
            }
        },
        {
            $sort:{
                createdAt:-1
            }
        }
    ])

    const options = {
        page:parseInt(page),
        limit:parseInt(limit)
    }
    
    const aggregateComments=await Comment.aggregatePaginate(videoComments,options)

    if (!aggregateComments) {
        throw new ApiError(500,"error in while fetching video comments")
    }

    return res.status(200).json(
        new ApiResponse(200,aggregateComments,"video comment fetched successfully")
    )
})


const updateComment = asyncHandler(async (req, res) => {
    // TODO: update a comment
    const {commentId} = req.params

    const {updateComment} = req.body

    const comment = await Comment.findById(commentId)

    if (!comment) {
        throw new ApiError(404,"comment not found")
    }

    const updatedComment = await Comment.findByIdAndUpdate(commentId,{
        $set:{
            content:updateComment
        }
    },{new:true})

    if (!updateComment) {
        throw new ApiError(500,"error in updating comment")
    }

    return res.status(200).json(
        new ApiResponse(200,updateComment,"comment update successfully")
    )

})


const deleteComment = asyncHandler(async (req, res) => {
    // TODO: delete a comment
    const {commentId} = req.params

    console.log(commentId);
    

    const comment = await Comment.findById(commentId)

    if (!comment) {
        throw new ApiError(404,"comment not found")
    }

    const deleteComment = await Comment.findByIdAndDelete(commentId,{new:true})

    console.log(deleteComment);

    if (!deleteComment) {
        throw new ApiError(500,"error in deleting comment")
    }    

    return res.status(200).json(
        new ApiResponse(200,deleteComment,"comment delete successfully")
    )
})


export {
    addComment,
    getVideoComments,
    updateComment,
    deleteComment
}
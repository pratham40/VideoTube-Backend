import mongoose from "mongoose";
import { User } from "../models/user.model.js";
import { Video } from "../models/video.model.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

const getAllVideos = asyncHandler(async (req,res,next) => {
    try {
        const {page=1,limit=10,query,sortBy="createdAt",sortType=1,userId=req.user._id}=req.query
        const user = await User.findById(userId)
    
        if (!user) {
            throw new ApiError(400,"user not found")
        }


        console.log('====================================');
        console.log(userId);
        console.log('====================================');
        // TODO:
        
        const getAllVideosAggreate = Video.aggregate(
            [
                {
                    $match:{
                        owner:new mongoose.Types.ObjectId(userId),
                        $or:[
                            {
                                title:{
                                    $regex:query,$options:'i'
                                }
                            },
                            {
                                descriptions:{
                                    $regex:query,$options:'i'
                                }
                            }
                        ]
                    }
                },
                {
                    $lookup:{
                        from:"users",
                        localField:"owner",
                        foreignField:"_id",
                        as:"ownerDetails"
                    }
                },
                {
                    $sort:{
                        [sortBy]:parseInt(sortType)
                    }
                }
            ]
        )
        
        const options = {
            page:parseInt(page),
            limit:parseInt(limit)
        }

        console.log('====================================');
        console.log(getAllVideosAggreate);
        console.log('====================================');
    
        const fetchedVideo=await Video.aggregatePaginate(getAllVideosAggreate,options)
    
        return res.status(200).json(
            new ApiResponse(200,fetchedVideo,"fetched all video successfully")
        )
    } catch (error) {
        throw new ApiError(400,`error in fetching videos ${error}`)
    }
})

const publishVideo = asyncHandler(async (req,res,next) => {
    try {
        const {title,description} = req.body
    
        if (!title || !description){
            throw new ApiError(400,"title and descriptions are required")
        }
    
        const videoFilePath = req.files?.videoFile[0]?.path
        const thumbnailFilePath = req.files?.thumbnail[0]?.path
    
        if (!videoFilePath || !thumbnailFilePath) {
            throw new ApiError(400,"video file and thumbnail file are required")
        }
    
        const videoFile = await uploadOnCloudinary(videoFilePath)
    
        const thumbnailFile = await uploadOnCloudinary(thumbnailFilePath)

        console.log('====================================');
        console.log(videoFile);
        console.log('====================================');
    
        if(!videoFile || !thumbnailFile){
            throw new ApiError(500,'error in uploading cloudinary')
        }
    
        const video = await Video.create({
            videoFile:{
                public_id:videoFile?.public_id,
                secure_url:videoFile?.secure_url
            },
            thumbnail:{
                public_id:thumbnailFile?.public_id,
                secure_url:thumbnailFile?.secure_url
            },
            title,
            description,
            duration:videoFile.duration,
            owner:req.user._id
        })
    
        if (!video) {
            throw new ApiError(500,"wrong in database video")
        }
    
        return res.status(200).json(
            new ApiResponse(200,video,"video uploaded successfully")
        )   
    } catch (error) {
        throw new ApiError(500,`error in video publish ${error}`)
    }

})

export {
    getAllVideos,
    publishVideo
}
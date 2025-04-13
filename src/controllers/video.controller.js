import mongoose from "mongoose";
import { User } from "../models/user.model.js";
import { Video } from "../models/video.model.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { destroyOnCloudinary, uploadOnCloudinary } from "../utils/cloudinary.js";

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

        console.log(fetchedVideo);
        
    
        return res.status(200).json(
            new ApiResponse(200,{fetchedVideo:fetchedVideo.docs},"fetched all video successfully")
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

const getVideoById = asyncHandler(async (req, res) => {
    try {
        const { videoId } = req.params
        //TODO: get video by id
    
        const video = await Video.findById(videoId)
    
        if (!video) {
            throw new ApiError(400,"video not found");
        }
    
        return res.status(200).json(
            new ApiResponse(200,video,"video fetched successfully")
        )
    } catch (error) {
        throw new ApiError(500,error,"error in fetching video by id");
    }
})


const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: update video details like title, description, thumbnail

    const {title,description}=req.body;
    const thumbnailFilePath = req.file?.path

    if(!title && !description && !thumbnailFilePath){
        throw new ApiError(400,"please enter either title,descripition or thumbnail file")
    }

    try {
        const video = await Video.findById(videoId);
        if (!video) {
            throw new ApiError(400,"Video file not found")
        }

        const id1=video.owner.toString()
        const id2=req.user._id.toString()

        if (id1!=id2) {
            return res.status(400).json({
                message:"you don't have permission to access this route"
            })
        }

        let updatedData={}

        if (title) {
            updatedData.title=title
        }
        if (description) {
            updatedData.description=description
        }
        if (thumbnailFilePath) {
    
            const publicId=video.thumbnail.public_id;

            await destroyOnCloudinary(publicId);
    
            const thumbnailFile = await uploadOnCloudinary(thumbnailFilePath)
    
            if (!thumbnailFile) {
                throw new ApiError(500,"error in updating thumbnail")
            }

            updatedData.thumbnail={
                public_id:thumbnailFile.public_id,
                secure_url:thumbnailFile.secure_url
            }
        }

    
        const updateVideo=await Video.findByIdAndUpdate(videoId,{
            $set:updatedData
        },
        {
            new:true
        })
    
        if (!updateVideo) {
            throw new ApiError(500,"error in updating video detail")
        }
    
        return res.status(200).json(
            new ApiResponse(200,updateVideo,"Video updated Successfully")
        )
    } catch (error) {
        throw new ApiError(500,error.message)
    }

})


const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: delete video

    const video = await Video.findById(videoId)

    if (!video) {
        throw new ApiError(400,"video not found")
    }


    if (video.owner.toString()!=req.user._id.toString()) {
        throw new ApiError(400,"you didn't have permission to delete this video")
    }

    if (video.videoFile) {
        await destroyOnCloudinary(video.videoFile.public_id)
    }

    if (video.secure_url) {
        await destroyOnCloudinary(video.secure_url.publicId)
    }

    const deleteVideo=await Video.findByIdAndDelete(videoId)

    if (!deleteVideo) {
        throw new ApiError(500,"error in deleting video")
    }

    return res.status(200).json(
        new ApiResponse(200,
            deleteVideo,
            "video delete successfully"
        )
    )
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    const video = await Video.findById(videoId)

    if (!video) {
        throw new ApiError(400,"video not found")
    }


    if (video.owner.toString()!=req.user._id.toString()) {
        throw new ApiError(400,"you don't have access to toggle status")
    }

    const toggleStatus=!video.isPublished

    const updatedVideo = await Video.findByIdAndUpdate(videoId,{
        $set:{
            isPublished:toggleStatus
        }
    },{new:true})

    return res.status(200).json(
        new ApiResponse(200,updatedVideo,"video published status change")
    )

})


export {
    getAllVideos,
    publishVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}
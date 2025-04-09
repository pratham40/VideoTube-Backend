import mongoose from "mongoose";
import { User } from "../models/user.model";
import { Video } from "../models/video.model";
import { ApiError } from "../utils/ApiError";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiResponse } from "../utils/ApiResponse";

const getAllVideos = asyncHandler(async (req,res,next) => {
    try {
        const {page=1,limit=10,query,sortBy,sortType,userId}=req.query
    
        userId = req.user._id
        const user = await User.findById({
            _id:userId
        })
    
        if (!user) {
            throw new ApiError(400,"user not found")
        }
    
        // TODO:
        const getAllVideosAggreate = await Video.aggregate(
            [
                {
                    $match:{
                        videoOwner:new mongoose.Types.ObjectId(userId),
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
                        [sortBy]:sortType
                    }
                },
                {
                    $skip:(page-1)*limit
                },
                {
                    $limit:parseInt(limit)
                }
            ]
        )
    
        const fetchedVideo=Video.aggregatePaginate(getAllVideosAggreate,{page,limit})
    
        return res.status(200).json(
            new ApiResponse(200,"fetched all video successfully")
        )
    } catch (error) {
        throw new ApiError(400,`error in fetching videos ${error}`)
    }
})


export {
    getAllVideos
}
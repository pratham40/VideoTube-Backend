import { isValidObjectId } from "mongoose";
import { Tweet } from "../models/tweet.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const createTweet = asyncHandler(async (req, res) => {
    //TODO: create tweet

    const {content} = req.body

    if (!content) {
        throw new ApiError(400,"content is required")
    }

    const tweet = await Tweet.create({
        content,
        owner:req.user._id
    })

    if (!tweet) {
        throw new ApiError(500,"error in creating tweet")
    }

    return res.status(200).json(
        new ApiResponse(200,tweet,"tweet create successfully")
    )
})


const updateTweet = asyncHandler(async (req, res) => {
    //TODO: update tweet
    const {updatedContent} = req.body

    const {tweetId} = req.params

    if (!isValidObjectId(tweetId)) {
        throw new ApiError(400,"tweet id is not valid")
    }

    const tweet = await Tweet.findById(tweetId)

    if (!tweet) {
        throw new ApiError(404,"tweet doesn't found")
    }

    if (!updatedContent) {
        throw new ApiError(400,"updated content required")
    }

    if (tweet.owner.toString()!=req.user._id.toString()) {
        throw new ApiError(400,"access denied for updating tweet")
    }

    const updatedTweet = await Tweet.findByIdAndUpdate(tweetId,{
        $set:{
            content:updatedContent
        }
    },{new:true})

    if (!updatedTweet) {
        throw new ApiError(500,"error in updating tweet")
    }


    return res.status(200).json(
        new ApiResponse(200,updatedTweet,"tweet update successfully")
    )
})

const deleteTweet = asyncHandler(async (req, res) => {
    //TODO: delete tweet
    const {tweetId} = req.params

    if (!isValidObjectId(tweetId)) {
        throw new ApiError(400,"tweet id is invalid")
    }

    const deletedTweet = await Tweet.findByIdAndDelete(tweetId)

    if (!deletedTweet) {
        throw new ApiError(400,"delete tweet successfully")
    }

    return res.status(200).json(
        new ApiResponse(200,deletedTweet,"tweet delete successfully")
    )
})

export {
    createTweet,
    updateTweet,
    deleteTweet
}
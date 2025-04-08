import { ApiError } from "../utils/ApiError.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { User } from "../models/user.model.js"
import { destroyOnCloudinary, uploadOnCloudinary } from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import jwt from 'jsonwebtoken'
import mongoose from "mongoose"

const generateAccessAndRefreshToken = async (userId) => {
    try {
        const user = await User.findById(userId)

        const accessToken = user.generateAccessToken()

        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken

        await user.save({
            validateBeforeSave: false
        })

        return {
            refreshToken, accessToken
        }

    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating refresh and access token")
    }
}


const registerUser = asyncHandler(async (req, res, next) => {
    //get user detail from frontend

    const { fullName, email, username, password } = req.body

    //validation-not empty

    if ([fullName, email, username, password].some((field) => field?.trim() === '')) {
        throw new ApiError(400, "all field is required")
    }

    //check if already user exist

    const existedUser = await User.findOne({
        $or: [{ username }, { email }]
    })

    if (existedUser) {
        throw new ApiError(409, "Username and Email already exist")
    }

    //check for images avatar

    const avatarLocalPath = req.files?.avatar[0]?.path

    let coverImageLocalPath;


    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files?.coverImage[0]?.path
    }

    if (!avatarLocalPath) {
        throw new ApiError(400, "avatar is required")
    }

    //upload to cloudinary

    const avatar = await uploadOnCloudinary(avatarLocalPath)

    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if (!avatar) {
        throw new ApiError(400, "avatar is required 1")
    }

    //create user object create entry in db

    const user = await User.create({
        fullName,
        avatar:{
            public_id:avatar.public_id,
            secure_url:avatar.secure_url
        },
        coverImage:{
            public_id:coverImage?.public_id || "",
            secure_url:coverImage?.secure_url || ""
        },
        email,
        password,
        username: username.toLowerCase()
    })

    //remove pass,refreshToken field from res

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )


    // check for user creation

    if (!createdUser) {
        throw new ApiError(500, "something went wrong")
    }

    //return res

    return res.status(201).json(
        new ApiResponse(200, createdUser, "user created successfully")
    )

})


const loginUser = asyncHandler(async (req, res, next) => {

    //  req body -> data

    const { email, username, password } = req.body

    //  username and email exist

    if (!(username || email)) {
        throw new ApiError(400, "username or email is required")
    }

    //  find the user

    const user = await User.findOne({
        $or: [{ username }, { email }]
    })

    if (!user) {
        throw new ApiError(404, "username or email doesn't exist")
    }

    //  password check

    const isPasswordValid = await user.isPasswordCorrect(password)

    if (!isPasswordValid) {
        throw new ApiError(401, 'Invalid User credential')
    }

    //  access and refresh token

    const { refreshToken, accessToken } = await generateAccessAndRefreshToken(user._id)

    const loggedInUser = await User.findById(user._id).select("-password  -refreshToken")

    //  send cookies

    const options = {
        httpOnly: true,
        secure: true,

    }

    return res.status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(200,
                {
                    user: loggedInUser,
                    refreshToken,
                    accessToken
                },
                "User Logged In successfully"
            )
        )

})

const logoutUser = asyncHandler(async (req, res) => {

    await User.findByIdAndUpdate(req.user._id,
        {
            $set: {
                refreshToken: undefined
            }
        },
        {
            new: true
        }
    )

    const options = {
        httpOnly: true,
        secure: true,
    }

    return res.status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new ApiResponse(200, {}, "user logout successfully"))

})


const refreshAccessToken = asyncHandler(async (req, res) => {
    try {
        const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken
    
        if (!incomingRefreshToken) {
            throw new ApiError(401, "Unauthorized Token")
        }
    
        const decodedToken = jwt.verify(
            incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET
        )
    
        const user=await User.findById(decodedToken?._id)
    
        if (!user) {
            throw new ApiError(401, "Invalid refresh Token")
        }
    
        if (incomingRefreshToken!=user?.refreshToken) {
            throw new ApiError(401,"refresh token expired")
        }
    
        const options={
            httpOnly:true,
            secure:true
        }
    
        const{accessToken,newRefreshToken}= await generateAccessAndRefreshToken(user._id)
    
        return res.status(200)
        .cookie("accessToken",accessToken,options)
        .cookie("refreshToken",newRefreshToken,options)
        .json(
            new ApiResponse(200,{accessToken,refreshToken:newRefreshToken},"access token refreshed successfully")
        )
    } catch (error) {
        return new ApiError(401,error?.message || "Invalid refresh token")
    }

})


const changeCurrentPassword = asyncHandler(async(req,res,next)=>{
    const {oldPassword,newPasword}= req.body

    const user = await User.findById(req.user._id)

    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

    if (!isPasswordCorrect) {
        throw new ApiError(401, "Invalid password")
    }

    user.password=newPasword;

    await user.save({
        validateBeforeSave:false
    })

    return res.status(200).json(
        new ApiResponse(200,{}, "password changed successfully")
    )
})


const getCurrentUser = asyncHandler(async(req,res,next)=>{
    const user = req.user
    return res.status(200).json(
        new ApiResponse(200,user,"current user fetched successfully")
    )
})

const updateAccountDetail = asyncHandler(async(req,res,next)=>{
    const {fullName,email} = req.body

    if (!(fullName || email)) {
        throw new ApiError(400, "fullName or email is required")
    }

    const id = req.user._id;

    const user = await User.findByIdAndUpdate(id,{
        $set:{
            fullName,
            email
        }
    },{
        new:true
    }).select("-password")

    return res.status(200).json(
        new ApiResponse(200,user,"user updated successfully")
    )
})


const updateUserAvatar = asyncHandler(async(req,res,next)=>{
    try {
        const avatarLocalPath = req.file?.path
    
        if (!avatarLocalPath) {
            throw new ApiError(400, "avatar is required")
        }
    
    
        const onResponseAfterDeleteOnClodinary=await destroyOnCloudinary(req.user.avatar.public_id)
    
        if (onResponseAfterDeleteOnClodinary?.result !== "ok") {
            throw new ApiError(400, "error in deleting avatar from cloudinary")
            
        }
    
        const avatar = await uploadOnCloudinary(avatarLocalPath)
    
        if (!avatar.url) {
            throw new ApiError(400, "error in uploading avatar")
        }
    
        const user = await User.findByIdAndUpdate(req.user._id,{
            $set:{
                avatar:{
                    public_id:avatar.public_id,
                    secure_url:avatar.secure_url
                }
            }
        },{
            new:true
        }).select("-password")
    
        return res.status(200).json(
            new ApiResponse(200,user, "user avatar updated successfully")
        )
    } catch (error) {
        throw new ApiError(400,error?.message || "error in updating avatar")   
    }

})

const updateUserCoverImage = asyncHandler(async(req,res,next)=>{
    try {
        const coverImageLocalPath = req.file?.path

        if (!coverImageLocalPath) {
            throw new ApiError(400, "cover image is required")
        }        

        if (req.user.coverImage?.public_id) {
            onResponseAfterDeleteOnClodinary=await destroyOnCloudinary(req.user.coverImage.public_id)
    
            if (onResponseAfterDeleteOnClodinary?.result !== "ok") {
                throw new ApiError(400, "error in deleting cover image from cloudinary")
                
            }
        }

        const coverImage = await uploadOnCloudinary(coverImageLocalPath)

        if (!coverImage.url) {
            throw new ApiError(400, "error in uploading cover image")
        }

        const user = await User.findByIdAndUpdate(req.user._id,{
            $set:{
                coverImage:{
                    public_id:coverImage.public_id,
                    secure_url:coverImage.secure_url
                }
            }
        },{
            new:true
        }).select("-password")

        return res.status(200).json(
            new ApiResponse(200,user, "user cover image updated successfully")
        )
    } catch (error) {
        throw new ApiError(400,error?.message || "error in updating cover image")   
    }
})


const getUserChannelProfile = asyncHandler(async (req,res,next) => {
    const {username} = req.params

    if (!username) {
        throw new ApiError(400, "username is required")
    }


    // TODO: Revise Pipelines
    const channel = await User.aggregate([
        {
            $match:{
                username:username?.toLowerCase()
            }
        },
        {
            $lookup:{
                from:"subscriptions",
                localField:"_id",
                foreignField:"channel",
                as:"subscribers"
            }
        },
        {
            $lookup:{
                from:"subscriptions",
                localField:"_id",
                foreignField:"subscriber",
                as:"subscribedTo"
            }
        },
        {
            $addFields:{
                subscribersCount:{
                    $size:"$subscribers"
                },
                subscribedToCount:{
                    $size:"$subscribedTo"
                },
                isSubscribed:{
                    $cond:{
                        if : {$in:[req.user?._id,"$subscribers"]},
                        then:true,
                        else:false
                    }
                }
            }
        },
        {
            $project:{
                fullName:1,
                username:1,
                subscribersCount:1,
                subscribedToCount:1,
                isSubscribed:1,
                avatar:1,
                coverImage:1,
                email:1,
            }
        }
    ])
    
    console.log('====================================');
    console.log(channel);
    console.log('====================================');

    if (!channel?.length) {
        throw new ApiError(404, "channel not exist")
    }

    return res.status(200).json(
        new ApiResponse(200,channel[0], "channel profile fetched successfully")
    )
})

const getWatchHistory = asyncHandler(async (req,res,next) => {

    const user = await User.aggregate(
        [
            {
                $match:{
                    _id: new mongoose.Types.ObjectId(req.user._id)
                }
            },
            {
                $lookup:{
                    from:"videos",
                    localField:"watchHistory",
                    foreignField:"_id",
                    as:"watchHistory",
                    pipeline:[
                        {
                            $lookup:{
                                from:"users",
                                localField:"owner",
                                foreignField:"_id",
                                as:"owner",
                                pipeline:[
                                    {
                                        $project:{
                                            fullName:1,
                                            username:1,
                                            avatar:1
                                        }
                                    }
                                ]
                            }
                        }
                    ]
                }
            }
        ]
    )

    console.log('====================================');
    console.log(user);
    console.log('====================================');

    return res.status(200).json(
        new ApiResponse(200,user[0], "user watch history fetched successfully")
    )
})


export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetail,
    updateUserAvatar,
    updateUserCoverImage,
    getUserChannelProfile,
    getWatchHistory
}
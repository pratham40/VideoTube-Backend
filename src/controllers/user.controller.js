import { ApiError } from "../utils/ApiError.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { User } from "../models/user.model.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import jwt from 'jsonwebtoken'

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
        console.log('====================================');
        console.log(avatar);
        console.log('====================================');
        throw new ApiError(400, "avatar is required 1")
    }

    //create user object create entry in db

    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
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

export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken
}
import { ApiError } from "../utils/ApiError.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { User } from "../models/user.model.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js"
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


export {
    registerUser
}
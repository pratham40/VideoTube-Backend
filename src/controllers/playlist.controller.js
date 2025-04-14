import { Playlist } from "../models/playlist.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"

const createPlaylist = asyncHandler(async (req, res) => {
    const {name, description} = req.body

    //TODO: create playlist

    if (!name || !description) {
        throw new ApiError(400,"enter name and description of playlist")
    }

    const playlist = await Playlist.create({
        name,
        description,
        owner:req.user._id
    })

    if (!playlist) {
        throw new ApiError(500,"error in creating playlist")
    }

    return res.status(200).json(
        new ApiResponse(200,playlist,"playlist created succesfully")
    )
})


export {
    createPlaylist
}
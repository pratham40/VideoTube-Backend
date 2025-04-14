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

const getPlaylistById = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    //TODO: get playlist by id

    const playlist = await Playlist.findById(playlistId)

    if (!playlist) {
        throw new ApiError(400,"playlist not found")
    }

    return res.status(200).json(
        new ApiResponse(200,playlist,"playlist found")
    )
})

const updatePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    const {name, description} = req.body
    //TODO: update playlist

    const playlist = await Playlist.findById(playlistId)

    if (!playlist) {
        throw new ApiError(400,"playlist not found")
    }

    if (playlist.owner.toString()!=req.user._id.toString()) {
        throw new ApiError(400,"access denied to update playlist")
    }

    if (!name && !description) {
        throw new ApiError(400,"please add either name or description of playlist")
    }

    let update={}

    if (name) {
        update.name=name
    }

    if (description) {
        update.description=description
    }

    const updatePlaylist=await Playlist.findByIdAndUpdate(playlistId,{
        $set:update
    },{new:true})

    if (!updatePlaylist) {
        throw new ApiError(500,"something went wrong while updating playlist")
    }

    return res.status(200).json(
        new ApiResponse(200,updatePlaylist,"playlist update successfully")
    )
})

export {
    createPlaylist,
    getPlaylistById,
    updatePlaylist
}
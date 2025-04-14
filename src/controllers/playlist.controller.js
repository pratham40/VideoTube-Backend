import { Playlist } from "../models/playlist.model.js"
import { Video } from "../models/video.model.js"
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

const deletePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    // TODO: delete playlist

    const playlist = await Playlist.findById(playlistId)

    if (!playlist) {
        throw new ApiError(400,"playlist not found")
    }

    if (playlist.owner.toString()!=req.user._id.toString()) {
        throw new ApiError(400,"acess denied to delete playlist")
    }

    const deletePlaylist = await Playlist.deleteOne({
        _id:playlistId
    })

    console.log(deletePlaylist);

    if (!deletePlaylist) {
        throw new ApiError(500,"error in updating playlist")
    }

    return res.status(200).json(
        new ApiResponse(200,deletePlaylist,"playlist delete successfully")
    )
    
})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params

    const playlist = await Playlist.findById(playlistId)

    if (!playlist) {
        throw new ApiError(400,"playlist not found")
    }

    if (playlist.owner.toString()!=req.user._id.toString()) {
        throw new ApiError(400,"access denied to add video to playlist")
    }
    

    const video = await Video.findById(videoId)

    if (!video) {
        throw new ApiError(400,"video not found")
    }

    if (playlist.videos.includes(videoId)) {
        throw new ApiError(400,"video already exist in playlist")
    }

    const addToPlaylist = await Playlist.findByIdAndUpdate(playlistId,{
        $push:{
            videos:videoId
        }
    },{new:true})

    if (!addToPlaylist) {
        throw new ApiError(500,"error in adding video to playlist")
    }

    return res.status(200).json(
        new ApiResponse(200,addToPlaylist,"add video to playlist successfully")
    )
})


export {
    createPlaylist,
    getPlaylistById,
    updatePlaylist,
    deletePlaylist,
    addVideoToPlaylist
}
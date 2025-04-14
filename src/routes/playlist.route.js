import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { createPlaylist, deletePlaylist, getPlaylistById, updatePlaylist } from "../controllers/playlist.controller.js";

const router = Router()

router.use(verifyJWT)

router.route("/").post(createPlaylist)

router.route("/:playlistId")
            .get(getPlaylistById)
            .patch(updatePlaylist)
            .delete(deletePlaylist)

export default router
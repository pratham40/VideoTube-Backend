import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware";
import { upload } from "../middlewares/multer.middleware.";
import { getAllVideos } from "../controllers/video.controller";

const router = Router()

router.use(verifyJWT);


router.route("/")
    .get()
    .post(
        upload.fields[
            {
                name:"videoFile",
                maxCount:1
            },
            {
                name:"thumbnail",
                maxCount:1
            }
        ],
        getAllVideos
    )


export default router
import express from "express"
import cors from 'cors'
import cookieParser from "cookie-parser"
import morgan from "morgan"

const app=express()

app.use(cors({
    origin:process.env.CORS_ORIGIN,
    credentials:true
}))

app.use(express.json({limit:'16kb'}))
app.use(express.urlencoded({extended:true,limit:'16kb'}))
app.use(express.static('public'))
app.use(cookieParser())
app.use(morgan('dev'))

//routes import

import userRouter from "./routes/user.routes.js"

import videoRouter from "./routes/video.route.js"

import playlistRouter from "./routes/playlist.route.js"
//routes declaration

app.use("/api/v1/user",userRouter)

app.use("/api/v1/videos",videoRouter)

app.use("/api/v1/playlist", playlistRouter)



export {app}
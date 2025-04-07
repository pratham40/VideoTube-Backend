import mongoose , {Schema} from "mongoose";


const subscripitionSchema = new Schema({
    subscriber:{
        type:Schema.Types.ObjectId,
        ref:"User",
    },
    channel:{
        type:Schema.Types.ObjectId,
        ref:"User"
    }
},{
    timestamps:true
})


const Subscription = mongoose.model("Subscription", subscripitionSchema)

export {Subscription}
import mongoose, { Schema } from "mongoose";
const subcriptionSchema = new Schema({
    subscriber:{   //one who is subscribing
        type: Schema.Types.ObjectId,
        ref:"User"
    },
    channel:{     //one to whome 'subscriber' is subscribing
        type: Schema.Types.ObjectId,
        ref:"User"
    }
},{timestamps: true})

export const Subscription = mongoose.model("Subscription",subcriptionSchema)
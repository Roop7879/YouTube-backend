import mongoose from "mongoose";
import {DB_NAME} from '../constants.js'

const ConnectDB = async ()=>{
    try {
        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
        console.log(`\n MongoDB Connected!! DB HOST :${connectionInstance.connection.host}`)
    } catch (error) {
        console.error('MongoDB connection failed due to some reason', error)
        process.exit(1) 
    }
}

export default ConnectDB
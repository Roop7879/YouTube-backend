// require ('dotenv').config({path: './env'})
import dotenv from 'dotenv'
import ConnectDB from "./db/database.js";

dotenv.config({
    path: './env'
})

ConnectDB()
// require ('dotenv').config({path: './env'})
import dotenv from 'dotenv'
import ConnectDB from "./db/database.js";
import {app} from './app.js'

dotenv.config({
    path: './env'
})

ConnectDB()
.then(()=>{
    app.listen(process.env.PORT,()=>{
        console.log(`Listening on PORT: ${process.env.PORT}`)
    })
})
.catch((err)=>{
    console.log('Not connected with DB!!',err)
})
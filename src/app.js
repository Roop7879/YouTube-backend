import express from 'express'
import cookieParser from 'cookie-parser'
import cors from 'cors'

const app = express()

//check for origin
app.use(cors({
    origin: process.env.CORS_URI,
    credentials: true
}))

//check for form
app.use(express.json({
    limit: '16kb'
}))

//check for URL
app.use(express.urlencoded({
    limit: '16kb',
    extended:true
}))

//for store files like pdf,image
app.use(express.static('public'))

//for cookies
app.use(cookieParser())



export {app}
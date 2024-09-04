// const mongoose = require('mongoose'); // Import mongoose
// // const { DB_NAME } = require('../constants.js'); // Import specific named export from constants.js

// const ConnectDB = async ()=>{
//     try {
//         const connectionInstance = await mongoose.connect('mongodb+srv://rupendra90:rupendra123@youtube.wyrps.mongodb.net/YouTube',
//             { useNewUrlParser: true,
//                 useUnifiedTopology: true,}
//         )
//         console.log(`\n MongoDB Connected!! DB HOST :${connectionInstance.connection.host}`)
//     } catch (error) {
//         console.error('MongoDB connection failed due to someee reason', error)
//         process.exit(1) 
//     }
// }

// module.exports = {ConnectDB}
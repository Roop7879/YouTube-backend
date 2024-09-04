const mongoose = require('mongoose'); // Import mongoose
const Schema = mongoose.Schema; // Extract Schema from mongoose;

const authorSchema = new Schema({
    id:{
        type:Number
    },
    name:{
        type: String
    }
})

const Author = mongoose.model("Author", authorSchema);

module.exports = { Author };

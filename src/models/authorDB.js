const { Author } = require("./author.js"); // ES6 import ko require me change kiya
const {ConnectDB} = require("../db/author.js");
const result = require('./author.json')
const dotenv = require('dotenv');

dotenv.config({
    path: './env'
})

const start = async () => {
  ConnectDB()
  try {
    await Author.create(result);
    console.log("success");
  } catch (error) {
    console.log(error);
  }
};

start();

const dotenv = require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const connectDb = require("./db/connect");

const app = express();
const port = process.env.PORT || 3000;

const start = async () => {
  try {
    await connectDb(process.env.MONGO_URI);
    console.log("connection successful");
  } catch (error) {
    console.log("error connecting to server");
  }

  app.listen(port, () => console.log(`listening on port ${port}`));
};

start();

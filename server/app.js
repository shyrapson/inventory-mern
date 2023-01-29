const dotenv = require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const connectDb = require("./db/connect");
const userRouter = require("./routes/userRoute");
const errorHandlerMiddleware = require("./middlewares/errorMiddleware");
const UserModel = require("./models/UserModel");
const cookieParser = require("cookie-parser");

const app = express();
const port = process.env.PORT || 5000;

//middlewares
app.use(cors({ origin:true, credentials:true }))
app.use(express.json());
app.use(cookieParser())
app.use(express.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use("/api/users",userRouter);

// error middleware
app.use(errorHandlerMiddleware);

const start = async () => {
  try {
    await connectDb(process.env.MONGO_URI);
    console.log("connection successful");
    // await UserModel.deleteMany()
  } catch (error) {
    console.log("error connecting to server");
  }

  app.listen(port, () => console.log(`listening on port ${port}`));
};

start();

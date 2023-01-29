const { CustomError, unAuthenticatedError, BadRequest } = require("../errors");
const { StatusCodes } = require("http-status-codes");
const jwt = require("jsonwebtoken");
const UserModel = require("../models/UserModel");
const expressAsyncHandler = require("express-async-handler");


const AuthorizationMiddleware =expressAsyncHandler(async (req, res, next) => {


  // const authHeader = req.headers.authorization;
  // if (!authHeader || !authHeader.startsWith("Bearer")) {
  //   throw new unAuthenticatedError("Authentication Invalid");
  // }
  // const token = authHeader.split(" ")[1];
  const token = req.cookies.token

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET_KEY);
    console.log(payload);
    const { userID } = payload;
    const user = await UserModel.findById(userID).select('-password')
    if(!user){
      throw new BadRequest('User not found')
    }
    req.user = user

    
    next()
  } catch (error) {

throw new unAuthenticatedError("Not authorized, please login in")
  }
})

module.exports = AuthorizationMiddleware;

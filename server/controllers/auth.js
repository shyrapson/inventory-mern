const { StatusCodes } = require("http-status-codes");
const { BadRequest, unAuthenticatedError } = require("../errors");
const asyncHandler = require("express-async-handler");
const User = require("../models/UserModel");
const jwt = require("jsonwebtoken");
const { response } = require("express");
const Token = require("../models/tokenModel");
const crypto = require("crypto");
const sendEmail = require("../utils/sendEmail");
const { chownSync } = require("fs");

//register user

const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    throw new BadRequest("please fill in all required fields");
  }
  if (password.length < 6) {
    throw new BadRequest("password must be at least 6 characters");
  }
  const newUser = await User.findOne({ email });
  if (newUser) {
    throw new BadRequest("email has already been registered");
  }
  const user = await User.create({ ...req.body });
  const token = user.createJWT();
  //send http-only token
  res.cookie("token", token, {
    path: "/",
    httpOnly: true,
    expires: new Date(Date.now() + 1000 * 1000), //expires in 1day
    sameSite: "none",
    secure: true,
  });

  res
    .status(StatusCodes.CREATED)
    .send({ name: user.name, photo: user.photo, token });
});

// log in user
const login = async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });

  if (!user) {
    throw new unAuthenticatedError("Invalid credentials");
  }
  const isPasswordCorrect = await user.comparePassword(password);
  if (!isPasswordCorrect) {
    throw new unAuthenticatedError("Please enter a valid password");
  }
  const token = user.createJWT();
  const log = res.cookie("token", token, {
    path: "/",
    httpOnly: true,
    expires: new Date(Date.now() + 1000 * 1000), //expires in 1day
    sameSite: "none",
    secure: true,
  });
  console.log(log, "cokkies");
  res.status(StatusCodes.OK).json({
    id: user._id,
    name: user.name,
    email: user.email,
    photo: user.photo,
    phone: user.phone,
    bio: user.bio,

    token,
  });
};

//logout user
const logout = asyncHandler((req, res) => {
  res.cookie("token", "", {
    path: "/",
    httpOnly: true,
    expires: new Date(0), //expires in 0sec
    sameSite: "none",
    secure: true,
  });
  return res.status(StatusCodes.OK).json({ message: "succefully logged out" });
});

//get user information
const getUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) {
    throw new BadRequest("No users found");
  }
  res.status(StatusCodes.OK).json({
    id: user._id,
    name: user.name,
    email: user.email,
    photo: user.photo,
    phone: user.phone,
    bio: user.bio,
  });
});

//get logged in status
const loginStatus = (req, res) => {
  const token = req.cookies.token;
  console.log(token, "ffff");
  if (!token) {
    return res.json(false);
  }

  const payload = jwt.verify(token, process.env.JWT_SECRET_KEY);
  if (payload) {
    return res.json(true);
  }
  return res.json(false);
};

// update user

const updateUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (user) {
    const { name, email, photo, phone, bio } = user;
    (user.email = email),
      (user.name = req.body.name || name),
      (user.photo = req.body.photo || photo),
      (user.phone = req.body.phone || phone),
      (user.bio = req.body.bio || bio);

    const updatedUser = await user.save();
    res.status(StatusCodes.OK).json({
      id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      photo: updatedUser.photo,
      phone: updatedUser.phone,
      bio: updatedUser.bio,
    });
  } else {
    throw new BadRequest("User not found");
  }
});

const changePassword = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  const { oldPassword, newPassword } = req.body;

  if (!user) {
    throw new Error("user not found");
  }
  if (!oldPassword || !newPassword) {
    throw new BadRequest("please add od and new password");
  }
  const isPasswordCorrect = await user.comparePassword(oldPassword);
  if (user && isPasswordCorrect) {
    user.password = newPassword;
    await user.save();
    res.status(StatusCodes.OK).send("Password changed successfully");
  } else {
    throw new BadRequest("old password is incorrect");
  }
});

//forgot password
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  //delete token if we already have token in the db
  //  because it must have already expired after 30mins
  let token = await Token.findOne({userId :user._id})
  

  if(token){ 
    await token.deleteOne()
  }


  // Create reset Token
  let resetToken = crypto.randomBytes(32).toString("hex") + user._id;
  console.log(resetToken,'reset');

  //hash before sending  to Db
  const hashedToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  //save token to Db
  await new Token({
    userId: user._id,
    token: hashedToken,
    createdAt: Date.now(),
    expiresAt: Date.now() + 30 * (60 * 1000), // expires in 30mins
  }).save();

  //construct reset url

  const resetUrl = `${process.env.FRONTEND_URL}/resetpassword/${resetToken}`;

  const message = `
<h1>hello ${user.name}</h1>
<p>please use the link below to reset your password</p>
<p>this reset link is valid for 30 minutes</p>

<a href=${resetUrl} clicktracking=off > ${resetUrl}</a>

<p>Regards...</p>
<p>3deez Team</p>

`;

  const subject = "Password Reset Request";
  const sent_to = user.email;
  const sent_from = process.env.EMAIL_USER;

  try {
    await sendEmail(subject, message, sent_from, sent_to);
    res
      .status(StatusCodes.OK)
      .json({ sucess: true, message: "Reset Email sent successfully" });
  } catch (error) {
    res.status(500);
    throw new Error("Email not sent please try again");
  }
});

//reset password
const resetPassword = asyncHandler(async(req,res)=>{
  const {password}=req.body;
  const {resetToken} = req.params;

  //hash token,then compare with the one from the db
  const hashedToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");


    //FIND TOKEN IN THE DATABASE
    const userToken = await Token.findOne({
      token: hashedToken,
      expiresAt:{$gt: Date.now()}
    })
   
    if(!userToken){
      res.status(404)
throw new Error('Invalid or Expired token')
    }

    const user = await User.findOne({_id: userToken.userId})
      user.password = password
   await user.save()
   res.status(200).json({
    message:"password reset successfully, Please Login"
   })
res.send('reste')
})

module.exports = {
  register,
  login,
  logout,
  getUser,
  loginStatus,
  updateUser,
  changePassword,
  forgotPassword,
  resetPassword,
};

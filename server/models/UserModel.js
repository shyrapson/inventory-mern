const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const bcrypt = require('bcrypt')

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please enter a name"],
      unique: true,
    },

    email: {
      type: String,
      required: true,
      match: [
        /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
        "Please provide a valid email",
      ],
      unique: true,
    },
    password: {
      type: String,
      required: [true, "please enter a valid password"],
      minLength: 6,
    },
    photo:{
      type: String,
      required: [true, "please add a photo"],
      default:''
    },
    phone:{
      type: String,
      default: "+234"
    },
    bio:{
      type: String,
      maxLength: [225,"Bio must not be more than 255 characters"],
      default:"bio",
    }
  },
  { timestamps: true }
);

//hash password

UserSchema.pre('save',async function(next){
  if(!this.isModified('password')) return next()
const salt = await bcrypt.genSalt(10)
this.password = await bcrypt.hash(this.password, salt)
next()

})


// add jwt
UserSchema.methods.createJWT = function () {
  return jwt.sign(
    {
      userID: this._id,
    },
    process.env.JWT_SECRET_KEY,
    { expiresIn: process.env.LIFE_TIME }
  );
};

// compare password
UserSchema.methods.comparePassword = function(comparepassword){
  return bcrypt.compare(comparepassword,this.password)

}

module.exports = mongoose.model("User", UserSchema);


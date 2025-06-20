const mongoose = require("mongoose");
const { Schema, model } = mongoose;

const userSchema = new Schema({
  username: {
    type: String,
    required: true,

  },

  email: {
    type: String,
    required: true,
    unique: true,
 
  },

  password: {
    type: String,
    required: true,

  },

  isVerified:{
    type:Boolean
  },

  role: {
    type: String,
    enum: ['dealer', 'customer'],
    default: 'customer'
  },
  likedlist:{
    type:[Schema.Types.ObjectId],
    ref:'Car'
  },
  profilePic:{
    type:String,
    required:true,
    default:"https://res.cloudinary.com/decprn8rm/image/upload/v1750436169/Screenshot_2025-06-20_214548_lwtrzl.png"}

});

const User = model("User", userSchema);

module.exports = User;

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
  }

});

const User = model("User", userSchema);

module.exports = User;

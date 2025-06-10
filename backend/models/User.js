import { Schema, model } from "mongoose";

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

  role: {
    type: String,
    enum: ['dealer', 'customer'],
    default: 'customer'
  },

  createdAt: {
    type: Date,
    default: Date.now
  }
});

export const User = model("User", userSchema);

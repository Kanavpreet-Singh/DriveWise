const mongoose = require("mongoose");
const { Schema, model } = mongoose;
const commentSchema = new Schema({
  car: {
    type: Schema.Types.ObjectId,
    ref: "Car",
    required: true
  },

  user: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  text: {
    type: String,
    required: true,
    trim: true
  },

  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Comment=model('Comment',commentSchema);
module.exports = Comment;

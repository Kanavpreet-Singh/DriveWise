const mongoose = require("mongoose");
const { Schema, model } = mongoose;
const conversationSchema = new Schema({
    members: {
        type: Array
    }
}, { timestamps: true });

const Conversation=model('Conversation',conversationSchema);
module.exports = Conversation;

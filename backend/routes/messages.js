const express = require("express");
const router = express.Router();
const  Message  = require("../models/Message");
const { creationLimiter, globalLimiter } = require("../middleware/rateLimiter");
const { shedNormalPriority, shedHighPriority } = require("../middleware/loadShedder");

//add

router.post('/', creationLimiter, shedHighPriority, async(req,res)=>{

    const message=new Message(req.body);

    try{
        const savedMessage=await message.save();

        res.status(200).json(message);

    }
    catch(err){
        res.status(500).json(err);
    }

});

router.get('/:conversationId', globalLimiter, shedNormalPriority, async (req,res)=>{

    try{

        const messages=await Message.find({
            conversationId:req.params.conversationId
        });
        res.status(200).json(messages);

    }
    catch(err){
        res.status(500).json(err);
    }

});



module.exports = router;
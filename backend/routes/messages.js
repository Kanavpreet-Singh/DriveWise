const express = require("express");
const router = express.Router();
const  Message  = require("../models/Message");


//add

router.post('/',async(req,res)=>{

    const message=new Message(req.body);

    try{
        const savedMessage=await message.save();

        res.status(200).json(message);

    }
    catch(err){
        res.status(500).json(err);
    }

});

router.get('/:conversationId', async (req,res)=>{

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
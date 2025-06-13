const express = require("express");
const { Car } = require("../models/Car");
const router = express.Router();

router.get('/allcars',async(req,res)=>{
    const cars=await Car.find({});

    return res.json(200).json({cars});
})

module.exports = router;
const express = require("express");
const  Car  = require("../models/Car");
const userAuth = require("../middleware/authentication/user");
const router = express.Router();

router.get('/allcars', async (req, res) => {
  try {
    const cars = await Car.find({});
    return res.status(200).json({ cars });
  } catch (error) {
    return res.status(500).json({ message: 'Error fetching cars' });
  }
});

router.post('/add', userAuth, async (req, res) => {
  const {
    name,
    brand,
    minprice,
    maxprice,
    category,
    fuelType,
    transmission,
    year,
    seats,
    image
  } = req.body;

  
  if (!name || !brand || !minprice || !maxprice || !category) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  try {
    const newCar = new Car({
      name,
      brand,
      minprice,
      maxprice,
      category,
      fuelType,
      transmission,
      year,
      seats,
      image,
      colorOptions: ['white', 'black'],
      listedby: req.user.userId  
    });

    await newCar.save();

    res.status(200).json({
      message: 'Car added successfully',
      car: newCar
    });
  } catch (error) {
    console.error('Error adding car:', error);
    res.status(500).json({ message: 'Something went wrong' });
  }
});

module.exports = router;
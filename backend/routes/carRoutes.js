const express = require("express");
const  Car  = require("../models/Car");
const  Comment  = require("../models/Comment");
const userAuth = require("../middleware/authentication/user");
const  User  = require("../models/User");
const router = express.Router();


router.get('/allcars', async (req, res) => {
  try {
    const filters = {};
    const allowedFields = ['brand', 'fuelType', 'transmission', 'seats', 'category'];
    allowedFields.forEach((field) => {
      if (req.query[field]) {
        filters[field] = req.query[field];
      }
    });

    const cars = await Car.find(filters);
    res.status(200).json({ cars });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
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
    image,
    location 
  } = req.body;

  if (!name || !brand || !minprice || !maxprice || !category || !image || !location) {
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
      listedby: req.user.userId,
      location: {
        type: 'Point',
        coordinates: location.coordinates  
      }
    });

    await newCar.save();

    res.status(200).json({
      message: 'Car added successfully',
      car: newCar,
    });
  } catch (error) {
    console.error('Error adding car:', error);
    res.status(500).json({ message: 'Something went wrong' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const car = await Car.findById(req.params.id);
    if (!car) return res.status(404).json({ message: "Car not found" });
    res.status(200).json({ car });
  } catch (err) {
    res.status(500).json({ message: "Error fetching car" });
  }
});
router.post('/:id', userAuth, async (req, res) => {
  try {
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
      image,
    } = req.body;

    const carId = req.params.id;

    let car = await Car.findById(carId);
    if (!car) {
      return res.status(404).json({ message: 'Car not found' });
    }

    
    if (car.listedby.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Unauthorized to edit this car' });
    }

    
    car.name = name;
    car.brand = brand;
    car.minprice = minprice;
    car.maxprice = maxprice;
    car.category = category;
    car.fuelType = fuelType;
    car.transmission = transmission;
    car.year = year;
    car.seats = seats;
    car.image = image;

    await car.save();

    res.status(200).json({ message: 'Car updated successfully', car });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Something went wrong while updating the car' });
  }
});
router.post('/like/:id', userAuth, async (req, res) => {
  try {
    const { userId } = req.user;
    const carId = req.params.id;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Prevent duplicate likes
    if (!user.likedlist.includes(carId)) {
      user.likedlist.push(carId);
      await user.save();
    }

    return res.status(200).json({ message: 'Car added to wishlist' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
});

router.delete('/unlike/:id', userAuth, async (req, res) => {
  const { userId } = req.user;
  const carId = req.params.id;

  const user = await User.findById(userId);
  if (!user) return res.status(404).json({ message: 'User not found' });

  user.likedlist = user.likedlist.filter(id => id.toString() !== carId);
  await user.save();

  res.status(200).json({ message: 'Unliked' });
});

router.post("/comment/:id",userAuth,async(req,res)=>{
  const {comment}=req.body;

  const {userId}=req.user

  const id=req.params.id;

  

  let r=new Comment({
    car:id,
    user:userId,
    text:comment
  });

  await r.save();

  res.status(200).json({ message: 'comment added' });

});

router.get("/comment/:id", userAuth, async (req, res) => {
  const id = req.params.id;

  try {
    const comments = await Comment.find({ car: id })
      .populate('user', 'username email profilePic') 
      .sort({ createdAt: -1 }); 

    res.status(200).json({ comments });
  } catch (error) {
    console.error('Error fetching comments:', error);
    res.status(500).json({ message: 'Failed to fetch comments' });
  }
});

router.delete('/:id', userAuth, async (req, res) => {
  const id = req.params.id;

  try {
    const car = await Car.findById(id);

    if (!car) {
      return res.status(404).json({ message: 'Car not found' });
    }

    
    if (car.listedby.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Unauthorized to delete this listing' });
    }

    
    await Car.findByIdAndDelete(id);
    await Comment.deleteMany({ car: id });

    res.status(200).json({ message: 'Listing deleted successfully' });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ message: 'Something went wrong while deleting' });
  }
});

module.exports = router;
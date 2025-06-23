require('dotenv').config();
const mongoose = require('mongoose');
const Car = require('./models/Car');

// 20 fixed Indian cities with coordinates
const cityList = [
  { name: 'Delhi', coordinates: [77.1025, 28.7041] },
  { name: 'Mumbai', coordinates: [72.8777, 19.0760] },
  { name: 'Bangalore', coordinates: [77.5946, 12.9716] },
  { name: 'Hyderabad', coordinates: [78.4867, 17.3850] },
  { name: 'Ahmedabad', coordinates: [72.5714, 23.0225] },
  { name: 'Chennai', coordinates: [80.2707, 13.0827] },
  { name: 'Kolkata', coordinates: [88.3639, 22.5726] },
  { name: 'Pune', coordinates: [73.8567, 18.5204] },
  { name: 'Jaipur', coordinates: [75.7873, 26.9124] },
  { name: 'Chandigarh', coordinates: [76.7794, 30.7333] },
  { name: 'Mohali', coordinates: [76.7081, 30.7046] },
  { name: 'Noida', coordinates: [77.3910, 28.5355] },
  { name: 'Lucknow', coordinates: [80.9462, 26.8467] },
  { name: 'Indore', coordinates: [75.8577, 22.7196] },
  { name: 'Nagpur', coordinates: [79.0882, 21.1458] },
  { name: 'Bhopal', coordinates: [77.4126, 23.2599] },
  { name: 'Surat', coordinates: [72.8311, 21.1702] },
  { name: 'Patna', coordinates: [85.1376, 25.5941] },
  { name: 'Gurgaon', coordinates: [77.0266, 28.4595] },
  { name: 'Amritsar', coordinates: [74.8723, 31.6340] },
];

// Connect to DB
mongoose.connect("mongodb://localhost:27017/drivecircle", {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('✅ MongoDB connected'))
.catch((err) => console.error('❌ MongoDB connection error:', err));

// Assign random city and coordinates from cityList
async function assignRandomLocations() {
  const cars = await Car.find({});
  let updatedCount = 0;

  for (const car of cars) {
    if (car.location?.coordinates?.length === 2) {
      console.log(`Skipping "${car.name}" — already has location`);
      continue;
    }

    const randomCity = cityList[Math.floor(Math.random() * cityList.length)];

    car.location = {
      type: 'Point',
      city: randomCity.name,
      coordinates: randomCity.coordinates
    };

    await car.save();
    console.log(`✅ Updated "${car.name}" with city "${randomCity.name}"`);
    updatedCount++;
  }

  console.log(`\n🎉 Done. ${updatedCount} car(s) updated.`);
  mongoose.disconnect();
}

assignRandomLocations();

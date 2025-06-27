require('dotenv').config();
const mongoose = require('mongoose');
const Car = require('./models/Car');

const demoCars = [
  {
    name: "Honda Elevate",
    brand: "Honda",
    price: 1100000,
    maxprice: 1600000,
    category: "SUV",
    fuelType: "Petrol",
    transmission: "Manual",
    year: 2023,
    seats: 5,
    colorOptions: ["Blue", "White", "Silver"],
    image: "https://res.cloudinary.com/decprn8rm/image/upload/v1750871961/elevate_qycotb.jpg",
    listedby: new mongoose.Types.ObjectId(),
    location: { type: "Point", coordinates: [77.1025, 28.7041] } // Delhi
  },
  {
    name: "Hyundai Verna",
    brand: "Hyundai",
    price: 1000000,
    maxprice: 1700000,
    category: "Sedan",
    fuelType: "Petrol",
    transmission: "Automatic",
    year: 2023,
    seats: 5,
    colorOptions: ["Black", "Red", "White"],
    image: "https://res.cloudinary.com/decprn8rm/image/upload/v1750872006/download_mcljlt.jpg",
    listedby: new mongoose.Types.ObjectId(),
    location: { type: "Point", coordinates: [72.5714, 23.0225] } // Ahmedabad
  },
  {
    name: "Tata Punch EV",
    brand: "Tata",
    price: 1000000,
    maxprice: 1200000,
    category: "Hatchback",
    fuelType: "Electric",
    transmission: "Automatic",
    year: 2024,
    seats: 5,
    colorOptions: ["Blue", "Grey"],
    image: "https://res.cloudinary.com/decprn8rm/image/upload/v1750872049/download_qsukzx.jpg",
    listedby: new mongoose.Types.ObjectId(),
    location: { type: "Point", coordinates: [76.7081, 30.7046] } // Mohali
  },
  {
    name: "Kia Seltos HTX",
    brand: "Kia",
    price: 1500000,
    maxprice: 2000000,
    category: "SUV",
    fuelType: "Diesel",
    transmission: "Manual",
    year: 2022,
    seats: 5,
    colorOptions: ["Orange", "White", "Silver"],
    image: "https://res.cloudinary.com/decprn8rm/image/upload/v1750872172/download_gvrecc.jpg",
    listedby: new mongoose.Types.ObjectId(),
    location: { type: "Point", coordinates: [78.4867, 17.385] } // Hyderabad
  },
  {
    name: "Volkswagen Virtus",
    brand: "Volkswagen",
    price: 1200000,
    maxprice: 1700000,
    category: "Sedan",
    fuelType: "Petrol",
    transmission: "Automatic",
    year: 2023,
    seats: 5,
    colorOptions: ["Red", "Grey"],
    image: "https://res.cloudinary.com/decprn8rm/image/upload/v1750872207/download_tvyvlq.jpg",
    listedby: new mongoose.Types.ObjectId(),
    location: { type: "Point", coordinates: [75.7873, 26.9124] } // Jaipur
  },
  {
    name: "Mercedes-Benz A-Class",
    brand: "Mercedes-Benz",
    price: 4500000,
    maxprice: 5200000,
    category: "Luxury",
    fuelType: "Petrol",
    transmission: "Automatic",
    year: 2023,
    seats: 5,
    colorOptions: ["White", "Black"],
    image: "https://res.cloudinary.com/decprn8rm/image/upload/v1750872376/download_xki5m2.jpg",
    listedby: new mongoose.Types.ObjectId(),
    location: { type: "Point", coordinates: [85.1376, 25.5941] } // Patna
  },
  {
    name: "Toyota Hyryder",
    brand: "Toyota",
    price: 1400000,
    maxprice: 1900000,
    category: "SUV",
    fuelType: "Hybrid",
    transmission: "Automatic",
    year: 2023,
    seats: 5,
    colorOptions: ["Grey", "Red", "Green"],
    image: "https://res.cloudinary.com/decprn8rm/image/upload/v1750872344/download_uilsf3.jpg",
    listedby: new mongoose.Types.ObjectId(),
    location: { type: "Point", coordinates: [73.8567, 18.5204] } // Pune
  },
  {
    name: "BMW 2 Series",
    brand: "BMW",
    price: 4200000,
    maxprice: 4700000,
    category: "Luxury",
    fuelType: "Diesel",
    transmission: "Automatic",
    year: 2024,
    seats: 5,
    colorOptions: ["White", "Navy Blue"],
    image: "https://res.cloudinary.com/decprn8rm/image/upload/v1750872313/download_wyiiqu.jpg",
    listedby: new mongoose.Types.ObjectId(),
    location: { type: "Point", coordinates: [80.9462, 26.8467] } // Lucknow
  },
  {
    name: "Audi A4",
    brand: "Audi",
    price: 4500000,
    maxprice: 5000000,
    category: "Luxury",
    fuelType: "Petrol",
    transmission: "Automatic",
    year: 2023,
    seats: 5,
    colorOptions: ["Silver", "Black"],
    image: "https://res.cloudinary.com/decprn8rm/image/upload/v1750872285/download_u3kxlw.jpg",
    listedby: new mongoose.Types.ObjectId(),
    location: { type: "Point", coordinates: [76.7794, 30.7333] } // Chandigarh
  },
  {
    name: "Mahindra Thar LX",
    brand: "Mahindra",
    price: 1300000,
    price: 1650000,
    category: "SUV",
    fuelType: "Diesel",
    transmission: "Manual",
    year: 2022,
    seats: 4,
    colorOptions: ["Red", "Black"],
    image: "https://res.cloudinary.com/decprn8rm/image/upload/v1750872251/download_vcl6w5.jpg",
    listedby: new mongoose.Types.ObjectId(),
    location: { type: "Point", coordinates: [74.8723, 31.634] } // Amritsar
  }
];


// Connect to DB
mongoose.connect("mongodb://localhost:27017/drivecircle", {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('✅ MongoDB connected'))
.catch((err) => console.error('❌ MongoDB connection error:', err));

async function insertDemoCars() {
  try {
    await Car.insertMany(demoCars);
    console.log('✅ Demo cars inserted successfully!');
  } catch (err) {
    console.error('❌ Error inserting demo cars:', err);
  } finally {
    mongoose.connection.close();
  }
}

// Run the function
insertDemoCars();

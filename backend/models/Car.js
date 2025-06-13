const mongoose = require("mongoose");
const { Schema, model } = mongoose;

const carSchema=new Schema({
    name: { type: String, required: true },  
    brand: { type: String,enum: [
    'Toyota', 'Hyundai', 'Suzuki', 'Honda', 'Tata', 'Mahindra',
    'Kia', 'BMW', 'Mercedes-Benz', 'Audi', 'Tesla', 'Volkswagen'
  ], required: true },
    
    minprice: { type: Number, required: true },
    maxprice: { type: Number, required: true },
    category: { 
    type: String, 
    enum: ['Hatchback', 'Sedan', 'SUV', 'Luxury', 'Super Luxury'], 
    required: true 
  },
  fuelType: { 
    type: String, 
    enum: ['Petrol', 'Diesel', 'CNG', 'Electric', 'Hybrid'], 
    required: true 
  },
  transmission: { 
    type: String, 
    enum: ['Manual', 'Automatic'], 
    required: true 
  },
  year: { type: Number, required: true },
  seats: { type: Number },
  colorOptions: [String],

  image: String,

  listedby:{
    type:Schema.Types.ObjectId,
    ref:'User',
    required:true
  } 

});

const Car=model('Car',carSchema);
module.exports = Car;
const mongoose = require("mongoose");
const { Schema, model } = mongoose;

const carSchema=new Schema({
    name: { type: String, required: true },  
    brand: { type: String,enum: [
    'Toyota', 'Hyundai', 'Suzuki', 'Honda', 'Tata', 'Mahindra',
    'Kia', 'BMW', 'Mercedes-Benz', 'Audi', 'Tesla', 'Volkswagen'
  ], required: true },
    
    
    price: { type: Number, required: true },
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

  image: {
  type: [String], 
  required: true,
},

  listedby:{
    type:Schema.Types.ObjectId,
    ref:'User',
    required:true
  } ,
  location: {
    type: {
      type: String,
      enum: ['Point'],
      required: true
    },
    coordinates: {
      type: [Number], 
      required: true
    }
  }

});

carSchema.index({ location: '2dsphere' });

const Car=model('Car',carSchema);
module.exports = Car;
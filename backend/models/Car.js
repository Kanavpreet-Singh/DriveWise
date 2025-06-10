import {model,Mongoose,Schema} from "mongoose";

const carSchema=new Schema({
    name: { type: String, required: true },  
    brand: { type: String,enum: [
    'Toyota', 'Hyundai', 'Suzuki', 'Honda', 'Tata', 'Mahindra',
    'Kia', 'BMW', 'Mercedes-Benz', 'Audi', 'Tesla', 'Volkswagen'
  ], required: true },
    variant: { type: String, enum: ['Base', 'Medium', 'Top'], required: true },
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

  images: [String],

  listedby:{
    type:Schema.Types.ObjectId,
    ref:'User',
    required:true
  } 

});

export const Car=model('Car',carSchema);
const express=require('express');
const app=express();
const mongoose=require('mongoose')
const cors=require('cors'); 
const userRoutes=require('./routes/userRoutes'); 
const carRoutes=require('./routes/carRoutes'); 
app.use(cors());
app.use(express.json());
const port=5000;    

app.listen(port,()=>{
    console.log(`Server is running on port ${port}`);
});

mongoose.connect('mongodb://localhost:27017/drivecircle').then(() => {
    console.log('Connected to MongoDB');
}).catch(err => {
    console.error('MongoDB connection error:', err);
});

//configuring routes
app.use('/user',userRoutes);
app.use('/car',carRoutes);



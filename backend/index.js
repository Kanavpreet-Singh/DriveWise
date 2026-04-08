const express=require('express');
const app=express();
require('dotenv').config();
const mongoose=require('mongoose')
const cors=require('cors'); 
const cookieParser = require('cookie-parser');
const userRoutes=require('./routes/userRoutes'); 
const carRoutes=require('./routes/carRoutes'); 
const conversationRoutes=require('./routes/conversations'); 
const messageRoutes=require('./routes/messages'); 
const paymentRoutes=require('./routes/paymentRoutes');

app.use(cookieParser());
app.use(cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
    exposedHeaders: ['x-cache-source']
}));
app.use(express.json({ limit: '25mb' }));
const port=5000;    

app.listen(port,()=>{
    console.log(`Server is running on port ${port}`);
});

mongoose.connect(process.env.MONGO_URL).then(() => {
    console.log('Connected to MongoDB');
}).catch(err => {
    console.error('MongoDB connection error:', err);
});

//configuring routes
app.use('/user',userRoutes);
app.use('/car',carRoutes);
app.use('/conversation',conversationRoutes);
app.use('/message',messageRoutes);
app.use('/payment',paymentRoutes);
const express=require('express');
const app=express();
require('dotenv').config();
const mongoose=require('mongoose')
const cors=require('cors'); 
const userRoutes=require('./routes/userRoutes'); 
const carRoutes=require('./routes/carRoutes'); 
const conversationRoutes=require('./routes/conversations'); 
const messageRoutes=require('./routes/messages'); 
app.use(cors());
app.use(express.json());
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




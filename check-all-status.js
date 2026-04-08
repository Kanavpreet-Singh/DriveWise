const path = require('path');
const backendDir = path.join(__dirname, 'backend');
require(path.join(backendDir, 'node_modules', 'dotenv')).config({ path: path.join(backendDir, '.env') });

const mongoose = require(path.join(backendDir, 'node_modules', 'mongoose'));

mongoose.connect(process.env.MONGO_URL).then(async () => {
  const cars = await mongoose.connection.db.collection('cars').find({}).toArray();
  console.log('All Cars Status:');
  cars.forEach(c => {
    console.log(`Car: ${c.name}, Status: ${c.paymentStatus}, Sold: ${c.sold}, OrderID: ${c.razorpayOrderId}`);
  });
  
  process.exit(0);
}).catch(e => {
  console.error(e);
  process.exit(1);
});

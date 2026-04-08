const path = require('path');
const backendDir = path.join(__dirname, 'backend');
require(path.join(backendDir, 'node_modules', 'dotenv')).config({ path: path.join(backendDir, '.env') });

const mongoose = require(path.join(backendDir, 'node_modules', 'mongoose'));

mongoose.connect(process.env.MONGO_URL).then(async () => {
  const cars = await mongoose.connection.db.collection('cars').find({ paymentStatus: 'pending' }).toArray();
  console.log('Pending Cars:', JSON.stringify(cars, null, 2));
  
  const payments = await mongoose.connection.db.collection('payments').find({}).sort({createdAt: -1}).limit(5).toArray();
  console.log('Recent Payments:', JSON.stringify(payments, null, 2));
  
  process.exit(0);
}).catch(e => {
  console.error(e);
  process.exit(1);
});

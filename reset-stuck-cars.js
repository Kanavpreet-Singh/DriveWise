const path = require('path');
const backendDir = path.join(__dirname, 'backend');
require(path.join(backendDir, 'node_modules', 'dotenv')).config({ path: path.join(backendDir, '.env') });

const mongoose = require(path.join(backendDir, 'node_modules', 'mongoose'));

mongoose.connect(process.env.MONGO_URL).then(async () => {
  const result = await mongoose.connection.db.collection('cars').updateMany(
    { paymentStatus: 'pending' },
    { $set: { paymentStatus: 'available', reservedBy: null, reservedAt: null, razorpayOrderId: null } }
  );
  console.log('Reset ' + result.modifiedCount + ' stuck cars back to available');
  process.exit(0);
}).catch(e => {
  console.error(e);
  process.exit(1);
});

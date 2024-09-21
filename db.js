const mongoose = require('mongoose');

let isConnected;

const connectToDatabase = async () => {
  if (isConnected) {
    console.log("=> using existing database connection");
    return;
  }

  console.log("=> using new database connection");
  try {
    const db = await mongoose.connect(process.env.DB, {
      useNewUrlParser: true,  
      useUnifiedTopology: true, 
    });
    isConnected = db.connection.readyState;
    console.log("Database connected successfully");
  } catch (err) {
    console.log("Database connection error: ", err);
    throw err;
  }
};

module.exports = connectToDatabase;

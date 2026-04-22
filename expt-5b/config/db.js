const mongoose = require("mongoose");

async function connectToMongo() {
  const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;

  if (!mongoUri) {
    throw new Error("MONGO_URI (or MONGODB_URI) is missing. Add your MongoDB Atlas URI in .env.");
  }

  await mongoose.connect(mongoUri);
  console.log("MongoDB connected successfully");
}

module.exports = connectToMongo;

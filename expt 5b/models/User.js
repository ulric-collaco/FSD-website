const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      minlength: [3, "Name must be at least 3 characters long"],
      trim: true
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please enter a valid email address"]
    },
    age: {
      type: Number,
      min: [0, "Age cannot be less than 0"],
      max: [120, "Age cannot be more than 120"]
    },
    hobbies: {
      type: [String],
      default: []
    },
    bio: {
      type: String,
      default: ""
    },
    userId: {
      type: String,
      required: [true, "userId is required"],
      unique: true,
      trim: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    versionKey: false
  }
);

// Required indexes for Experiment 5B
userSchema.index({ name: 1 });
userSchema.index({ email: 1, age: -1 });
userSchema.index({ hobbies: 1 });
userSchema.index({ bio: "text" });
userSchema.index({ userId: "hashed" });
userSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 30 });

module.exports = mongoose.model("User", userSchema);

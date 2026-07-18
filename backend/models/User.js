import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  googleId: {
    type: String,
    sparse: true,
    unique: true
  },
  password: {
    type: String
  },
  age: {
    type: Number
  },
  phone: {
    type: String
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  picture: {
    type: String
  },
  isOnboarded: {
    type: Boolean,
    default: false
  },
  preferences: {
    weightDuration: { type: Number, default: 0.35 },
    weightDaytime: { type: Number, default: 0.25 },
    weightBudget: { type: Number, default: 0.20 },
    weightReliability: { type: Number, default: 0.10 },
    weightComfort: { type: Number, default: 0.05 },
    weightFood: { type: Number, default: 0.05 },
    preferredClass: { type: String, default: 'All' }
  },
  favouriteJourney: {
    origin: { type: String, default: '' },
    destination: { type: String, default: '' }
  },
  resetPasswordToken: {
    type: String
  },
  resetPasswordExpires: {
    type: Date
  }
}, {
  timestamps: true
});

const User = mongoose.model('User', userSchema);
export default User;

import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import User from '../models/User.js';

// We'll use a placeholder Client ID if one is not provided in env.
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID || '765017417232-fp5ui38tgrjkvsnvv9mpl8ga9pneliq3.apps.googleusercontent.com');

// Secret for our own JWT tokens to maintain session
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-railcompass-key-123';

export const googleLogin = async (req, res) => {
  try {
    const { credential } = req.body; // This is the JWT token from Google
    console.log('Received Google login request');

    // Verify the Google token
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID || '765017417232-fp5ui38tgrjkvsnvv9mpl8ga9pneliq3.apps.googleusercontent.com',
    });
    console.log('Google token verified');

    const payload = ticket.getPayload();
    const { sub: googleId, email, name, picture } = payload;

    // Check if user already exists
    console.log('Checking for user in DB...');
    let user = null;
    
    // In-memory fallback if DB not connected
    if (mongoose.connection.readyState !== 1) {
      console.log('MongoDB not connected, creating stateless user');
      // Check if we already have it in memory as a fallback
      global.memoryUsers = global.memoryUsers || [];
      user = global.memoryUsers.find(u => u.googleId === googleId);
      
      if (!user) {
        user = {
          _id: new mongoose.Types.ObjectId().toString(),
          googleId, email, name, picture, isOnboarded: false,
          preferences: {
            weightDuration: 0.35, weightDaytime: 0.25, weightBudget: 0.20,
            weightReliability: 0.10, weightComfort: 0.05, weightFood: 0.05,
            preferredClass: 'All'
          }
        };
        global.memoryUsers.push(user);
      }
    } else {
      user = await User.findOne({ googleId });

      if (!user) {
        // Create new user
        user = new User({
          googleId,
          email,
          name,
          picture
        });
        await user.save();
      }
    }

    // Generate our own session token
    const token = jwt.sign(
      { 
        userId: user._id, 
        isOnboarded: user.isOnboarded,
        userData: mongoose.connection.readyState !== 1 ? user : undefined
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(200).json({
      success: true,
      token,
      user
    });

  } catch (error) {
    console.error('Google login error:', error);
    res.status(401).json({ success: false, message: 'Authentication failed' });
  }
};

// Protect routes middleware
export const protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized to access this route' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    
    if (mongoose.connection.readyState !== 1) {
      if (decoded.userData) {
        req.user = decoded.userData;
      } else {
        global.memoryUsers = global.memoryUsers || [];
        req.user = global.memoryUsers.find(u => u._id === decoded.userId || u._id === decoded.userId.toString());
      }
    } else {
      req.user = await User.findById(decoded.userId);
    }
    
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'User not found' });
    }
    
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Not authorized to access this route' });
  }
};

export const updatePreferences = async (req, res) => {
  try {
    const { preferences } = req.body;
    
    // Find user and update
    let user;
    let newToken = null;
    
    if (mongoose.connection.readyState !== 1) {
      user = req.user;
      user.preferences = { ...user.preferences, ...preferences };
      user.isOnboarded = true;
      
      // Update memory fallback
      global.memoryUsers = global.memoryUsers || [];
      const idx = global.memoryUsers.findIndex(u => u._id === user._id);
      if (idx !== -1) global.memoryUsers[idx] = user;
      
      // Issue new token with updated user data
      newToken = jwt.sign(
        { 
          userId: user._id, 
          isOnboarded: user.isOnboarded,
          userData: user
        },
        JWT_SECRET,
        { expiresIn: '7d' }
      );
    } else {
      user = await User.findByIdAndUpdate(
        req.user._id,
        { 
          preferences,
          isOnboarded: true // Once they set preferences, they are onboarded
        },
        { new: true, runValidators: true }
      );
    }

    res.status(200).json({
      success: true,
      user,
      token: newToken
    });
  } catch (error) {
    console.error('Error updating preferences:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

export const getMe = async (req, res) => {
  try {
    // req.user is set in protect middleware
    res.status(200).json({
      success: true,
      user: req.user
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

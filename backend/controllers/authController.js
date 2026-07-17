import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
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
    if (mongoose.connection.readyState !== 1 && mongoose.connection.readyState !== 2) {
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
      // First try to find by email to link accounts if they signed up traditionally first
      user = await User.findOne({ email });

      if (user) {
        // If user exists but doesn't have googleId linked, link it now
        if (!user.googleId) {
          user.googleId = googleId;
          if (!user.picture && picture) user.picture = picture;
          await user.save();
        }
      } else {
        // If no user with this email exists at all, create a brand new one
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
    res.status(401).json({ success: false, message: `Auth error: ${error.message}` });
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
    
    if (mongoose.connection.readyState !== 1 && mongoose.connection.readyState !== 2) {
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
    
    if (mongoose.connection.readyState !== 1 && mongoose.connection.readyState !== 2) {
      user = req.user;
      user.preferences = { ...user.preferences, ...preferences };
      user.isOnboarded = true;
      
      // Update memory fallback
      global.memoryUsers = global.memoryUsers || [];
      const idx = global.memoryUsers.findIndex(u => u._id === user._id);
      if (idx !== -1) {
        global.memoryUsers[idx] = user;
      } else {
        global.memoryUsers.push(user);
      }
      
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

export const register = async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1 && mongoose.connection.readyState !== 2) {
      return res.status(503).json({ success: false, message: 'Database connection required for native registration.' });
    }
    const { name, email, password } = req.body;
    
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ success: false, message: 'User already exists' });
    }
    
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    user = new User({
      name,
      email,
      password: hashedPassword,
      isOnboarded: false
    });
    await user.save();
    
    const userObject = user.toObject();
    delete userObject.password;
    
    const token = jwt.sign(
      { userId: user._id, isOnboarded: user.isOnboarded },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    res.status(201).json({ success: true, token, user: userObject });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

export const login = async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1 && mongoose.connection.readyState !== 2) {
      return res.status(503).json({ success: false, message: 'Database connection required for native login.' });
    }
    const { email, password } = req.body;
    
    const user = await User.findOne({ email });
    if (!user || !user.password) {
      return res.status(400).json({ success: false, message: 'Invalid credentials' });
    }
    
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Invalid credentials' });
    }
    
    const userObject = user.toObject();
    delete userObject.password;
    
    const token = jwt.sign(
      { userId: user._id, isOnboarded: user.isOnboarded },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    res.status(200).json({ success: true, token, user: userObject });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { name, age, phone, favouriteJourney, preferences } = req.body;
    let user;
    let newToken = null;
    
    if (mongoose.connection.readyState !== 1 && mongoose.connection.readyState !== 2) {
      user = req.user;
      if (name !== undefined) user.name = name;
      if (age !== undefined) user.age = age;
      if (phone !== undefined) user.phone = phone;
      if (favouriteJourney !== undefined) user.favouriteJourney = favouriteJourney;
      if (preferences !== undefined) user.preferences = { ...user.preferences, ...preferences };
      
      global.memoryUsers = global.memoryUsers || [];
      const idx = global.memoryUsers.findIndex(u => u._id === user._id);
      if (idx !== -1) {
        global.memoryUsers[idx] = user;
      } else {
        global.memoryUsers.push(user);
      }
      
      newToken = jwt.sign(
        { userId: user._id, isOnboarded: user.isOnboarded, userData: user },
        JWT_SECRET,
        { expiresIn: '7d' }
      );
    } else {
      const updateData = {};
      if (name !== undefined) updateData.name = name;
      if (age !== undefined) updateData.age = age;
      if (phone !== undefined) updateData.phone = phone;
      if (favouriteJourney !== undefined) updateData.favouriteJourney = favouriteJourney;
      if (preferences !== undefined) updateData.preferences = preferences;
      
      user = await User.findByIdAndUpdate(req.user._id, updateData, { new: true, runValidators: true });
      
      const userObject = user.toObject();
      delete userObject.password;
      user = userObject;
    }
    
    res.status(200).json({ success: true, user, token: newToken });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

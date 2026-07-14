import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// We'll use a placeholder Client ID if one is not provided in env.
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID || 'YOUR_GOOGLE_CLIENT_ID_HERE');

// Secret for our own JWT tokens to maintain session
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-railcompass-key-123';

export const googleLogin = async (req, res) => {
  try {
    const { credential } = req.body; // This is the JWT token from Google

    // Verify the Google token
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID || 'YOUR_GOOGLE_CLIENT_ID_HERE',
    });

    const payload = ticket.getPayload();
    const { sub: googleId, email, name, picture } = payload;

    // Check if user already exists
    let user = await User.findOne({ googleId });

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

    // Generate our own session token
    const token = jwt.sign(
      { userId: user._id, isOnboarded: user.isOnboarded },
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
    req.user = await User.findById(decoded.userId);
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Not authorized to access this route' });
  }
};

export const updatePreferences = async (req, res) => {
  try {
    const { preferences } = req.body;
    
    // Find user and update
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { 
        preferences,
        isOnboarded: true // Once they set preferences, they are onboarded
      },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      user
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

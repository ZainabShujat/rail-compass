import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import crypto from 'crypto';
import dotenv from 'dotenv';
import User from '../models/User.js';
import { sendEmail } from '../utils/sendEmail.js';

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
    
    if (mongoose.connection.readyState !== 1) {
      try {
        console.log('Attempting inline DB reconnect in googleLogin...');
        const rawUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/railwise';
        await mongoose.connect(rawUri.replace(/\s+/g, ''), { 
          serverSelectionTimeoutMS: 3000,
          connectTimeoutMS: 3000,
          socketTimeoutMS: 3000
        });
      } catch (dbErr) {
        console.error('googleLogin DB Reconnect Failed:', dbErr);
      }
    }
    
    // In-memory fallback if DB not connected after attempt
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
      try {
        console.log('Attempting inline DB reconnect in protect middleware...');
        const rawUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/railwise';
        await mongoose.connect(rawUri.replace(/\s+/g, ''));
      } catch (dbErr) {
        console.error('Middleware DB Reconnect Failed:', dbErr);
      }
    }
    
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
      try {
        console.log('Attempting inline DB reconnect...');
        const rawUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/railwise';
        await mongoose.connect(rawUri.replace(/\s+/g, ''));
      } catch (dbErr) {
        return res.status(503).json({ success: false, message: `DB Connection Failed: ${dbErr.message}` });
      }
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
      try {
        console.log('Attempting inline DB reconnect...');
        const rawUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/railwise';
        await mongoose.connect(rawUri.replace(/\s+/g, ''));
      } catch (dbErr) {
        return res.status(503).json({ success: false, message: `DB Connection Failed: ${dbErr.message}` });
      }
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

export const forgotPassword = async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1 && mongoose.connection.readyState !== 2) {
      try {
        console.log('Attempting inline DB reconnect...');
        const rawUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/railwise';
        await mongoose.connect(rawUri.replace(/\s+/g, ''));
      } catch (dbErr) {
        return res.status(503).json({ success: false, message: `DB Connection Failed: ${dbErr.message}` });
      }
    }

    const user = await User.findOne({ email: req.body.email });
    if (!user) {
      return res.status(200).json({ success: true, message: 'If an account exists, a reset link has been sent' });
    }

    const resetToken = crypto.randomBytes(20).toString('hex');
    user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour

    await user.save();

    const resetUrl = `http://localhost:5173/reset-password/${resetToken}`;
    const message = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #0f172a; color: #f8fafc; padding: 40px 20px; text-align: center;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #1e293b; padding: 40px; border-radius: 12px; border: 1px solid #334155; box-shadow: 0 10px 25px rgba(0,0,0,0.5);">
          
          <div style="margin-bottom: 30px;">
            <img src="http://localhost:5173/logo.png" alt="Rail Compass Logo" style="width: 80px; height: auto;" />
            <h1 style="color: #3b82f6; margin-top: 15px; font-size: 24px; font-weight: 600; letter-spacing: 1px;">RAIL COMPASS</h1>
          </div>

          <h2 style="color: #f1f5f9; font-size: 20px; margin-bottom: 20px;">Password Reset Request</h2>
          
          <p style="color: #94a3b8; font-size: 16px; line-height: 1.6; margin-bottom: 30px; text-align: left;">
            We received a request to reset the password for your Rail Compass account. 
            Click the button below to securely set up a new password.
          </p>

          <a href="${resetUrl}" style="display: inline-block; background-color: #3b82f6; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 600; font-size: 16px; margin-bottom: 30px; border: 1px solid #60a5fa;" clicktracking="off">
            Reset Password
          </a>

          <p style="color: #64748b; font-size: 14px; line-height: 1.5; margin-bottom: 0; text-align: left;">
            If you didn't request a password reset, you can safely ignore this email. Your password will not change until you access the link above and create a new one.
          </p>
          
          <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #334155;">
            <p style="color: #475569; font-size: 12px;">
              &copy; ${new Date().getFullYear()} Rail Compass. All rights reserved.
            </p>
          </div>

        </div>
      </div>
    `;

    try {
      // Force reload environment variables in case .env was updated while server was running
      dotenv.config();

      await sendEmail({
        email: user.email,
        subject: 'Rail Compass - Password Reset Request',
        html: message
      });
      res.status(200).json({ success: true, message: 'Email sent' });
    } catch (err) {
      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;
      await user.save();
      console.error('=== EMAIL SENDING FAILED ===');
      console.error('\n🛠️  [DEV FALLBACK] Use this link to reset the password:');
      console.error(`👉  ${resetUrl}\n`);
      console.error('Error:', err.message);
      console.error('EMAIL_USER exists:', !!process.env.EMAIL_USER);
      console.error('EMAIL_PASS exists:', !!process.env.EMAIL_PASS);
      import('fs').then(fs => {
        fs.writeFileSync('email_error_dump.txt', 'Error: ' + err.message + '\nStack: ' + err.stack + '\n' + JSON.stringify(err, null, 2));
      });
      return res.status(500).json({ success: false, message: 'Email could not be sent. Have you added your Gmail App Password to the .env file?' });
    }
  } catch (err) {
    console.error('Forgot password error:', err);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

export const resetPassword = async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1 && mongoose.connection.readyState !== 2) {
      try {
        console.log('Attempting inline DB reconnect...');
        const rawUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/railwise';
        await mongoose.connect(rawUri.replace(/\s+/g, ''));
      } catch (dbErr) {
        return res.status(503).json({ success: false, message: `DB Connection Failed: ${dbErr.message}` });
      }
    }

    const resetPasswordToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid or expired token' });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(req.body.password, salt);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    await user.save();

    res.status(200).json({ success: true, message: 'Password updated successfully' });
  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

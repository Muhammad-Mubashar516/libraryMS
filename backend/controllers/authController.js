const User = require('../models/User');
const { generateToken } = require('../middleware/auth');


const register = async (req, res) => {
  console.log('REGISTER ATTEMPT - Received data:', req.body);
  try {
    const { username, email, password, firstName, lastName } = req.body;

    const existingUser = await User.findOne({ $or: [{ email: email.toLowerCase() }, { username: username }] });
    if (existingUser) {
      return res.status(400).json({ message: 'User with this email or username already exists' });
    }
    
    const user = new User({
      username,
      email: email.toLowerCase(),
      password,
      firstName,
      lastName,
    });

    await user.save();
    
    // ---!! THE ULTIMATE TEST !!---
    
    const savedUser = await User.findById(user._id);
    if (savedUser) {
      console.log(`✅✅✅ VERIFICATION SUCCESS: User ${savedUser.email} found in DB right after saving.`);
    } else {
      console.error(`❌❌❌ VERIFICATION FAILED: Could NOT find user with ID ${user._id} in DB. THE WRITE OPERATION FAILED SILENTLY.`);
      
      throw new Error('Database write operation failed silently. Check DB permissions or configurations.');
    }
    // ---!! TEST ENDS !!---

    
    res.status(201).json({
      _id: user._id,
      username: user.username,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      token: generateToken(user._id),
    });

  } catch (error) {
    console.error('\n---!!! REGISTERATION FAILED - CATCH BLOCK !!!---');
    console.error('Error:', error.message);
    console.error('--------------------------------------------------\n');
    res.status(500).json({ message: error.message || 'Server error. Check backend console.' });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check for user by email
    const user = await User.findOne({ email: email.toLowerCase() });

    // Agar user database mein mojood hi nahi hai
    if (!user) {
      // User ki request ke mutabiq wazeh message
      return res.status(404).json({ message: 'User not found. Please create an account.' });
    }

    // Password compare 
    if (await user.comparePassword(password)) {
      if (!user.isActive) {
        return res.status(401).json({ message: 'Account is deactivated' });
      }

      
      res.json({
        _id: user._id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        token: generateToken(user._id),
      });
    } else {
      
      return res.status(401).json({ message: 'Invalid credentials. Please check your password.' });
    }
  } catch (error) {
    console.error('LOGIN ERROR:', error);
    res.status(500).json({ message: 'Server error' });
  }
};


const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { register, login, getMe };
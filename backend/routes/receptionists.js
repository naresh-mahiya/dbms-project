const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');



router.post('/login', async (req, res) => {
  try {
    console.log('Received login request body:', req.body);
    const { username, password } = req.body;

    if (!username || !password) {
      console.error('Missing username or password');
      return res.status(400).json({
        success: false,
        message: 'Username and password are required'
      });
    }

    console.log('Login attempt for username:', username);

    // First check if the table exists
    const [tables] = await db.execute("SHOW TABLES LIKE 'receptionists'");
    if (tables.length === 0) {
      console.error('Receptionists table does not exist');
      return res.status(500).json({
        success: false,
        message: 'Database setup error'
      });
    }

    // Get receptionist data
    console.log('Querying database for username:', username);
    const [receptionists] = await db.execute(
      'SELECT * FROM receptionists WHERE username = ?',
      [username]
    );

    console.log('Found receptionists:', receptionists.length);

    if (receptionists.length === 0) {
      console.log('No receptionist found with username:', username);
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    const receptionist = receptionists[0];
    console.log('Found receptionist record. Comparing passwords...');
    
    try {
      const validPassword = await bcrypt.compare(password, receptionist.password);
      console.log('Password comparison result:', validPassword);

      if (!validPassword) {
        console.log('Invalid password for user:', username);
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials'
        });
      }
    } catch (bcryptError) {
      console.error('Error comparing passwords:', bcryptError);
      return res.status(500).json({
        success: false,
        message: 'Error verifying credentials'
      });
    }

    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET is not set in environment variables');
      return res.status(500).json({
        success: false,
        message: 'Server configuration error'
      });
    }

    console.log('Generating JWT token...');
    const token = jwt.sign(
      { id: receptionist.id, role: 'receptionist' },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    console.log('Login successful for user:', username);
    res.json({
      success: true,
      token,
      receptionist: {
        id: receptionist.id,
        username: receptionist.username
      }
    });
  } catch (error) {
    console.error('Unexpected error during login:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Unexpected error during login',
      error: error.message
    });
  }
});

// Get visitor history
router.get('/visitor-history', async (req, res) => {
  try {
    const [visitors] = await db.execute(
      'SELECT * FROM visitors ORDER BY created_at DESC'
    );
    res.json({ success: true, visitors });
  } catch (error) {
    console.error('Error fetching visitor history:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching visitor history',
      error: error.message
    });
  }
});

module.exports = router;

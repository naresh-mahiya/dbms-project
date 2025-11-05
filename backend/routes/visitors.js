const express = require('express');
const router = express.Router();
const mysql = require('mysql2');
const db = require('../db');



router.post('/register', async (req, res) => {
  const { name, phone, email, address, person_to_meet, purpose, department } = req.body;

  try {
    console.log('Received registration request:', { name, phone, email, address, person_to_meet, purpose, department });

    // Generate a random 6-digit token
    const token = Math.floor(100000 + Math.random() * 900000).toString();
    console.log('Generated token:', token);

    // Log all values before insertion
    console.log('Values to insert:', {
      token,
      name,
      phone,
      email,
      address,
      person_to_meet,
      purpose,
      department
    });

    const query = 'INSERT INTO visitors (token, name, phone, email, address, person_to_meet, purpose, department) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
    
    const values = [token, name, phone, email, address, person_to_meet, purpose, department];
    console.log('Query:', query);
    console.log('Values:', values);
    
    const [result] = await db.execute(query, values);
    console.log('Insert result:', result);

    // Verify the token was saved by fetching the visitor
    const [visitors] = await db.execute('SELECT * FROM visitors WHERE id = ?', [result.insertId]);
    const savedVisitor = visitors[0];
    console.log('Saved visitor:', savedVisitor);

    res.status(201).json({
      success: true,
      message: 'Visitor pre-registered successfully',
      visitorId: result.insertId,
      token: token,
      name: name,
      department: department
    });
  } catch (error) {
    console.error('Error in /register:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Error registering visitor',
      error: error.message
    });
  }
});

// Verify visitor token
router.post('/verify-token', async (req, res) => {
  const { visitorId, token } = req.body;

  try {
    const [visitor] = await db.execute(
      'SELECT id, name FROM visitors WHERE id = ? AND token = ?',
      [visitorId, token]
    );

    if (visitor.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }

    res.json({
      success: true,
      message: 'Token verified successfully',
      visitor: visitor[0]
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error verifying token',
      error: error.message
    });
  }
});

// Get visitor by search criteria (for receptionist)
router.get('/search', async (req, res) => {
  const { name, phone, date } = req.query;
  let query = 'SELECT * FROM visitors WHERE 1=1';
  const params = [];

  if (name) {
    query += ' AND name LIKE ?';
    params.push(`%${name}%`);
  }
  if (phone) {
    query += ' AND phone LIKE ?';
    params.push(`%${phone}%`);
  }
  if (date) {
    query += ' AND DATE(created_at) = ?';
    params.push(date);
  }

  try {
    const [visitors] = await db.execute(query, params);
    res.json({ success: true, visitors });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error searching visitors',
      error: error.message
    });
  }
});

// Get today's visitors
router.get('/today', async (req, res) => {
  try {
    const query = 'SELECT * FROM visitors WHERE DATE(created_at) = CURDATE()';
    const [visitors] = await db.execute(query);
    res.json({ success: true, visitors });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching today\'s visitors',
      error: error.message
    });
  }
});

// Update visitor status (check-in/check-out)
router.put('/status/:id', async (req, res) => {
  const { id } = req.params;
  const { status, token } = req.body;

  try {
    // First verify the token if checking in
    if (status === 'Checked-In' && token) {
      const [visitor] = await db.execute('SELECT * FROM visitors WHERE id = ? AND token = ?', [id, token]);
      if (visitor.length === 0) {
        return res.status(401).json({
          success: false,
          message: 'Invalid token'
        });
      }
    }

    let query;
    if (status === 'Checked-In') {
      query = 'UPDATE visitors SET status = ?, checkin_time = CURRENT_TIMESTAMP WHERE id = ?';
    } else if (status === 'Checked-Out') {
      query = 'UPDATE visitors SET status = ?, checkout_time = CURRENT_TIMESTAMP WHERE id = ?';
    }

    await db.execute(query, [status, id]);

    // Fetch the updated visitor data
    const [updatedVisitor] = await db.execute(
      'SELECT id, name, status, checkin_time, checkout_time FROM visitors WHERE id = ?',
      [id]
    );

    res.json({
      success: true,
      message: `Visitor ${status.toLowerCase()} successfully`,
      visitor: updatedVisitor[0]
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating visitor status',
      error: error.message
    });
  }
});

// Get top 5 most frequent visitors
router.get('/top-visitors', async (req, res) => {
  try {
    const query = `
      SELECT 
        name, 
        email, 
        COUNT(*) as visit_count
      FROM visitors
      WHERE status = 'Checked-In' OR status = 'Checked-Out'
      GROUP BY name, email
      ORDER BY visit_count DESC
      LIMIT 5
    `;
    const [visitors] = await db.execute(query);
    res.json({ success: true, visitors });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching top visitors',
      error: error.message
    });
  }
});

// Search visitor by name and email
router.get('/search-visitor', async (req, res) => {
  const { name, email } = req.query;
  try {
    const query = `
      SELECT 
        name, 
        email, 
        COUNT(*) as total_visits,
        GROUP_CONCAT(DATE_FORMAT(created_at, '%Y-%m-%d %H:%i')) as visit_dates,
        GROUP_CONCAT(department) as departments_visited
      FROM visitors
      WHERE (status = 'Checked-In' OR status = 'Checked-Out') AND name LIKE ? AND email LIKE ?
      GROUP BY name, email
    `;
    const [visitors] = await db.execute(query, [`%${name}%`, `%${email}%`]);
    res.json({ success: true, visitors });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error searching visitor',
      error: error.message
    });
  }
});

// Get department statistics
router.get('/department-stats', async (req, res) => {
  try {
    const query = `
      SELECT 
        COALESCE(department, 'Not Specified') as department,
        COUNT(*) as visit_count,
        ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM visitors WHERE department IS NOT NULL AND (status = 'Checked-In' OR status = 'Checked-Out')), 2) as percentage
      FROM visitors
      WHERE status = 'Checked-In' OR status = 'Checked-Out'
      GROUP BY department
      ORDER BY visit_count DESC
    `;
    const [stats] = await db.execute(query);
    res.json({ success: true, stats });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching department statistics',
      error: error.message
    });
  }
});

module.exports = router;

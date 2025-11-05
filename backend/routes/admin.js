const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');



// Admin login
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const [admins] = await db.execute(
      'SELECT * FROM admins WHERE username = ?',
      [username]
    );

    if (admins.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    const admin = admins[0];
    const validPassword = await bcrypt.compare(password, admin.password);

    if (!validPassword) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    const token = jwt.sign(
      { id: admin.id, role: 'admin' },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.json({
      success: true,
      token,
      admin: {
        id: admin.id,
        username: admin.username
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error during login',
      error: error.message
    });
  }
});

// Get daily check-in/check-out report
router.get('/daily-report', async (req, res) => {
  const { date } = req.query;
  try {
    const [report] = await db.execute(
      `SELECT 
        COUNT(CASE WHEN status = 'Checked-In' THEN 1 END) as total_checkins,
        COUNT(CASE WHEN status = 'Checked-Out' THEN 1 END) as total_checkouts
      FROM visitors 
      WHERE DATE(created_at) = ?`,
      [date]
    );
    res.json({ success: true, report: report[0] });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error generating daily report',
      error: error.message
    });
  }
});

// Get monthly visitor report
router.get('/monthly-report', async (req, res) => {
  const { month, year } = req.query;
  try {
    const [report] = await db.execute(
      `SELECT 
        DATE(created_at) as date,
        COUNT(*) as total_visitors,
        COUNT(CASE WHEN status = 'Checked-In' THEN 1 END) as total_checkins,
        COUNT(CASE WHEN status = 'Checked-Out' THEN 1 END) as total_checkouts
      FROM visitors 
      WHERE MONTH(created_at) = ? AND YEAR(created_at) = ?
      GROUP BY DATE(created_at)
      ORDER BY date`,
      [month, year]
    );
    res.json({ success: true, report });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error generating monthly report',
      error: error.message
    });
  }
});

// Get visitor statistics
router.get('/statistics', async (req, res) => {
  try {
    const [stats] = await db.execute(
      `SELECT 
        COUNT(*) as total_visitors,
        COUNT(CASE WHEN status = 'Pending' THEN 1 END) as pending_visitors,
        COUNT(CASE WHEN status = 'Checked-In' THEN 1 END) as current_visitors,
        COUNT(CASE WHEN status = 'Checked-Out' THEN 1 END) as completed_visits
      FROM visitors`
    );
    res.json({ success: true, statistics: stats[0] });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching statistics',
      error: error.message
    });
  }
});

module.exports = router;

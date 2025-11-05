const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const { v4: uuidv4 } = require('uuid');

// Monthly visitor statistics
router.get('/visitor-stats/monthly', async (req, res) => {
  const { month } = req.query;
  try {
    const [stats] = await db.execute(`
      SELECT 
        DATE(v.checkin_time) as date,
        COUNT(DISTINCT v.id) as total_visits,
        COUNT(DISTINCT CASE WHEN v.status = 'Checked-In' THEN v.id END) as total_checkins,
        COUNT(DISTINCT CASE WHEN v.status = 'Checked-Out' THEN v.id END) as total_checkouts
      FROM visits v
      WHERE v.checkin_time IS NOT NULL AND DATE_FORMAT(v.checkin_time, '%Y-%m') = ?
      GROUP BY DATE(v.checkin_time)
      ORDER BY date ASC
    `, [month]);
    res.json(Array.isArray(stats) ? stats : []);
  } catch (error) {
    console.error('Error fetching monthly visitor stats:', error);
    res.status(500).json([]); // always an array
  }
});

// Department statistics
router.get('/department-stats', async (req, res) => {
  try {
    const [stats] = await db.execute(`
      SELECT 
        d.id,
        d.name as department_name,
        COUNT(v.id) as total_visits,
        COUNT(CASE WHEN v.status = 'Checked-In' THEN v.id END) as active_visits,
        COUNT(e.id) as employee_count
      FROM departments d
      LEFT JOIN employees e ON d.id = e.department_id
      LEFT JOIN visits v ON e.id = v.employee_id
      GROUP BY d.id, d.name
      ORDER BY total_visits DESC
    `);
    
    res.json({ stats: Array.isArray(stats) ? stats : [] });
  } catch (error) {
    console.error('Error fetching department stats:', error);
    res.status(500).json({ stats: [] });
  }
});



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

// Department Management
router.post('/departments', async (req, res) => {
  const { name, location, contact_person, contact_phone } = req.body;
  
  try {
    const [result] = await db.execute(
      'INSERT INTO departments (name, location, contact_person, contact_phone) VALUES (?, ?, ?, ?)',
      [name, location || null, contact_person || null, contact_phone || null]
    );
    
    const [department] = await db.execute(
      'SELECT * FROM departments WHERE id = ?',
      [result.insertId]
    );
    
    res.status(201).json({
      success: true,
      data: department[0]
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating department',
      error: error.message
    });
  }
});

// Update Department
router.put('/departments/:id', async (req, res) => {
  const { id } = req.params;
  const { name, location, contact_person, contact_phone } = req.body;
  
  try {
    await db.execute(
      'UPDATE departments SET name = ?, location = ?, contact_person = ?, contact_phone = ? WHERE id = ?',
      [name, location || null, contact_person || null, contact_phone || null, id]
    );
    
    const [department] = await db.execute('SELECT * FROM departments WHERE id = ?', [id]);
    
    res.json({
      success: true,
      data: department[0]
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating department',
      error: error.message
    });
  }
});

// Delete Department
router.delete('/departments/:id', async (req, res) => {
  const { id } = req.params;
  
  try {
    // Check if department has employees
    const [employees] = await db.execute(
      'SELECT COUNT(*) as count FROM employees WHERE department_id = ?',
      [id]
    );
    
    if (employees[0].count > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete department with active employees'
      });
    }
    
    await db.execute('DELETE FROM departments WHERE id = ?', [id]);
    
    res.json({
      success: true,
      message: 'Department deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting department',
      error: error.message
    });
  }
});

// Employee Management
router.post('/employees', async (req, res) => {
  const { employee_id, name, email, phone, department_id, position } = req.body;
  
  try {
    const [result] = await db.execute(
      'INSERT INTO employees (employee_id, name, email, phone, department_id, position) VALUES (?, ?, ?, ?, ?, ?)',
      [employee_id, name, email, phone || null, department_id, position || null]
    );
    
    const [employee] = await db.execute(
      'SELECT e.*, d.name as department_name FROM employees e JOIN departments d ON e.department_id = d.id WHERE e.id = ?',
      [result.insertId]
    );
    
    res.status(201).json({
      success: true,
      data: employee[0]
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating employee',
      error: error.message
    });
  }
});

// Update Employee
router.put('/employees/:id', async (req, res) => {
  const { id } = req.params;
  const { employee_id, name, email, phone, department_id, position, is_active } = req.body;
  
  try {
    await db.execute(
      'UPDATE employees SET employee_id = ?, name = ?, email = ?, phone = ?, department_id = ?, position = ?, is_active = ? WHERE id = ?',
      [employee_id, name, email, phone || null, department_id, position || null, is_active, id]
    );
    
    const [employee] = await db.execute(
      'SELECT e.*, d.name as department_name FROM employees e JOIN departments d ON e.department_id = d.id WHERE e.id = ?',
      [id]
    );
    
    res.json({
      success: true,
      data: employee[0]
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating employee',
      error: error.message
    });
  }
});

// Delete Employee
router.delete('/employees/:id', async (req, res) => {
  const { id } = req.params;
  
  try {
    // Check if employee has any visits
    const [visits] = await db.execute(
      'SELECT COUNT(*) as count FROM visits WHERE employee_id = ?',
      [id]
    );
    
    if (visits[0].count > 0) {
      // Soft delete
      await db.execute('UPDATE employees SET is_active = FALSE WHERE id = ?', [id]);
    } else {
      // Hard delete if no visits
      await db.execute('DELETE FROM employees WHERE id = ?', [id]);
    }
    
    res.json({
      success: true,
      message: 'Employee deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting employee',
      error: error.message
    });
  }
});

// Get all employees (admin view)
router.get('/employees', async (req, res) => {
  try {
    const [employees] = await db.execute(`
      SELECT e.*, d.name as department_name 
      FROM employees e JOIN departments d ON e.department_id = d.id
      ORDER BY e.name`);
    res.json({ data: employees });
  } catch (error) {
    res.status(500).json({ data: [], message: 'Cannot fetch employees' });
  }
});

// Get Visitor Statistics
router.get('/visitor-statistics', async (req, res) => {
  try {
    // Most visited departments
    const [popularDepartments] = await db.execute(`
      SELECT 
        d.id,
        d.name as department_name,
        COUNT(v.id) as visit_count
      FROM visits v
      JOIN employees e ON v.employee_id = e.id
      JOIN departments d ON e.department_id = d.id
      GROUP BY d.id, d.name
      ORDER BY visit_count DESC
      LIMIT 5
    `);

    // Most visited employees
    const [popularEmployees] = await db.execute(`
      SELECT 
        e.id,
        e.name as employee_name,
        d.name as department_name,
        COUNT(v.id) as visit_count
      FROM visits v
      JOIN employees e ON v.employee_id = e.id
      JOIN departments d ON e.department_id = d.id
      GROUP BY e.id, e.name, d.name
      ORDER BY visit_count DESC
      LIMIT 5
    `);

    // Daily visitor trend (last 7 days)
    const [dailyTrend] = await db.execute(`
      SELECT 
        DATE(v.created_at) as visit_date,
        COUNT(*) as total_visits,
        COUNT(CASE WHEN v.status = 'Checked-Out' THEN 1 END) as completed_visits
      FROM visits v
      WHERE v.created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
      GROUP BY DATE(v.created_at)
      ORDER BY visit_date
    `);

    // Visitor purpose statistics
    const [purposeStats] = await db.execute(`
      SELECT 
        purpose,
        COUNT(*) as count,
        ROUND((COUNT(*) * 100.0) / (SELECT COUNT(*) FROM visits), 1) as percentage
      FROM visits
      GROUP BY purpose
      ORDER BY count DESC
    `);

    res.json({
      success: true,
      data: {
        popularDepartments,
        popularEmployees,
        dailyTrend,
        purposeStats
      }
    });
  } catch (error) {
    console.error('Error fetching visitor statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching visitor statistics',
      error: error.message
    });
  }
});

module.exports = router;

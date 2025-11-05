const express = require('express');
const router = express.Router();
const db = require('../db');
const { v4: uuidv4 } = require('uuid');

// Register a new visitor and create a visit record
router.post('/register', async (req, res) => {
  const { 
    name, 
    phone, 
    email, 
    address, 
    employee_id, // This will be the employee ID (not employee_id from employees table)
    purpose, 
    id_proof_type, 
    id_proof_number
  } = req.body;

  // Input validation
  if (!name || !phone || !employee_id || !purpose || !id_proof_type || !id_proof_number) {
    return res.status(400).json({
      success: false,
      message: 'Missing required fields'
    });
  }

  try {
    // Start a transaction
    await db.query('START TRANSACTION');

    // 1. Create visitor record
    const [visitorResult] = await db.execute(
      'INSERT INTO visitors (name, phone, email, address, id_proof_type, id_proof_number, token) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [name, phone, email || null, address || null, id_proof_type, id_proof_number, uuidv4().substr(0, 8).toUpperCase()]
    );

    const visitorId = visitorResult.insertId;

    // 2. Get employee and department details
    const [employees] = await db.execute(
      `SELECT e.id, e.department_id, d.name as department_name 
       FROM employees e
       JOIN departments d ON e.department_id = d.id
       WHERE e.employee_id = ? AND e.is_active = TRUE`,
      [employee_id]
    );

    if (employees.length === 0) {
      await db.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        message: 'Employee not found or inactive'
      });
    }

    const employee = employees[0];
    const token = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit token

    // 3. Create visit record
    await db.execute(
      `INSERT INTO visits 
       (visitor_id, employee_id, token, purpose, status) 
       VALUES (?, ?, ?, ?, 'Pending')`,
      [visitorId, employee.id, token, purpose]
    );

    await db.query('COMMIT');

    res.status(201).json({
      success: true,
      message: 'Visitor registered successfully',
      data: {
        visitorId,
        token,
        name,
        department: employee.department_name,
        employeeId: employee_id,
        purpose,
        visitTime: new Date().toISOString()
      }
    });
  } catch (error) {
    await db.query('ROLLBACK');
    console.error('Error in visitor registration:', error);
    res.status(500).json({
      success: false,
      message: 'Error registering visitor',
      error: error.message
    });
  }
});

// Verify visitor token and get visit details
router.post('/verify-token', async (req, res) => {
  const { token } = req.body;

  try {
    const [visits] = await db.execute(
      `SELECT 
        v.id as visit_id,
        v.token,
        v.status,
        v.checkin_time,
        v.checkout_time,
        vis.name as visitor_name,
        vis.phone,
        vis.email,
        e.name as employee_name,
        e.employee_id,
        d.name as department_name
      FROM visits v
      JOIN visitors vis ON v.visitor_id = vis.id
      JOIN employees e ON v.employee_id = e.id
      JOIN departments d ON e.department_id = d.id
      WHERE v.token = ?`,
      [token]
    );

    if (visits.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Visit not found or invalid token'
      });
    }

    const visit = visits[0];
    res.json({
      success: true,
      message: 'Visit details retrieved successfully',
      data: visit
    });
  } catch (error) {
    console.error('Error verifying token:', error);
    res.status(500).json({
      success: false,
      message: 'Error verifying token',
      error: error.message
    });
  }
});

// Search visitors with advanced filters
router.get('/search', async (req, res) => {
  const { 
    name, 
    phone, 
    date, 
    department_id, 
    employee_id, 
    status,
    id_proof_number
  } = req.query;

  try {
    let query = `
      SELECT 
        vis.id,
        vis.name,
        vis.phone,
        vis.email,
        vis.id_proof_type,
        vis.id_proof_number,
        vis.status as visitor_status,
        vis.created_at as visit_date,
        v.token,
        v.status as visit_status,
        v.checkin_time,
        v.checkout_time,
        e.name as employee_name,
        e.employee_id,
        d.name as department_name,
        r.full_name as receptionist_name
      FROM visitors vis
      JOIN visits v ON vis.id = v.visitor_id
      JOIN employees e ON v.employee_id = e.id
      JOIN departments d ON e.department_id = d.id
      LEFT JOIN receptionists r ON v.receptionist_id = r.id
      WHERE 1=1
    `;

    const params = [];

    if (name) {
      query += ' AND vis.name LIKE ?';
      params.push(`%${name}%`);
    }
    if (phone) {
      query += ' AND vis.phone LIKE ?';
      params.push(`%${phone}%`);
    }
    if (date) {
      query += ' AND DATE(v.created_at) = ?';
      params.push(date);
    }
    if (department_id) {
      query += ' AND d.id = ?';
      params.push(department_id);
    }
    if (employee_id) {
      query += ' AND e.employee_id = ?';
      params.push(employee_id);
    }
    if (status) {
      query += ' AND v.status = ?';
      params.push(status);
    }
    if (id_proof_number) {
      query += ' AND vis.id_proof_number = ?';
      params.push(id_proof_number);
    }

    query += ' ORDER BY v.created_at DESC';
    
    const [visits] = await db.execute(query, params);
    
    res.json({ 
      success: true, 
      data: visits 
    });
  } catch (error) {
    console.error('Error searching visitors:', error);
    res.status(500).json({
      success: false,
      message: 'Error searching visitors',
      error: error.message
    });
  }
});

// Get today's visits with details
router.get('/today', async (req, res) => {
  try {
    const query = `
      SELECT 
        v.id as visit_id,
        vis.name as visitor_name,
        vis.phone,
        vis.email,
        e.name as employee_name,
        d.name as department_name,
        v.token,
        v.status,
        v.checkin_time,
        v.checkout_time,
        v.purpose,
        r.full_name as receptionist_name
      FROM visits v
      JOIN visitors vis ON v.visitor_id = vis.id
      JOIN employees e ON v.employee_id = e.id
      JOIN departments d ON e.department_id = d.id
      LEFT JOIN receptionists r ON v.receptionist_id = r.id
      WHERE DATE(v.created_at) = CURDATE()
      ORDER BY v.checkin_time DESC`;
      
    const [visits] = await db.execute(query);
    
    res.json({ 
      success: true, 
      data: visits 
    });
  } catch (error) {
    console.error('Error fetching today\'s visits:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching today\'s visits',
      error: error.message
    });
  }
});

// Check-in/Check-out a visitor
router.put('/visit/:token/status', async (req, res) => {
  const { token } = req.params;
  const { status, receptionist_id } = req.body;
  
  if (!['In Progress', 'Completed', 'Cancelled'].includes(status)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid status. Must be one of: In Progress, Completed, Cancelled'
    });
  }

  try {
    // Start transaction
    await db.query('START TRANSACTION');

    // Get the visit
    const [visits] = await db.execute(
      'SELECT id, visitor_id, status FROM visits WHERE token = ? FOR UPDATE',
      [token]
    );

    if (visits.length === 0) {
      await db.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        message: 'Visit not found'
      });
    }

    const visit = visits[0];
    
    // Validate status transition
    if (status === 'In Progress' && visit.status !== 'Scheduled') {
      await db.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        message: 'Only scheduled visits can be checked in'
      });
    }

    if (status === 'Completed' && visit.status !== 'In Progress') {
      await db.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        message: 'Only in-progress visits can be checked out'
      });
    }

    // Update visit status
    const updateFields = ['status = ?'];
    const updateParams = [status];

    if (status === 'In Progress') {
      updateFields.push('checkin_time = CURRENT_TIMESTAMP');
    } else if (status === 'Completed') {
      updateFields.push('checkout_time = CURRENT_TIMESTAMP');
    }

    if (receptionist_id) {
      updateFields.push('receptionist_id = ?');
      updateParams.push(receptionist_id);
    }

    updateParams.push(visit.id);

    await db.execute(
      `UPDATE visits SET ${updateFields.join(', ')} WHERE id = ?`,
      updateParams
    );

    // Update visitor status
    let visitorStatus;
    if (status === 'In Progress') {
      visitorStatus = 'Checked-In';
    } else if (status === 'Completed') {
      visitorStatus = 'Checked-Out';
    } else {
      visitorStatus = 'Pending';
    }

    await db.execute(
      'UPDATE visitors SET status = ? WHERE id = ?',
      [visitorStatus, visit.visitor_id]
    );

    // Get updated visit details
    const [updatedVisit] = await db.execute(
      `SELECT 
        v.*,
        vis.name as visitor_name,
        vis.phone,
        e.name as employee_name,
        d.name as department_name
      FROM visits v
      JOIN visitors vis ON v.visitor_id = vis.id
      JOIN employees e ON v.employee_id = e.id
      JOIN departments d ON e.department_id = d.id
      WHERE v.id = ?`,
      [visit.id]
    );

    await db.query('COMMIT');

    res.json({
      success: true,
      message: `Visit ${status.toLowerCase()} successfully`,
      data: updatedVisit[0]
    });
  } catch (error) {
    await db.query('ROLLBACK');
    console.error('Error updating visit status:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating visit status',
      error: error.message
    });
  }
});

// Get visit statistics
router.get('/statistics', async (req, res) => {
  try {
    // Today's visitors count
    const [todayCount] = await db.execute(
      `SELECT COUNT(*) as count 
       FROM visits 
       WHERE DATE(created_at) = CURDATE()`
    );

    // Monthly visitors count
    const [monthlyCount] = await db.execute(
      `SELECT COUNT(*) as count 
       FROM visits 
       WHERE YEAR(created_at) = YEAR(CURDATE()) 
       AND MONTH(created_at) = MONTH(CURDATE())`
    );

    // Total visitors count
    const [totalCount] = await db.execute(
      'SELECT COUNT(*) as count FROM visitors'
    );

    // Visitors by department
    const [byDepartment] = await db.execute(
      `SELECT 
         d.name as department,
         COUNT(v.id) as visit_count
       FROM visits v
       JOIN employees e ON v.employee_id = e.id
       JOIN departments d ON e.department_id = d.id
       WHERE v.checkin_time >= DATE_SUB(NOW(), INTERVAL 30 DAY)
       GROUP BY d.id, d.name
       ORDER BY visit_count DESC`
    );

    // Recent visits
    const [recentVisits] = await db.execute(
      `SELECT 
         vis.name as visitor_name,
         e.name as employee_name,
         d.name as department_name,
         v.checkin_time,
         v.checkout_time,
         v.status
       FROM visits v
       JOIN visitors vis ON v.visitor_id = vis.id
       JOIN employees e ON v.employee_id = e.id
       JOIN departments d ON e.department_id = d.id
       ORDER BY v.created_at DESC
       LIMIT 5`
    );

    res.json({
      success: true,
      data: {
        today: todayCount[0].count,
        monthly: monthlyCount[0].count,
        total: totalCount[0].count,
        byDepartment,
        recentVisits
      }
    });
  } catch (error) {
    console.error('Error getting visit statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching statistics',
      error: error.message
    });
  }
});

// Get top 5 most frequent visitors
router.get('/top-visitors', async (req, res) => {
  try {
    const query = `
      SELECT 
        vis.name,
        vis.email,
        vis.phone,
        COUNT(v.id) as visit_count,
        MAX(v.checkin_time) as last_visit
      FROM visitors vis
      JOIN visits v ON vis.id = v.visitor_id
      GROUP BY vis.id, vis.name, vis.email, vis.phone
      ORDER BY visit_count DESC
      LIMIT 5
    `;
    const [visitors] = await db.execute(query);
    res.json({ visitors: Array.isArray(visitors) ? visitors : [] });
  } catch (error) {
    res.status(500).json({ visitors: [] });
  }
});

// Search visitor by name and email
router.get('/search-visitor', async (req, res) => {
  const { name, email } = req.query;
  try {
    const query = `
      SELECT 
        v.name, 
        v.email, 
        COUNT(DISTINCT vi.id) as total_visits,
        GROUP_CONCAT(DATE_FORMAT(vi.created_at, '%Y-%m-%d %H:%i')) as visit_dates,
        GROUP_CONCAT(DISTINCT d.name) as departments_visited
      FROM visitors v
      JOIN visits vi ON vi.visitor_id = v.id
      JOIN employees e ON vi.employee_id = e.id
      JOIN departments d ON e.department_id = d.id
      WHERE (v.status = 'Checked-In' OR v.status = 'Checked-Out') AND v.name LIKE ? AND v.email LIKE ?
      GROUP BY v.name, v.email
    `;
    const [visitors] = await db.execute(query, [`%${name || ''}%`, `%${email || ''}%`]);
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
    res.json({ stats: Array.isArray(stats) ? stats : [] });
  } catch (error) {
    res.status(500).json({ stats: [] });
  }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const db = require('../db');

// Get all active employees by department ID
router.get('/', async (req, res) => {
  try {
    const { department_id } = req.query;
    let query = `
      SELECT 
        e.id,
        e.employee_id,
        e.name,
        e.email,
        e.phone,
        e.position,
        d.name as department_name
      FROM employees e
      JOIN departments d ON e.department_id = d.id
      WHERE 1=1
    `;
    
    const params = [];
    
    if (department_id) {
      query += ' AND e.department_id = ?';
      params.push(department_id);
    }
    
    query += ' ORDER BY e.name';
    
    const [employees] = await db.execute(query, params);

    res.json(employees);
  } catch (error) {
    console.error('Error fetching employees by department:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching employees',
      error: error.message
    });
  }
});

// Get all departments
router.get('/departments', async (req, res) => {
  try {
    const [departments] = await db.execute(
      `SELECT 
        id,
        name,
        location,
        contact_person,
        contact_phone
      FROM departments
      ORDER BY name`
    );

    res.json({
      success: true,
      data: departments
    });
  } catch (error) {
    console.error('Error fetching departments:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching departments',
      error: error.message
    });
  }
});

module.exports = router;

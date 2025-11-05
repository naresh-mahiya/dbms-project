const express = require('express');
const router = express.Router();
const db = require('../db');

// Get all departments
router.get('/', async (req, res) => {
    try {
        const [departments] = await db.query('SELECT * FROM departments');
        res.json(departments);
    } catch (error) {
        console.error('Error fetching departments:', error);
        res.status(500).json({ error: 'Failed to fetch departments' });
    }
});

// Get department by ID
router.get('/:id', async (req, res) => {
    try {
        const [department] = await db.query('SELECT * FROM departments WHERE id = ?', [req.params.id]);
        if (department.length === 0) {
            return res.status(404).json({ error: 'Department not found' });
        }
        res.json(department[0]);
    } catch (error) {
        console.error('Error fetching department:', error);
        res.status(500).json({ error: 'Failed to fetch department' });
    }
});

module.exports = router;

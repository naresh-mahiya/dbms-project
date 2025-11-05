const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
// const mysql = require('mysql2'); // Not needed since we use mysql2/promise in db.js

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// // Request logging middleware
// app.use((req, res, next) => {
//   console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
//   console.log('Request headers:', req.headers);
//   next();
// });

// Database connection
const db = require('./db');

// Test database connection
db.execute('SELECT 1')
  .then(() => {
    console.log('Connected to MySQL database');
  })
  .catch((err) => {
    console.error('Error connecting to MySQL:', err);
  });

// Routes
const visitorRoutes = require('./routes/visitors');
const receptionistRoutes = require('./routes/receptionists');
const adminRoutes = require('./routes/admin');
const employeeRoutes = require('./routes/employees');
const departmentRoutes = require('./routes/departments');

// API Routes
app.use('/api/visitors', visitorRoutes);
app.use('/api/receptionists', receptionistRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/departments', departmentRoutes);



// // Error handling middleware
// app.use((err, req, res, next) => {
//   console.error('Error:', err);
//   res.status(500).json({
//     success: false,
//     message: 'Internal server error',
//     error: err.message
//   });
// });

// 404 handler
// app.use((req, res) => {
//   console.log('404 - Route not found:', req.url);
//   res.status(404).json({
//     success: false,
//     message: 'Route not found'
//   });
// });

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

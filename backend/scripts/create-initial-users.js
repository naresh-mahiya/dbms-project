const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');
require('dotenv').config({ path: '../.env' });

async function createInitialUsers() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME
    });

    // Create admin
    const adminPassword = await bcrypt.hash('admin123', 10);
    await connection.execute(
      'INSERT INTO admins (username, password) VALUES (?, ?)',
      ['admin', adminPassword]
    );

    // Create receptionist
    const receptionistPassword = await bcrypt.hash('reception123', 10);
    await connection.execute(
      'INSERT INTO receptionists (username, password) VALUES (?, ?)',
      ['receptionist', receptionistPassword]
    );

    console.log('Initial users created successfully!');
    console.log('Admin credentials: username: admin, password: admin123');
    console.log('Receptionist credentials: username: receptionist, password: reception123');

    await connection.end();
  } catch (error) {
    console.error('Error creating initial users:', error);
  }
}

createInitialUsers();

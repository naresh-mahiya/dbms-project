const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function hashAdminPassword() {
    const pool = await mysql.createPool({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: '',
        database: process.env.DB_NAME || 'visitor_management',
        port: process.env.DB_PORT || 3306
    });

    try {
        // Get the admin's current password
        const [admins] = await pool.execute('SELECT * FROM admins');
        if (admins.length === 0) {
            console.log('No admin found in database');
            return;
        }

        const admin = admins[1];
        console.log('Found admin:', admin.username);

        // Hash the password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('12345678', salt); // Using default password 12345678

        // Update the admin's password
        await pool.execute(
            'UPDATE admins SET password = ? WHERE username = ?',
            [hashedPassword, admin.username]
        );

        console.log('Password successfully hashed and updated for admin:', admin.username);
        console.log('New hashed password:', hashedPassword);
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await pool.end();
    }
}

hashAdminPassword();

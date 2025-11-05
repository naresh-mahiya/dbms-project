CREATE DATABASE IF NOT EXISTS visitor_management;
USE visitor_management;

-- Receptionists table (for login and tracking who checked in visitors)
CREATE TABLE IF NOT EXISTS receptionists (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE,
    phone VARCHAR(20),
    is_active BOOLEAN DEFAULT true,
    last_login DATETIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Admins table (for admin login)
CREATE TABLE IF NOT EXISTS admins (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Departments table
CREATE TABLE IF NOT EXISTS departments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    location VARCHAR(100),
    contact_person VARCHAR(100) COMMENT 'General department contact person (not specific to visits)',
    contact_phone VARCHAR(20) COMMENT 'General department contact number',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_name (name)
);

-- Employees table (people who receive visitors)
CREATE TABLE IF NOT EXISTS employees (
    id INT AUTO_INCREMENT PRIMARY KEY,
    employee_id VARCHAR(20) UNIQUE NOT NULL COMMENT 'Employee ID used for identification',
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    phone VARCHAR(20),
    department_id INT NOT NULL COMMENT 'Department this employee belongs to',
    position VARCHAR(100),
    is_active BOOLEAN DEFAULT true COMMENT 'Soft delete flag',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE RESTRICT
);

-- Visitors table (people who visit)
CREATE TABLE IF NOT EXISTS visitors (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(100),
    address TEXT,
    id_proof_type ENUM('Aadhar', 'PAN', 'Passport', 'Driving License', 'Other') NOT NULL,
    id_proof_number VARCHAR(50) NOT NULL,
    token VARCHAR(10) UNIQUE,
    status ENUM('Pending', 'Checked-In', 'Checked-Out') DEFAULT 'Pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Visits table (to track each visit)
CREATE TABLE IF NOT EXISTS visits (
    id INT AUTO_INCREMENT PRIMARY KEY,
    visitor_id INT NOT NULL,
    employee_id INT NOT NULL,
    token VARCHAR(10) NOT NULL,
    purpose TEXT NOT NULL,
    status ENUM('Pending', 'Checked-In', 'Checked-Out') DEFAULT 'Pending',
    checkin_time DATETIME,
    checkout_time DATETIME,
    receptionist_id INT,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (visitor_id) REFERENCES visitors(id) ON DELETE CASCADE,
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE RESTRICT,
    FOREIGN KEY (receptionist_id) REFERENCES receptionists(id) ON DELETE SET NULL,
    INDEX idx_visitor (visitor_id),
    INDEX idx_employee (employee_id),
    INDEX idx_token (token),
    INDEX idx_status (status),
    INDEX idx_checkin (checkin_time)
);

-- Insert sample departments with Indian names and details
INSERT INTO departments (name, location, contact_person, contact_phone) VALUES
('Human Resources', 'First Floor, North Wing', 'Aarav Sharma', '9876543210'),
('Information Technology', 'Second Floor, East Wing', 'Priya Patel', '9876543211'),
('Finance', 'Third Floor, South Wing', 'Rahul Verma', '9876543212'),
('Operations', 'Ground Floor, West Wing', 'Ananya Gupta', '9876543213'),
('Marketing', 'Fourth Floor, Central Wing', 'Vikram Singh', '9876543214'),
('Customer Support', 'Mezzanine Floor', 'Neha Reddy', '9876543215'),
('Research & Development', 'Fifth Floor', 'Arjun Iyer', '9876543216');

-- Insert sample employees with Indian names and details
INSERT INTO employees (employee_id, name, email, phone, department_id, position) VALUES
-- HR Department
('HR001', 'Aarav Sharma', 'aarav.sharma@company.in', '9876543220', 1, 'HR Manager'),
('HR002', 'Ishaan Patel', 'ishaan.patel@company.in', '9876543221', 1, 'Recruitment Executive'),

-- IT Department
('IT001', 'Priya Patel', 'priya.patel@company.in', '9876543230', 2, 'IT Manager'),
('IT002', 'Rahul Mehta', 'rahul.mehta@company.in', '9876543231', 2, 'Senior Developer'),
('IT003', 'Anjali Desai', 'anjali.desai@company.in', '9876543232', 2, 'UI/UX Designer'),

-- Finance Department
('FN001', 'Rahul Verma', 'rahul.verma@company.in', '9876543240', 3, 'Finance Head'),
('FN002', 'Sneha Joshi', 'sneha.joshi@company.in', '9876543241', 3, 'Senior Accountant'),

-- Operations Department
('OP001', 'Ananya Gupta', 'ananya.gupta@company.in', '9876543250', 4, 'Operations Manager'),
('OP002', 'Rohit Malhotra', 'rohit.malhotra@company.in', '9876543251', 4, 'Logistics Head'),

-- Marketing Department
('MK001', 'Vikram Singh', 'vikram.singh@company.in', '9876543260', 5, 'Marketing Head'),
('MK002', 'Meera Kapoor', 'meera.kapoor@company.in', '9876543261', 5, 'Digital Marketing Executive'),

-- Customer Support Department
('CS001', 'Neha Reddy', 'neha.reddy@company.in', '9876543270', 6, 'Support Manager'),
('CS002', 'Arun Kumar', 'arun.kumar@company.in', '9876543271', 6, 'Customer Support Executive'),

-- R&D Department
('RD001', 'Arjun Iyer', 'arjun.iyer@company.in', '9876543280', 7, 'R&D Head'),
('RD002', 'Divya Nair', 'divya.nair@company.in', '9876543281', 7, 'Research Scientist');

-- Insert sample receptionists
INSERT INTO receptionists (username, password, full_name, email, phone) VALUES
('reception', '$2a$12$sa.FyE3X.f4/Y3YIdKBPxuBQIknxObxuuBJzZVoWsLezdho4lq1di', 'reception', 'reception@company.in', '9876543200');

-- Insert sample admin
INSERT INTO admins (username, password) VALUES
('admin', '$2a$12$LKcpgJij4AzMEDNiLNQT.Oi.uY6rEZcHLgSSK.syQh6RdLj0G1LyK');

-- Replace sample visitors with new data
INSERT INTO visitors (name, phone, email, address, id_proof_type, id_proof_number, token, status, created_at) VALUES
-- Completed visitors (checked out)
('Rajesh Kumar', '9876544001', 'rajesh.kumar@email.com', '123 MG Road, Mumbai, Maharashtra', 'Aadhar', '123456789012', 'TOK001', 'Checked-Out', '2025-10-15 09:20:00'),
('Priya Sharma', '9876544002', 'priya.s@email.com', 'Park St, Kolkata', 'PAN', 'ABCDE1234F', 'TOK002', 'Checked-Out', '2025-10-16 11:30:00'),
('Neha Gupta', '9876544003', 'neha.g@email.com', 'Connaught Place, Delhi', 'Passport', 'P1234567', 'TOK003', 'Checked-Out', '2025-10-17 13:10:00'),
('Rohan Malhotra', '9876544004', 'rohan.m@email.com', 'Whitefield, Bangalore', 'PAN', 'FGHIJ1234K', 'TOK004', 'Checked-Out', '2025-10-18 15:40:00'),
('Ananya Reddy', '9876544005', 'ananya.r@email.com', 'Banjara Hills, Hyderabad', 'Driving License', 'DL987654321', 'TOK005', 'Checked-Out', '2025-10-19 10:10:00'),
('Vikram Singh', '9876544006', 'vikram.s@email.com', 'Koramangala, Bangalore', 'Aadhar', '456789012345', 'TOK006', 'Checked-Out', '2025-10-20 08:20:00'),
('Meera Kapoor', '9876544007', 'meera.k@email.com', 'Anna Nagar, Chennai', 'PAN', 'XYZAB1234P', 'TOK007', 'Checked-Out', '2025-10-21 09:30:00'),
('Sanjay Gupta', '9876544008', 'sanjay.g@email.com', 'Indiranagar, Bangalore', 'Aadhar', '606060606060', 'TOK008', 'Checked-Out', '2025-10-22 13:39:00'),
-- Currently checked-in visitors
('Amit Patel', '9876544009', 'amit.p@email.com', 'Brigade Road, Bangalore', 'Aadhar', '234567890123', 'TOK009', 'Checked-In', '2025-11-03 10:40:00'),
('Kavita Desai', '9876544010', 'kavita.d@email.com', 'Sector 21, Gurugram', 'Passport', 'P6543210', 'TOK010', 'Checked-In', '2025-11-02 11:20:00'),
('Deepak Rao', '9876544011', 'deepak.r@email.com', 'Gachibowli, Hyderabad', 'PAN', 'LMNOP1234Q', 'TOK011', 'Checked-In', '2025-10-28 14:45:00'),
('Pooja Reddy', '9876544012', 'pooja.r@email.com', 'Gachibowli, Hyderabad', 'Aadhar', '890123456789', 'TOK012', 'Checked-In', '2025-11-05 09:00:00'),
-- Pending approval visitors
('Harsh Vardhan', '9876544013', 'harsh.v@email.com', 'Bandra, Mumbai', 'Aadhar', '111122223333', 'TOK013', 'Pending', '2025-11-04 13:10:00'),
('Divya Nair', '9876544014', 'divya.n@email.com', 'MG Road, Pune', 'Passport', 'P9871230', 'TOK014', 'Pending', '2025-11-02 11:15:00'),
('Tina Paul', '9876544015', 'tina.p@email.com', 'Krishna Nagar, Delhi', 'PAN', 'QRSTU1234C', 'TOK015', 'Pending', '2025-11-05 15:55:00');

-- Replace sample visits with new real data for 2025-10-15 to 2025-11-05
INSERT INTO visits (visitor_id, employee_id, token, purpose, status, checkin_time, checkout_time, receptionist_id, notes, created_at) VALUES
-- Past completed visits
(1, 3, 'TOK001', 'Job Interview', 'Checked-Out', '2025-10-15 09:30:00', '2025-10-15 10:40:00', 1, 'Excellent candidate.', '2025-10-15 09:20:00'),
(2, 5, 'TOK002', 'Finance Review', 'Checked-Out', '2025-10-16 12:00:00', '2025-10-16 13:00:00', 1, 'Discussed financials.', '2025-10-16 11:30:00'),
(3, 8, 'TOK003', 'Vendor Meeting', 'Checked-Out', '2025-10-17 14:00:00', '2025-10-17 15:30:00', 1, 'Supplier negotiation.', '2025-10-17 13:10:00'),
(4, 10, 'TOK004', 'Tech Demo', 'Checked-Out', '2025-10-18 16:00:00', '2025-10-18 17:10:00', 1, 'Demo shown to IT.', '2025-10-18 15:40:00'),
(5, 12, 'TOK005', 'HR Round', 'Checked-Out', '2025-10-19 09:45:00', '2025-10-19 10:45:00', 1, 'HR documentation.', '2025-10-19 10:10:00'),
(6, 14, 'TOK006', 'Support Issue', 'Checked-Out', '2025-10-20 08:30:00', '2025-10-20 09:12:00', 1, 'Support resolved.', '2025-10-20 08:20:00'),
(7, 15, 'TOK007', 'R&D Collaboration', 'Checked-Out', '2025-10-21 09:40:00', '2025-10-21 11:10:00', 1, 'New research project.', '2025-10-21 09:30:00'),
(8, 11, 'TOK008', 'Operations Feedback', 'Checked-Out', '2025-10-22 13:40:00', '2025-10-22 14:40:00', 1, 'Process improvement.', '2025-10-22 13:39:00'),
-- Frequent: multiple visits same visitor
(8, 13, 'TOK008B', 'Marketing Planning', 'Checked-Out', '2025-10-23 12:00:00', '2025-10-23 13:20:00', 1, 'Campaign launch.', '2025-10-23 11:59:00'),
-- Currently checked-in visits
(9, 2, 'TOK009', 'Interview With IT', 'Checked-In', '2025-11-03 10:50:00', NULL, 1, '', '2025-11-03 10:40:00'),
(10, 6, 'TOK010', 'Support Ticket', 'Checked-In', '2025-11-02 11:30:00', NULL, 1, 'Ongoing issue.', '2025-11-02 11:20:00'),
(11, 8, 'TOK011', 'Team Review', 'Checked-In', '2025-10-28 15:00:00', NULL, 1, '', '2025-10-28 14:45:00'),
(12, 7, 'TOK012', 'Admin/HR Onboarding', 'Checked-In', '2025-11-05 09:04:00', NULL, 1, '', '2025-11-05 09:00:00'),
-- Pending status, no checkin
(13, 3, 'TOK013', 'Pending for Director', 'Pending', NULL, NULL, 1, '', '2025-11-04 13:10:00'),
(14, 14, 'TOK014', 'Pending IT Review', 'Pending', NULL, NULL, 1, '', '2025-11-02 11:15:00'),
(15, 4, 'TOK015', 'Pending Finance Auditing', 'Pending', NULL, NULL, 1, '', '2025-11-05 15:55:00');
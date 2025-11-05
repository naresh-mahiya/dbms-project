import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  Snackbar,
  Alert,
  Stack,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress
} from '@mui/material';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const VisitorForm = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    employee_id: '',
    department_id: '',
    purpose: '',
    id_proof_type: '', // <-- add
    id_proof_number: '' // <-- add
  });
  
  const [departments, setDepartments] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState({
    departments: true,
    employees: false
  });

  const [formSubmitted, setFormSubmitted] = useState(false);
  const [submissionData, setSubmissionData] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  // Fetch departments on component mount
  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/departments');
        const depArr = Array.isArray(response.data.data) ? response.data.data : (Array.isArray(response.data) ? response.data : []);
        setDepartments(depArr);
        setLoading(prev => ({ ...prev, departments: false }));
      } catch (error) {
        console.error('Error fetching departments:', error);
        setDepartments([]);
        setLoading(prev => ({ ...prev, departments: false }));
      }
    };

    fetchDepartments();
  }, []);

  // Fetch employees when department changes
  useEffect(() => {
    const fetchEmployees = async () => {
      if (!formData.department_id) {
        setEmployees([]);
        return;
      }
      
      try {
        setLoading(prev => ({ ...prev, employees: true }));
        const response = await axios.get(`http://localhost:5000/api/employees?department_id=${formData.department_id}`);
        setEmployees(Array.isArray(response.data) ? response.data : []);
        setFormData(prev => ({ ...prev, employee_id: '' })); // Reset employee selection
      } catch (error) {
        console.error('Error fetching employees:', error);
        setEmployees([]);
      } finally {
        setLoading(prev => ({ ...prev, employees: false }));
      }
    };

    fetchEmployees();
  }, [formData.department_id]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    console.log('Input changed:', name, value);
    setFormData(prevData => ({
      ...prevData,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('Submitting form data:', formData); // Debug log
    try {
      // Defensive: only send employee_id value (string or number)
      const submission = { ...formData, employee_id: formData.employee_id };
      const response = await axios.post('http://localhost:5000/api/visitors/register', submission);
      console.log('Registration response:', response.data);

      // Store the response data first
      const responseData = response.data;
      console.log('Response data:', responseData);

      // Check if we have the necessary data
      if (responseData.success) {
        setFormSubmitted(true);
        setSubmissionData(responseData);
        setSnackbar({
          open: true,
          message: 'Pre-registration successful!',
          severity: 'success'
        });
      } else {
        throw new Error(responseData.message || 'Registration failed');
      }
      setFormData({
        name: '',
        phone: '',
        email: '',
        address: '',
        person_to_meet: '',
        purpose: '',
        department: '',
        id_proof_type: '', // <-- add
        id_proof_number: '' // <-- add
      });
    } catch (error) {
      console.error('Registration error:', error);
      setSnackbar({
        open: true,
        message: error.message || 'Error submitting form. Please try again.',
        severity: 'error'
      });
      setFormSubmitted(false);
      setSubmissionData(null);
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  return (
    <Container maxWidth="sm">
      {formSubmitted && submissionData && (
        <Paper elevation={3} sx={{ p: 4, mt: 4, mb: 4, textAlign: 'center', bgcolor: '#e3f2fd' }}>
          <Typography variant="h5" gutterBottom>
            Registration Successful!
          </Typography>
          <Typography variant="body1" gutterBottom>
            Please save your token for check-in:
          </Typography>
          {submissionData && submissionData.data && (
            <Typography variant="h3" sx={{ my: 3, color: '#1976d2', fontWeight: 'bold' }}>
              {submissionData.data.token}
            </Typography>
          )}
          <Typography variant="body2" color="text.secondary">
            Please take a screenshot or note down this token.
            You will need it when you arrive at the reception.
          </Typography>
          <Button
            variant="contained"
            sx={{ mt: 2 }}
            onClick={() => {
              setFormSubmitted(false);
              setSubmissionData(null);
            }}
          >
            Register Another Visitor
          </Button>
        </Paper>
      )}
      {!formSubmitted && (
        <Box sx={{ mt: 4, mb: 4 }}>
          {/* Login Buttons */}
          <Paper elevation={3} sx={{ p: 2, mb: 3 }}>
            <Stack direction="row" spacing={2} justifyContent="center">
              <Button
                variant="contained"
                color="primary"
                onClick={() => navigate('/admin/login')}
                sx={{ minWidth: 150 }}
              >
                Admin Login
              </Button>
              <Button
                variant="contained"
                color="secondary"
                onClick={() => navigate('/receptionist/login')}
                sx={{ minWidth: 150 }}
              >
                Receptionist Login
              </Button>
            </Stack>
          </Paper>

          <Paper elevation={3} sx={{ p: 4 }}>
            <Typography variant="h4" component="h1" gutterBottom align="center">
              Visitor Pre-registration
            </Typography>
            <form onSubmit={handleSubmit}>
              <TextField
                fullWidth
                label="Name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                margin="normal"
              />
              <TextField
                fullWidth
                label="Phone Number"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                required
                margin="normal"
              />
              <TextField
                fullWidth
                label="Email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                margin="normal"
              />
              <TextField
                fullWidth
                label="Address"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                required
                margin="normal"
                multiline
                rows={3}
              />
              <FormControl fullWidth margin="normal" required>
                <InputLabel id="department-label">Department</InputLabel>
                <Select
                  labelId="department-label"
                  name="department_id"
                  value={formData.department_id}
                  onChange={handleInputChange}
                  label="Department"
                  disabled={loading.departments}
                >
                  <MenuItem value="">
                    <em>Select Department</em>
                  </MenuItem>
                  {departments.map((dept) => (
                    <MenuItem key={dept.id} value={dept.id}>
                      {dept.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl fullWidth margin="normal" required>
                <InputLabel id="employee-label">Person to Meet</InputLabel>
                <Select
                  labelId="employee-label"
                  name="employee_id"
                  value={formData.employee_id}
                  onChange={handleInputChange}
                  label="Person to Meet"
                  disabled={!formData.department_id || loading.employees}
                >
                  <MenuItem value="">
                    <em>Select Department First</em>
                  </MenuItem>
                  {employees.map((emp) => (
                    <MenuItem key={emp.id} value={emp.employee_id}>
                      {emp.name} ({emp.position})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField
                fullWidth
                label="Purpose of Visit"
                name="purpose"
                value={formData.purpose}
                onChange={handleInputChange}
                required
                margin="normal"
                multiline
                rows={3}
              />
              <TextField
                fullWidth
                required
                label="ID Proof Number"
                name="id_proof_number"
                value={formData.id_proof_number}
                onChange={handleInputChange}
                margin="normal"
              />
              <FormControl fullWidth margin="normal" required>
                <InputLabel>ID Proof Type</InputLabel>
                <Select
                  name="id_proof_type"
                  value={formData.id_proof_type}
                  label="ID Proof Type"
                  onChange={handleInputChange}
                >
                  <MenuItem value="Aadhar">Aadhar</MenuItem>
                  <MenuItem value="PAN">PAN</MenuItem>
                  <MenuItem value="Passport">Passport</MenuItem>
                  <MenuItem value="Driving License">Driving License</MenuItem>
                  <MenuItem value="Other">Other</MenuItem>
                </Select>
              </FormControl>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                fullWidth
                size="large"
                sx={{ mt: 3 }}
              >
                Submit
              </Button>
            </form>
          </Paper>
        </Box>
      )}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default VisitorForm;

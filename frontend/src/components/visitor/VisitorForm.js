import React, { useState } from 'react';
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  Snackbar,
  Alert,
  Stack
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
    person_to_meet: '',
    purpose: '',
    department: ''
  });

  const [formSubmitted, setFormSubmitted] = useState(false);
  const [submissionData, setSubmissionData] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

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
      const response = await axios.post('http://localhost:5000/api/visitors/register', formData);
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
        department: ''
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
          <Typography variant="h3" sx={{ my: 3, color: '#1976d2', fontWeight: 'bold' }}>
            {submissionData.token}
          </Typography>
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
              <TextField
                fullWidth
                label="Person to Meet"
                name="person_to_meet"
                value={formData.person_to_meet}
                onChange={handleInputChange}
                required
                margin="normal"
              />
              <TextField
                fullWidth
                label="Purpose of Visit"
                name="purpose"
                value={formData.purpose}
                onChange={handleInputChange}
                required
                margin="normal"
              />
              <TextField
                select
                fullWidth
                label=""
                name="department"
                value={formData.department}
                onChange={handleInputChange}
                margin="normal"
                required
                SelectProps={{
                  native: true,
                }}
              >
                <option value="">Select Department</option>
                <option value="CSE">CSE</option>
                <option value="ECE">ECE</option>
                <option value="Hostel">Hostel</option>
                <option value="Delivery">Delivery</option>
              </TextField>
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

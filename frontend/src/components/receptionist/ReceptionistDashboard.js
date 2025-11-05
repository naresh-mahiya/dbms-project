import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Snackbar,
  Alert,
  Grid,
  Stack
} from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import axios from 'axios';

const ReceptionistDashboard = () => {
  const navigate = useNavigate();
  const [visitors, setVisitors] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [visitorTokens, setVisitorTokens] = useState({});
  const [verifiedTokens, setVerifiedTokens] = useState({});

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/receptionist/login');
      return;
    }
    fetchTodayVisitors();
  }, [navigate]);

  const fetchTodayVisitors = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/visitors/today', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setVisitors(response.data.visitors);
    } catch (error) {
      showSnackbar('Error fetching visitors', 'error');
    }
  };

  const handleSearch = async () => {
    try {
      const response = await axios.get(`http://localhost:5000/api/visitors/search?name=${searchQuery}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setVisitors(response.data.visitors);
    } catch (error) {
      showSnackbar('Error searching visitors', 'error');
    }
  };

  const verifyToken = async (visitorId, token) => {
    try {
      const response = await axios.post('http://localhost:5000/api/visitors/verify-token', 
        { visitorId, token },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      setVerifiedTokens(prev => ({
        ...prev,
        [visitorId]: true
      }));
      showSnackbar('Token verified successfully', 'success');
    } catch (error) {
      setVerifiedTokens(prev => ({
        ...prev,
        [visitorId]: false
      }));
      showSnackbar('Invalid token', 'error');
    }
  };

  const handleTokenChange = (visitorId, token) => {
    setVisitorTokens(prev => ({
      ...prev,
      [visitorId]: token
    }));
    // Reset verification when token changes
    setVerifiedTokens(prev => ({
      ...prev,
      [visitorId]: false
    }));
  };

  const handleStatus = async (visitorId, newStatus) => {
    try {
      if (newStatus === 'Checked-In') {
        const token = visitorTokens[visitorId];
        if (!token) {
          showSnackbar('Please enter visitor token first', 'error');
          return;
        }
        if (!verifiedTokens[visitorId]) {
          showSnackbar('Please verify the token first', 'error');
          return;
        }
      }

      const response = await axios.put(
        `http://localhost:5000/api/visitors/status/${visitorId}`,
        { status: newStatus, token: visitorTokens[visitorId] },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );

      // Update the visitor in the local state immediately
      if (response.data.visitor) {
        setVisitors(prevVisitors => 
          prevVisitors.map(visitor => 
            visitor.id === visitorId ? { ...visitor, ...response.data.visitor } : visitor
          )
        );
      }

      showSnackbar(`Visitor ${newStatus.toLowerCase()} successfully`, 'success');
      
      // Clear token after successful check-in
      if (newStatus === 'Checked-In') {
        setVisitorTokens(prev => {
          const newTokens = { ...prev };
          delete newTokens[visitorId];
          return newTokens;
        });
        setVerifiedTokens(prev => {
          const newVerified = { ...prev };
          delete newVerified[visitorId];
          return newVerified;
        });
      }
      // Clear token after successful check-in
      if (newStatus === 'Checked-In') {
        setVisitorTokens(prev => {
          const newTokens = { ...prev };
          delete newTokens[visitorId];
          return newTokens;
        });
      }
    } catch (error) {
      if (error.response && error.response.status === 401) {
        showSnackbar('Invalid token', 'error');
      } else {
        showSnackbar('Error updating visitor status', 'error');
      }
    }
  };

  const showSnackbar = (message, severity) => {
    setSnackbar({ open: true, message, severity });
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    navigate('/receptionist/login');
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Grid container justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
          <Grid item>
            <Typography variant="h4" component="h1">
              Receptionist Dashboard
            </Typography>
          </Grid>
          <Grid item>
            <Stack direction="row" spacing={2}>
              <Button
                variant="contained"
                color="primary"
                onClick={() => navigate('/')}
                startIcon={<HomeIcon />}
              >
                Home
              </Button>
              <Button 
                variant="contained" 
                color="secondary" 
                onClick={handleLogout}
              >
                Logout
              </Button>
            </Stack>
          </Grid>
        </Grid>

        <Paper sx={{ p: 2, mb: 3 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={8}>
              <TextField
                fullWidth
                label="Search by visitor name"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </Grid>
            <Grid item xs={2}>
              <Button
                fullWidth
                variant="contained"
                onClick={handleSearch}
                disabled={!searchQuery}
              >
                Search
              </Button>
            </Grid>
            <Grid item xs={2}>
              <Button
                fullWidth
                variant="outlined"
                onClick={fetchTodayVisitors}
              >
                Show Today's
              </Button>
            </Grid>
          </Grid>
        </Paper>

        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Phone</TableCell>
                <TableCell>Person to Meet</TableCell>
                <TableCell>Purpose</TableCell>
                <TableCell>Department</TableCell>
                <TableCell>Check-in Time</TableCell>
                <TableCell>Check-out Time</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {visitors.map((visitor) => (
                <TableRow key={visitor.id}>
                  <TableCell>{visitor.name}</TableCell>
                  <TableCell>{visitor.phone}</TableCell>
                  <TableCell>{visitor.person_to_meet}</TableCell>
                  <TableCell>{visitor.purpose}</TableCell>
                  <TableCell>{visitor.department || '-'}</TableCell>
                  <TableCell>
                    {visitor.checkin_time ? new Date(visitor.checkin_time).toLocaleString('en-US', {
                      year: 'numeric',
                      month: 'numeric',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: false
                    }) : '-'}
                  </TableCell>
                  <TableCell>
                    {visitor.checkout_time ? new Date(visitor.checkout_time).toLocaleString('en-US', {
                      year: 'numeric',
                      month: 'numeric',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: false
                    }) : '-'}
                  </TableCell>
                  <TableCell>{visitor.status}</TableCell>
                  <TableCell>
                    {visitor.status === 'Pending' && (
                      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                        <TextField
                          size="small"
                          placeholder="Enter token"
                          value={visitorTokens[visitor.id] || ''}
                          onChange={(e) => handleTokenChange(visitor.id, e.target.value)}
                        />
                        <Button
                          variant="outlined"
                          color="info"
                          size="small"
                          onClick={() => verifyToken(visitor.id, visitorTokens[visitor.id])}
                          disabled={!visitorTokens[visitor.id]}
                        >
                          Verify
                        </Button>
                        <Button
                          variant="contained"
                          color="primary"
                          size="small"
                          onClick={() => handleStatus(visitor.id, 'Checked-In')}
                          disabled={!verifiedTokens[visitor.id]}
                        >
                          Check In
                        </Button>
                      </Box>
                    )}
                    {visitor.status === 'Checked-In' && (
                      <Button
                        variant="contained"
                        color="secondary"
                        size="small"
                        onClick={() => handleStatus(visitor.id, 'Checked-Out')}
                      >
                        Check Out
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default ReceptionistDashboard;

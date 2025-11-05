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
  const [isTodayView, setIsTodayView] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/receptionist/login');
      return;
    }
    fetchAllVisits();
  }, [navigate]);

  const fetchAllVisits = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/visitors/search', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setVisitors(Array.isArray(response.data.data) ? response.data.data : []);
      setIsTodayView(false);
      setSearchQuery(''); // Clear search query
    } catch (error) {
      showSnackbar('Error fetching all visits', 'error');
      setVisitors([]);
      setIsTodayView(false);
    }
  };

  const fetchTodayVisitors = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/visitors/today', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setVisitors(Array.isArray(response.data.data) ? response.data.data : []);
      setIsTodayView(true);
      setSearchQuery(''); // Clear search query
    } catch (error) {
      showSnackbar('Error fetching visitors', 'error');
      setVisitors([]);
      setIsTodayView(true);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      showSnackbar('Please enter a search query', 'warning');
      return;
    }
    
    try {
      const response = await axios.get(`http://localhost:5000/api/visitors/search?name=${searchQuery}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setVisitors(Array.isArray(response.data.data) ? response.data.data : []);
      setIsTodayView(false);
    } catch (error) {
      showSnackbar('Error searching visitors', 'error');
      setVisitors([]);
    }
  };

  const verifyToken = async (visitId, token) => {
    if (!token || !token.trim()) {
      showSnackbar('Please enter a token', 'warning');
      return;
    }

    try {
      const response = await axios.post('http://localhost:5000/api/visitors/verify-token', 
        { visitorId: visitId, token: token.trim() },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      
      if (response.data.success) {
        setVerifiedTokens(prev => ({
          ...prev,
          [visitId]: true
        }));
        showSnackbar('Token verified successfully', 'success');
      }
    } catch (error) {
      setVerifiedTokens(prev => ({
        ...prev,
        [visitId]: false
      }));
      showSnackbar(error.response?.data?.message || 'Invalid token', 'error');
    }
  };

  const handleTokenChange = (visitId, token) => {
    setVisitorTokens(prev => ({
      ...prev,
      [visitId]: token
    }));
    // Reset verification when token changes
    if (verifiedTokens[visitId]) {
      setVerifiedTokens(prev => ({
        ...prev,
        [visitId]: false
      }));
    }
  };

  const handleStatus = async (visitToken, newStatus, visitId) => {
    try {
      if (newStatus === 'Checked-In') {
        const enteredToken = visitorTokens[visitId];
        if (!enteredToken || !enteredToken.trim()) {
          showSnackbar('Please enter visitor token first', 'error');
          return;
        }
        if (!verifiedTokens[visitId]) {
          showSnackbar('Please verify the token first', 'error');
          return;
        }
      }
      
      const response = await axios.put(
        `http://localhost:5000/api/visitors/visit/${visitToken}/status`, 
        { status: newStatus }, 
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      
      if (response.data.success) {
        // Refresh the appropriate list
        if (isTodayView) {
          fetchTodayVisitors();
        } else if (searchQuery) {
          handleSearch();
        } else {
          fetchAllVisits();
        }
        
        showSnackbar(`Visitor ${newStatus.toLowerCase()} successfully`, 'success');
        
        // Clear token fields after successful check-in
        if (newStatus === 'Checked-In') {
          setVisitorTokens(prev => {
            const newTokens = { ...prev };
            delete newTokens[visitId];
            return newTokens;
          });
          setVerifiedTokens(prev => {
            const newVerified = { ...prev };
            delete newVerified[visitId];
            return newVerified;
          });
        }
      }
    } catch (error) {
      showSnackbar(error.response?.data?.message || 'Error updating visitor status', 'error');
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

  const formatDateTime = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
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
            <Grid item xs={12} sm={6} md={6}>
              <TextField
                fullWidth
                label="Search by visitor name"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && searchQuery.trim()) {
                    handleSearch();
                  }
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <Button
                fullWidth
                variant="contained"
                onClick={handleSearch}
                disabled={!searchQuery.trim()}
              >
                Search
              </Button>
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <Button
                fullWidth
                variant="outlined"
                onClick={fetchTodayVisitors}
              >
                Show Today's
              </Button>
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <Button
                fullWidth
                variant="outlined"
                onClick={fetchAllVisits}
              >
                Show All
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
              {visitors.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} align="center">
                    No visitors found
                  </TableCell>
                </TableRow>
              ) : (
                visitors.map((visitor) => {
                  const visitId = visitor.visit_id || visitor.id;
                  const visitToken = visitor.token;
                  
                  return (
                    <TableRow key={visitId}>
                      <TableCell>{visitor.visitor_name || visitor.name || '-'}</TableCell>
                      <TableCell>{visitor.phone || '-'}</TableCell>
                      <TableCell>{visitor.employee_name || visitor.person_to_meet || '-'}</TableCell>
                      <TableCell>{visitor.purpose || '-'}</TableCell>
                      <TableCell>{visitor.department_name || visitor.department || '-'}</TableCell>
                      <TableCell>{formatDateTime(visitor.checkin_time)}</TableCell>
                      <TableCell>{formatDateTime(visitor.checkout_time)}</TableCell>
                      <TableCell>{visitor.status || '-'}</TableCell>
                      <TableCell>
                        {visitor.status === 'Pending' && (
                          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
                            <TextField
                              size="small"
                              placeholder="Enter token"
                              value={visitorTokens[visitId] || ''}
                              onChange={(e) => handleTokenChange(visitId, e.target.value)}
                              sx={{ minWidth: '120px' }}
                            />
                            <Button
                              variant="outlined"
                              color="info"
                              size="small"
                              onClick={() => verifyToken(visitId, visitorTokens[visitId])}
                              disabled={!visitorTokens[visitId] || !visitorTokens[visitId].trim()}
                            >
                              Verify
                            </Button>
                            <Button
                              variant="contained"
                              color="primary"
                              size="small"
                              onClick={() => handleStatus(visitToken, 'Checked-In', visitId)}
                              disabled={!verifiedTokens[visitId]}
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
                            onClick={() => handleStatus(visitToken, 'Checked-Out', visitId)}
                          >
                            Check Out
                          </Button>
                        )}
                        {visitor.status === 'Checked-Out' && (
                          <Typography variant="body2" color="text.secondary">
                            Completed
                          </Typography>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
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
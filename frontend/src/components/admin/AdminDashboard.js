import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Button,
  Box,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Snackbar,
  Alert,
  Stack,
  TextField
} from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import SearchIcon from '@mui/icons-material/Search';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar
} from 'recharts';
import axios from 'axios';

// Chart colors
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [statistics, setStatistics] = useState(null);
  const [topVisitors, setTopVisitors] = useState([]);
  const [departmentStats, setDepartmentStats] = useState([]);
  const [searchName, setSearchName] = useState('');
  const [searchEmail, setSearchEmail] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'info'
  });
  const [dailyReport, setDailyReport] = useState(null);
  const [monthlyReport, setMonthlyReport] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/admin/login');
      return;
    }
    fetchStatistics();
    fetchTopVisitors();
    fetchDepartmentStats();
    fetchDailyReport();
    fetchMonthlyReport(selectedMonth);
  }, [navigate]);

  const fetchStatistics = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/admin/statistics', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setStatistics(response.data.statistics);
    } catch (error) {
      showSnackbar('Error fetching statistics', 'error');
    }
  };

  const fetchTopVisitors = async () => {
    console.log('Fetching top visitors...');
    try {
      const response = await axios.get('http://localhost:5000/api/visitors/top-visitors', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      console.log('Top visitors data:', response.data.visitors);
      setTopVisitors(response.data.visitors);
    } catch (error) {
      showSnackbar('Error fetching top visitors', 'error');
    }
  };

  const fetchDepartmentStats = async () => {
    console.log('Fetching department stats...');
    try {
      const response = await axios.get('http://localhost:5000/api/visitors/department-stats', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      console.log('Department stats:', response.data.stats);
      setDepartmentStats(response.data.stats);
    } catch (error) {
      showSnackbar('Error fetching department statistics', 'error');
    }
  };

  const fetchDailyReport = async () => {
    try {
      const response = await axios.get(
        `http://localhost:5000/api/admin/daily-report?date=${selectedDate}`,
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      setDailyReport(response.data.report);
    } catch (error) {
      showSnackbar('Error fetching daily report', 'error');
    }
  };

  const fetchMonthlyReport = async (month = selectedMonth) => {
    try {
      const [year, monthNum] = month.split('-');
      const response = await axios.get(
        `http://localhost:5000/api/admin/monthly-report?month=${monthNum}&year=${year}`,
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );

      // Get current date info
      const today = new Date();
      const currentYear = today.getFullYear();
      const currentMonth = today.getMonth() + 1; // JavaScript months are 0-based
      const currentDay = today.getDate();
      
      // Calculate total for the month up to current day
      const totals = {
        total_visitors: 0,
        total_checkins: 0,
        total_checkouts: 0
      };

      response.data.report.forEach(item => {
        const itemDate = new Date(item.date);
        // Only count if the date is not in the future
        if (itemDate <= today) {
          totals.total_visitors += parseInt(item.total_visitors);
          totals.total_checkins += parseInt(item.total_checkins);
          totals.total_checkouts += parseInt(item.total_checkouts);
        }
      });

      // Create single data point with totals and current day count
      const processedData = [{
        date: currentDay,
        ...totals,
        label: `${currentDay} Days`
      }];
      
      setMonthlyReport(processedData);
    } catch (error) {
      showSnackbar('Error fetching monthly report', 'error');
    }
  };

  const handleSearch = async () => {
    if (!searchName && !searchEmail) {
      showSnackbar('Please enter a name or email to search', 'warning');
      return;
    }
    try {
      const response = await axios.get(
        `http://localhost:5000/api/visitors/search-visitor?name=${searchName}&email=${searchEmail}`,
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      setSearchResults(response.data.visitors);
      if (response.data.visitors.length === 0) {
        showSnackbar('No visitors found', 'info');
      }
    } catch (error) {
      showSnackbar('Error searching visitor', 'error');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    navigate('/admin/login');
  };

  const showSnackbar = (message, severity) => {
    setSnackbar({ open: true, message, severity });
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Header with Logout */}
      <Box sx={{ mb: 4 }}>
        <Stack 
          direction="row" 
          justifyContent="space-between" 
          alignItems="center" 
          sx={{ mb: 3 }}
        >
          <Typography variant="h4">
            Admin Dashboard
          </Typography>
          <Stack direction="row" spacing={2}>
            <Button
              variant="contained"
              color="primary"
              startIcon={<HomeIcon />}
              onClick={() => navigate('/')}
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
        </Stack>


        {/* Statistics Cards */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6">Total Visitors</Typography>
              <Typography variant="h4">{statistics?.total_visitors || 0}</Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6">Current Visitors</Typography>
              <Typography variant="h4">{statistics?.current_visitors || 0}</Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6">Pending</Typography>
              <Typography variant="h4">{statistics?.pending_visitors || 0}</Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6">Completed Visits</Typography>
              <Typography variant="h4">{statistics?.completed_visits || 0}</Typography>
            </Paper>
          </Grid>
        </Grid>

        {/* Department Statistics Card */}
        <Paper sx={{ p: 2, mb: 3 }}>
          <Typography variant="h6" gutterBottom>Department Visit Statistics</Typography>
          
          {/* Table */}
          <TableContainer sx={{ mb: 3 }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Department</TableCell>
                  <TableCell align="right">Total Visits</TableCell>
                  <TableCell align="right">Percentage</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {departmentStats.map((stat) => (
                  <TableRow key={stat.department}>
                    <TableCell>{stat.department}</TableCell>
                    <TableCell align="right">{stat.visit_count}</TableCell>
                    <TableCell align="right">{stat.percentage}%</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Pie Chart */}
          <Box sx={{ height: 400 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={departmentStats}
                  dataKey="visit_count"
                  nameKey="department"
                  cx="50%"
                  cy="50%"
                  outerRadius={150}
                  label={(entry) => `${entry.department} (${entry.percentage}%)`}
                >
                  {departmentStats.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </Box>
        </Paper>

        {/* Top 5 Visitors Card */}
        <Paper sx={{ p: 2, mb: 3 }}>
          <Typography variant="h6" gutterBottom>Top 5 Most Frequent Visitors</Typography>
          
          {/* Table */}
          <TableContainer sx={{ mb: 3 }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell align="right">Visit Count</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {topVisitors.map((visitor, index) => (
                  <TableRow key={index}>
                    <TableCell>{visitor.name}</TableCell>
                    <TableCell>{visitor.email}</TableCell>
                    <TableCell align="right">{visitor.visit_count}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Bar Chart */}
          <Box sx={{ height: 400 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topVisitors}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="visit_count" name="Visit Count" fill="#8884d8">
                  {topVisitors.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Box>
        </Paper>

        {/* Visitor Search Card */}
        <Paper sx={{ p: 2, mb: 3 }}>
          <Typography variant="h6" gutterBottom>Search Visitor History</Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 2 }}>
            <TextField
              fullWidth
              label="Name"
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
              size="small"
            />
            <TextField
              fullWidth
              label="Email"
              value={searchEmail}
              onChange={(e) => setSearchEmail(e.target.value)}
              size="small"
            />
            <Button 
              variant="contained" 
              onClick={handleSearch}
              startIcon={<SearchIcon />}
              sx={{ minWidth: 120 }}
            >
              Search
            </Button>
          </Stack>

          {searchResults && searchResults.length > 0 && (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell align="right">Total Visits</TableCell>
                    <TableCell>Departments Visited</TableCell>
                    <TableCell>Visit Dates</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {searchResults.map((visitor, index) => (
                    <TableRow key={index}>
                      <TableCell>{visitor.name}</TableCell>
                      <TableCell>{visitor.email}</TableCell>
                      <TableCell align="right">{visitor.total_visits}</TableCell>
                      <TableCell>{visitor.departments_visited}</TableCell>
                      <TableCell>
                        {visitor.visit_dates.split(',').map((date, i) => (
                          <div key={i}>{date}</div>
                        ))}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
          {searchResults && searchResults.length === 0 && (
            <Alert severity="info" sx={{ mt: 2 }}>No visitors found matching the search criteria</Alert>
          )}
        </Paper>

        {/* Daily Report */}
        <Paper sx={{ p: 2, mb: 3 }}>
          <Typography variant="h5" gutterBottom>Daily Report</Typography>
          {dailyReport && (
            <Box sx={{ mt: 2 }}>
              <Typography>Check-ins: {dailyReport.total_checkins}</Typography>
              <Typography>Check-outs: {dailyReport.total_checkouts}</Typography>
            </Box>
          )}
        </Paper>

        {/* Monthly Report */}
        <Paper sx={{ p: 2, mb: 3 }}>
          <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
            <Typography variant="h5">Monthly Report</Typography>
            <TextField
              type="month"
              value={selectedMonth}
              onChange={(e) => {
                setSelectedMonth(e.target.value);
                fetchMonthlyReport(e.target.value);
              }}
              size="small"
              sx={{ minWidth: 200 }}
            />
          </Stack>
          
          {monthlyReport.length > 0 && (
            <Box>
              <Typography variant="h6" gutterBottom sx={{ mt: 2, color: 'text.secondary' }}>
                Monthly Statistics (Past {monthlyReport[0].date} Days)
              </Typography>
              <Stack spacing={2} sx={{ mt: 2 }}>
                <Typography>
                  Total Visitors: {monthlyReport[0].total_visitors}
                </Typography>
                <Typography>
                  Total Check-ins: {monthlyReport[0].total_checkins}
                </Typography>
                <Typography>
                  Total Check-outs: {monthlyReport[0].total_checkouts}
                </Typography>
              </Stack>
            </Box>
          )}
        </Paper>
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

export default AdminDashboard;

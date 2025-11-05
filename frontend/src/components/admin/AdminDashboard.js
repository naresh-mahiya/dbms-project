import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
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
  TextField,
  Tabs,
  Tab,
  Card,
  CardContent,
  CircularProgress
} from '@mui/material';
import {
  Home as HomeIcon,
  Search as SearchIcon,
  People as PeopleIcon,
  Business as BusinessIcon,
  BarChart as BarChartIcon,
  Person as PersonIcon,
  Dashboard as DashboardIcon
} from '@mui/icons-material';
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
import DepartmentManagement from './DepartmentManagement';
import EmployeeManagement from './EmployeeManagement';

// Chart colors
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#FF6B9D', '#C23AED'];

function TabPanel(props) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`admin-tabpanel-${index}`}
      aria-labelledby={`admin-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

function a11yProps(index) {
  return {
    id: `admin-tab-${index}`,
    'aria-controls': `admin-tabpanel-${index}`,
  };
}

const AdminDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [tabValue, setTabValue] = useState(0);
  const [statistics, setStatistics] = useState(null);
  const [departmentStats, setDepartmentStats] = useState([]);
  const [topVisitors, setTopVisitors] = useState([]);
  const [popularDepartments, setPopularDepartments] = useState([]);
  const [popularEmployees, setPopularEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
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
    fetchAllData();
  }, [navigate]);

  useEffect(() => {
    if (tabValue === 3) {
      fetchVisitorStatistics();
    }
  }, [tabValue]);

  useEffect(() => {
    fetchDailyReport();
  }, [selectedDate]);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchStatistics(),
        fetchTopVisitors(),
        fetchDepartmentStats(),
        fetchDailyReport(),
        fetchMonthlyReport(selectedMonth)
      ]);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStatistics = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/admin/statistics', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setStatistics(response.data.statistics);
    } catch (error) {
      console.error('Error fetching statistics:', error);
      showSnackbar('Error fetching statistics', 'error');
    }
  };

  const fetchTopVisitors = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/visitors/top-visitors', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setTopVisitors(Array.isArray(response.data.visitors) ? response.data.visitors : []);
    } catch (error) {
      console.error('Error fetching top visitors:', error);
      showSnackbar('Error fetching top visitors', 'error');
      setTopVisitors([]);
    }
  };

  const fetchDepartmentStats = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/admin/department-stats', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setDepartmentStats(Array.isArray(response.data.stats) ? response.data.stats : []);
    } catch (error) {
      console.error('Error fetching department stats:', error);
      showSnackbar('Error fetching department statistics', 'error');
      setDepartmentStats([]);
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
      console.error('Error fetching daily report:', error);
      showSnackbar('Error fetching daily report', 'error');
    }
  };

  const fetchMonthlyReport = async (month = selectedMonth) => {
    try {
      const response = await axios.get(
        `http://localhost:5000/api/admin/visitor-stats/monthly?month=${month}`,
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );

      const arr = Array.isArray(response.data) ? response.data : [];
      const processedData = arr.map(item => ({
        date: new Date(item.date).getDate(),
        total_visits: parseInt(item.total_visits) || 0,
        total_checkins: parseInt(item.total_checkins) || 0,
        total_checkouts: parseInt(item.total_checkouts) || 0,
        label: `Day ${new Date(item.date).getDate()}`
      }));

      setMonthlyReport(processedData);
    } catch (error) {
      console.error('Error fetching monthly report:', error);
      showSnackbar('Error fetching monthly report', 'error');
      setMonthlyReport([]);
    }
  };

  const fetchVisitorStatistics = async () => {
    setLoading(true);
    try {
      const response = await axios.get('http://localhost:5000/api/admin/visitor-statistics', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      const d = response.data?.data || {};
      setPopularDepartments(Array.isArray(d.popularDepartments) ? d.popularDepartments : []);
      setPopularEmployees(Array.isArray(d.popularEmployees) ? d.popularEmployees : []);
    } catch (error) {
      console.error('Error fetching visitor statistics:', error);
      setPopularDepartments([]);
      setPopularEmployees([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      showSnackbar('Please enter a name or email to search', 'warning');
      return;
    }
    try {
      const response = await axios.get(
        `http://localhost:5000/api/visitors/search-visitor?name=${searchQuery}`,
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } },
      );
      setSearchResults(response.data.visitors || []);
      if (!response.data.visitors || response.data.visitors.length === 0) {
        showSnackbar('No visitors found', 'info');
      }
    } catch (error) {
      console.error('Error searching visitor:', error);
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

  const handleCloseSnackbar = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbar({ ...snackbar, open: false });
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    const tabNames = ['dashboard', 'departments', 'employees', 'reports'];
    navigate(`/admin/dashboard?tab=${tabNames[newValue]}`);
  };

  // Set initial tab based on URL
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');
    const tabIndex = ['dashboard', 'departments', 'employees', 'reports'].indexOf(tab || 'dashboard');
    if (tabIndex >= 0) {
      setTabValue(tabIndex);
    }
  }, [location.search]);

  // Calculate monthly totals
  const monthlyTotals = monthlyReport.reduce((acc, day) => ({
    total_visits: acc.total_visits + day.total_visits,
    total_checkins: acc.total_checkins + day.total_checkins,
    total_checkouts: acc.total_checkouts + day.total_checkouts
  }), { total_visits: 0, total_checkins: 0, total_checkouts: 0 });

  return (
    <React.Fragment>
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        {/* Header with Tabs and Logout */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
            <Typography variant="h4">Admin Dashboard</Typography>
            <Button
              variant="contained"
              color="secondary"
              onClick={handleLogout}
              startIcon={<PersonIcon />}
            >
              Logout
            </Button>
          </Stack>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            aria-label="admin dashboard tabs"
            variant="scrollable"
            scrollButtons="auto"
          >
            <Tab icon={<DashboardIcon />} label="Dashboard" {...a11yProps(0)} />
            <Tab icon={<BusinessIcon />} label="Departments" {...a11yProps(1)} />
            <Tab icon={<PeopleIcon />} label="Employees" {...a11yProps(2)} />
            <Tab icon={<BarChartIcon />} label="Reports" {...a11yProps(3)} />
          </Tabs>
        </Box>

        {/* Dashboard Tab */}
        <TabPanel value={tabValue} index={0}>
          {loading ? (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
              <CircularProgress />
            </Box>
          ) : (
            <>
              {/* Statistics Cards */}
              <Grid container spacing={3} sx={{ mb: 3 }}>
                <Grid item xs={12} md={6} lg={3}>
                  <Paper sx={{ p: 2 }}>
                    <Typography variant="h6" color="text.secondary">Total Visitors</Typography>
                    <Typography variant="h4">{statistics?.total_visitors || 0}</Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} md={6} lg={3}>
                  <Paper sx={{ p: 2 }}>
                    <Typography variant="h6" color="text.secondary">Current Visitors</Typography>
                    <Typography variant="h4">{statistics?.current_visitors || 0}</Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} md={6} lg={3}>
                  <Paper sx={{ p: 2 }}>
                    <Typography variant="h6" color="text.secondary">Pending</Typography>
                    <Typography variant="h4">{statistics?.pending_visitors || 0}</Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} md={6} lg={3}>
                  <Paper sx={{ p: 2 }}>
                    <Typography variant="h6" color="text.secondary">Completed Visits</Typography>
                    <Typography variant="h4">{statistics?.completed_visits || 0}</Typography>
                  </Paper>
                </Grid>
              </Grid>

              {/* Department Statistics */}
              <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" gutterBottom>Department Visit Statistics</Typography>
                
                {departmentStats.length === 0 ? (
                  <Alert severity="info" sx={{ mt: 2 }}>No department statistics available</Alert>
                ) : (
                  <>
                    {/* Table */}
                    <TableContainer sx={{ mb: 3 }}>
                      <Table>
                        <TableHead>
                          <TableRow>
                            <TableCell><strong>Department</strong></TableCell>
                            <TableCell align="right"><strong>Total Visits</strong></TableCell>
                            <TableCell align="right"><strong>Percentage</strong></TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {departmentStats.map((stat, idx) => (
                            <TableRow key={stat.id || idx}>
                              <TableCell>{stat.department || stat.department_name || 'Unknown'}</TableCell>
                              <TableCell align="right">{stat.visit_count || 0}</TableCell>
                              <TableCell align="right">{stat.percentage || 0}%</TableCell>
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
                            outerRadius={120}
                            label={(entry) => `${entry.department}: ${entry.percentage}%`}
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
                  </>
                )}
              </Paper>

              {/* Top 5 Visitors */}
              <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" gutterBottom>Top 5 Most Frequent Visitors</Typography>
                
                {topVisitors.length === 0 ? (
                  <Alert severity="info" sx={{ mt: 2 }}>No visitor data available</Alert>
                ) : (
                  <>
                    {/* Table */}
                    <TableContainer sx={{ mb: 3 }}>
                      <Table>
                        <TableHead>
                          <TableRow>
                            <TableCell><strong>Name</strong></TableCell>
                            <TableCell><strong>Email</strong></TableCell>
                            <TableCell align="right"><strong>Visit Count</strong></TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {topVisitors.map((visitor, index) => (
                            <TableRow key={visitor.name + index}>
                              <TableCell>{visitor.name}</TableCell>
                              <TableCell>{visitor.email || '-'}</TableCell>
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
                  </>
                )}
              </Paper>

              {/* Visitor Search */}
              <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" gutterBottom>Search Visitor History</Typography>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 2 }}>
                  <TextField
                    fullWidth
                    label="Name"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    size="small"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && searchQuery.trim()) {
                        handleSearch();
                      }
                    }}
                  />
                  <Button 
                    variant="contained" 
                    onClick={handleSearch}
                    startIcon={<SearchIcon />}
                    sx={{ minWidth: 120 }}
                    disabled={!searchQuery.trim()}
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
                            <TableCell>{visitor.email || '-'}</TableCell>
                            <TableCell align="right">{visitor.total_visits}</TableCell>
                            <TableCell>{visitor.departments_visited}</TableCell>
                            <TableCell>
                              {visitor.visit_dates && visitor.visit_dates.split(',').map((date, i) => (
                                <div key={i}>{date}</div>
                              ))}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </Paper>

              {/* Daily Report */}
              <Paper sx={{ p: 3, mb: 3 }}>
                <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
                  <Typography variant="h6">Daily Report</Typography>
                  <TextField
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    size="small"
                    sx={{ minWidth: 200 }}
                  />
                </Stack>
                {dailyReport ? (
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={4}>
                      <Box sx={{ p: 2, bgcolor: 'primary.light', borderRadius: 1 }}>
                        <Typography variant="body2" color="primary.contrastText">Total Visits</Typography>
                        <Typography variant="h5" color="primary.contrastText">{dailyReport.total_visits || 0}</Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <Box sx={{ p: 2, bgcolor: 'success.light', borderRadius: 1 }}>
                        <Typography variant="body2" color="success.contrastText">Check-ins</Typography>
                        <Typography variant="h5" color="success.contrastText">{dailyReport.total_checkins || 0}</Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <Box sx={{ p: 2, bgcolor: 'secondary.light', borderRadius: 1 }}>
                        <Typography variant="body2" color="secondary.contrastText">Check-outs</Typography>
                        <Typography variant="h5" color="secondary.contrastText">{dailyReport.total_checkouts || 0}</Typography>
                      </Box>
                    </Grid>
                  </Grid>
                ) : (
                  <Alert severity="info">No data available for selected date</Alert>
                )}
              </Paper>

              {/* Monthly Report */}
              <Paper sx={{ p: 3, mb: 3 }}>
                <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
                  <Typography variant="h6">Monthly Report</Typography>
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
                
                {monthlyReport.length > 0 ? (
                  <>
                    {/* Summary Stats */}
                    <Grid container spacing={2} sx={{ mb: 3 }}>
                      <Grid item xs={12} sm={4}>
                        <Box sx={{ p: 2, bgcolor: 'info.light', borderRadius: 1 }}>
                          <Typography variant="body2" color="info.contrastText">Total Visits</Typography>
                          <Typography variant="h5" color="info.contrastText">{monthlyTotals.total_visits}</Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <Box sx={{ p: 2, bgcolor: 'success.light', borderRadius: 1 }}>
                          <Typography variant="body2" color="success.contrastText">Total Check-ins</Typography>
                          <Typography variant="h5" color="success.contrastText">{monthlyTotals.total_checkins}</Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <Box sx={{ p: 2, bgcolor: 'warning.light', borderRadius: 1 }}>
                          <Typography variant="body2" color="warning.contrastText">Total Check-outs</Typography>
                          <Typography variant="h5" color="warning.contrastText">{monthlyTotals.total_checkouts}</Typography>
                        </Box>
                      </Grid>
                    </Grid>

                    {/* Line Chart */}
                    <Box sx={{ height: 400 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={monthlyReport}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" label={{ value: 'Day of Month', position: 'insideBottom', offset: -5 }} />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Line type="monotone" dataKey="total_visits" name="Total Visits" stroke="#8884d8" strokeWidth={2} />
                          <Line type="monotone" dataKey="total_checkins" name="Check-ins" stroke="#82ca9d" strokeWidth={2} />
                          <Line type="monotone" dataKey="total_checkouts" name="Check-outs" stroke="#ffc658" strokeWidth={2} />
                        </LineChart>
                      </ResponsiveContainer>
                    </Box>
                  </>
                ) : (
                  <Alert severity="info">No data available for selected month</Alert>
                )}
              </Paper>
            </>
          )}
        </TabPanel>

        {/* Departments Tab */}
        <TabPanel value={tabValue} index={1}>
          <DepartmentManagement />
        </TabPanel>

        {/* Employees Tab */}
        <TabPanel value={tabValue} index={2}>
          <EmployeeManagement />
        </TabPanel>

        {/* Reports Tab */}
        <TabPanel value={tabValue} index={3}>
          {loading ? (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
              <CircularProgress />
            </Box>
          ) : (
            <>
              <Typography variant="h5" gutterBottom sx={{ mb: 3 }}>Reports & Analytics</Typography>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Card sx={{ height: '100%' }}>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>Department Visit Distribution</Typography>
                      {popularDepartments.length > 0 ? (
                        <ResponsiveContainer width="100%" height={400}>
                          <PieChart>
                            <Pie
                              data={popularDepartments}
                              dataKey="visit_count"
                              nameKey="department_name"
                              cx="50%"
                              cy="50%"
                              outerRadius={100}
                              fill="#8884d8"
                              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                            >
                              {popularDepartments.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip />
                            <Legend />
                          </PieChart>
                        </ResponsiveContainer>
                      ) : (
                        <Alert severity="info">No department data available</Alert>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Card sx={{ height: '100%' }}>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>Top Performing Employees</Typography>
                      {popularEmployees.length > 0 ? (
                        <ResponsiveContainer width="100%" height={400}>
                          <BarChart
                            data={popularEmployees}
                            layout="vertical"
                            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis type="number" />
                            <YAxis dataKey="employee_name" type="category" width={150} />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="visit_count" name="Total Visits" fill="#82ca9d" />
                          </BarChart>
                        </ResponsiveContainer>
                      ) : (
                        <Alert severity="info">No employee data available</Alert>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </>
          )}
        </TabPanel>
        
        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={handleCloseSnackbar}
          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        >
          <Alert onClose={handleCloseSnackbar} severity={snackbar.severity}>
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Container>
    </React.Fragment>
  );
};

export default AdminDashboard;
import React, { useState, useMemo, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  ToggleButton,
  ToggleButtonGroup,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  useTheme,
  useMediaQuery,
  CircularProgress,
  Alert
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  CalendarMonth,
  AttachMoney,
  Category,
  Payment
} from '@mui/icons-material';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title, PointElement, LineElement } from 'chart.js';
import { Pie, Bar, Line } from 'react-chartjs-2';
import { createExpenditureData, generateCategoryColors } from '../data/expenditureData';
import { Expense, ViewMode, MonthlySummary, YearlySummary, ExpenditureData } from '../types';

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title, PointElement, LineElement);

const ExpenditureDashboard: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  // State management
  const [viewMode, setViewMode] = useState<ViewMode>('monthly');
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<string>('');
  const [expenditureData, setExpenditureData] = useState<ExpenditureData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Load expenditure data from API
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await createExpenditureData();
        setExpenditureData(data);
      } catch (err) {
        setError('Failed to load expenditure data. Please try again later.');
        console.error('Error loading expenditure data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Use all expenses directly (no filtering)
  const allExpenses = expenditureData?.expenses || [];
  const categoryColors = expenditureData ? generateCategoryColors(expenditureData.categories) : {};

  // Calculate summary statistics based on current view and selections
  const summaryStats = useMemo(() => {
    let expensesToUse = allExpenses;
    
    // Filter by selected month if in monthly view
    if (viewMode === 'monthly' && selectedMonth) {
      expensesToUse = allExpenses.filter(expense => {
        const month = new Date(expense.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
        return month === selectedMonth;
      });
    }
    
    // Filter by selected year if in yearly view
    if (viewMode === 'yearly' && selectedYear) {
      expensesToUse = allExpenses.filter(expense => {
        const year = new Date(expense.date).getFullYear().toString();
        return year === selectedYear;
      });
    }
    
    const total = expensesToUse.reduce((sum, exp) => sum + exp.amount, 0);
    const average = expensesToUse.length > 0 ? total / expensesToUse.length : 0;
    const categoryTotals = expensesToUse.reduce((acc, exp) => {
      acc[exp.category] = (acc[exp.category] || 0) + exp.amount;
      return acc;
    }, {} as { [key: string]: number });
    
    return { total, average, categoryTotals, count: expensesToUse.length };
  }, [allExpenses, viewMode, selectedMonth, selectedYear]);

  // Handle view mode change
  const handleViewModeChange = (event: React.MouseEvent<HTMLElement>, newViewMode: ViewMode | null) => {
    if (newViewMode !== null) {
      setViewMode(newViewMode);
      // Clear selections when switching view modes
      setSelectedMonth('');
      setSelectedYear('');
    }
  };


  // Summary Statistics Component
  const SummaryStats = () => (
    <Grid container spacing={3} sx={{ mb: 3 }}>
      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Box>
                <Typography color="textSecondary" gutterBottom variant="body2">
                  Total Spent
                </Typography>
                <Typography variant="h4" color="primary">
                  ₹{summaryStats.total.toFixed(2)}
                </Typography>
              </Box>
              <AttachMoney sx={{ fontSize: 40, color: 'primary.main' }} />
            </Box>
          </CardContent>
        </Card>
      </Grid>
      
      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Box>
                <Typography color="textSecondary" gutterBottom variant="body2">
                  Average Expense
                </Typography>
                <Typography variant="h4" color="secondary">
                  ₹{summaryStats.average.toFixed(2)}
                </Typography>
              </Box>
              <TrendingUp sx={{ fontSize: 40, color: 'secondary.main' }} />
            </Box>
          </CardContent>
        </Card>
      </Grid>
      
      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Box>
                <Typography color="textSecondary" gutterBottom variant="body2">
                  Total Expenses
                </Typography>
                <Typography variant="h4" color="success.main">
                  {summaryStats.count}
                </Typography>
              </Box>
              <Category sx={{ fontSize: 40, color: 'success.main' }} />
            </Box>
          </CardContent>
        </Card>
      </Grid>
      
      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Box>
                <Typography color="textSecondary" gutterBottom variant="body2">
                  Categories Used
                </Typography>
                <Typography variant="h4" color="info.main">
                  {Object.keys(summaryStats.categoryTotals).length}
                </Typography>
              </Box>
              <Payment sx={{ fontSize: 40, color: 'info.main' }} />
            </Box>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  // Category Breakdown Chart
  const CategoryChart = () => {
    const chartData = {
      labels: Object.keys(summaryStats.categoryTotals),
      datasets: [
        {
          data: Object.values(summaryStats.categoryTotals),
          backgroundColor: Object.keys(summaryStats.categoryTotals).map(cat => categoryColors[cat] || '#607D8B'),
          borderWidth: 2,
          borderColor: '#fff'
        }
      ]
    };

    return (
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Spending by Category
          </Typography>
          <Box height={300}>
            <Pie data={chartData} options={{ responsive: true, maintainAspectRatio: false }} />
          </Box>
        </CardContent>
      </Card>
    );
  };

  // Monthly View Component
  const MonthlyView = () => {
    const monthlyData = expenditureData?.monthlySummaries.filter(month => {
      if (selectedMonth) return month.month === selectedMonth;
      return true;
    }) || [];


    const chartData = {
      labels: monthlyData.map(m => m.month),
      datasets: [
        {
          label: 'Total Spending',
          data: monthlyData.map(m => m.total),
          borderColor: 'rgba(25, 118, 210, 1)',
          backgroundColor: 'rgba(25, 118, 210, 0.1)',
          borderWidth: 3,
          fill: true,
          tension: 0.4,
          pointBackgroundColor: 'rgba(25, 118, 210, 1)',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          pointRadius: 6,
          pointHoverRadius: 8
        }
      ]
    };

    // Group expenses by month, filtering by selected month if specified
    const expensesByMonth = allExpenses.reduce((acc, expense) => {
      const month = new Date(expense.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
      
      // Filter by selected month if specified
      if (selectedMonth && month !== selectedMonth) {
        return acc;
      }
      
      if (!acc[month]) {
        acc[month] = [];
      }
      acc[month].push(expense);
      return acc;
    }, {} as { [key: string]: Expense[] });

    return (
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Monthly Spending Trend
              </Typography>
              <Box height={300}>
                <Line data={chartData} options={{ 
                  responsive: true, 
                  maintainAspectRatio: false,
                  scales: {
                    y: {
                      beginAtZero: true,
                      ticks: {
                        callback: function(value) {
                          return '₹' + value;
                        }
                      }
                    }
                  },
                  plugins: {
                    tooltip: {
                      callbacks: {
                        label: function(context) {
                          return 'Total Spending: ₹' + context.parsed.y.toFixed(2);
                        }
                      }
                    }
                  }
                }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Monthly Breakdown
              </Typography>
              <List>
                {monthlyData.map((month, index) => (
                  <React.Fragment key={month.month}>
                    <ListItem>
                      <ListItemIcon>
                        <CalendarMonth color="primary" />
                      </ListItemIcon>
                      <ListItemText
                        primary={month.month}
                        secondary={`₹${month.total.toFixed(2)} • ${month.expenseCount} expenses • Avg: ₹${month.averageExpense.toFixed(2)}`}
                      />
                    </ListItem>
                    {index < monthlyData.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Monthly Transactions */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Monthly Transactions
              </Typography>
              {Object.entries(expensesByMonth)
                .sort(([a], [b]) => new Date(b).getTime() - new Date(a).getTime())
                .map(([month, expenses]) => (
                  <Box key={month} sx={{ mb: 3 }}>
                    <Typography variant="h6" color="primary" gutterBottom>
                      {month} ({expenses.length} transactions)
                    </Typography>
                    <List>
                      {expenses
                        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                        .map((expense, index) => (
                          <React.Fragment key={expense.id || `${month}-${index}`}>
                            <ListItem>
                              <ListItemIcon>
                                <Box
                                  sx={{
                                    width: 12,
                                    height: 12,
                                    borderRadius: '50%',
                                    backgroundColor: categoryColors[expense.category] || '#607D8B'
                                  }}
                                />
                              </ListItemIcon>
                              <ListItemText
                                primary={
                                  <Box display="flex" justifyContent="space-between" alignItems="center">
                                    <Typography variant="body1">{expense.description}</Typography>
                                    <Typography variant="h6" color="primary">
                                      ₹{expense.amount.toFixed(2)}
                                    </Typography>
                                  </Box>
                                }
                                secondary={
                                  <Box display="flex" justifyContent="space-between" alignItems="center">
                                    <Box>
                                      <Chip
                                        label={expense.category}
                                        size="small"
                                        sx={{ backgroundColor: categoryColors[expense.category] || '#607D8B', color: 'white', mr: 1 }}
                                      />
                                      <Chip label={expense.paymentMethod} size="small" variant="outlined" />
                                    </Box>
                                    <Typography variant="body2" color="textSecondary">
                                      {new Date(expense.date).toLocaleDateString()}
                                    </Typography>
                                  </Box>
                                }
                              />
                            </ListItem>
                            {index < expenses.length - 1 && <Divider />}
                          </React.Fragment>
                        ))}
                    </List>
                    {Object.keys(expensesByMonth).indexOf(month) < Object.keys(expensesByMonth).length - 1 && (
                      <Divider sx={{ mt: 2, mb: 2 }} />
                    )}
                  </Box>
                ))}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    );
  };

  // Yearly View Component
  const YearlyView = () => {
    const yearlyData = expenditureData?.yearlySummaries.filter(year => {
      if (selectedYear) return year.year === selectedYear;
      return true;
    }) || [];

    // Group all expenses by year and month
    const expensesByYearMonth = allExpenses.reduce((acc, expense) => {
      const year = new Date(expense.date).getFullYear().toString();
      const month = new Date(expense.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
      
      // Filter by selected year if specified
      if (selectedYear && year !== selectedYear) {
        return acc;
      }
      
      if (!acc[year]) {
        acc[year] = {};
      }
      if (!acc[year][month]) {
        acc[year][month] = [];
      }
      acc[year][month].push(expense);
      return acc;
    }, {} as { [year: string]: { [month: string]: Expense[] } });

    return (
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Yearly Summary
              </Typography>
              <List>
                {yearlyData.map((year, index) => (
                  <React.Fragment key={year.year}>
                    <ListItem>
                      <ListItemIcon>
                        <TrendingUp color="primary" />
                      </ListItemIcon>
                      <ListItemText
                        primary={`${year.year} - ₹${year.total.toFixed(2)}`}
                        secondary={`${year.expenseCount} expenses • Average: ₹${year.averageExpense.toFixed(2)}`}
                      />
                    </ListItem>
                    {index < yearlyData.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Yearly Transactions by Month */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                All Transactions by Year and Month
              </Typography>
              {Object.entries(expensesByYearMonth)
                .sort(([a], [b]) => parseInt(b) - parseInt(a))
                .map(([year, months]) => (
                  <Box key={year} sx={{ mb: 4 }}>
                    <Typography variant="h5" color="primary" gutterBottom sx={{ borderBottom: '2px solid', borderColor: 'primary.main', pb: 1 }}>
                      {year} ({Object.values(months).flat().length} total transactions)
                    </Typography>
                    
                    {Object.entries(months)
                      .sort(([a], [b]) => new Date(b).getTime() - new Date(a).getTime())
                      .map(([month, expenses]) => (
                        <Box key={`${year}-${month}`} sx={{ mb: 3, ml: 2 }}>
                          <Typography variant="h6" color="secondary" gutterBottom>
                            {month} ({expenses.length} transactions)
                          </Typography>
                          <List>
                            {expenses
                              .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                              .map((expense, index) => (
                                <React.Fragment key={expense.id || `${year}-${month}-${index}`}>
                                  <ListItem>
                                    <ListItemIcon>
                                      <Box
                                        sx={{
                                          width: 12,
                                          height: 12,
                                          borderRadius: '50%',
                                          backgroundColor: categoryColors[expense.category] || '#607D8B'
                                        }}
                                      />
                                    </ListItemIcon>
                                    <ListItemText
                                      primary={
                                        <Box display="flex" justifyContent="space-between" alignItems="center">
                                          <Typography variant="body1">{expense.description}</Typography>
                                          <Typography variant="h6" color="primary">
                                            ₹{expense.amount.toFixed(2)}
                                          </Typography>
                                        </Box>
                                      }
                                      secondary={
                                        <Box display="flex" justifyContent="space-between" alignItems="center">
                                          <Box>
                                            <Chip
                                              label={expense.category}
                                              size="small"
                                              sx={{ backgroundColor: categoryColors[expense.category] || '#607D8B', color: 'white', mr: 1 }}
                                            />
                                            <Chip label={expense.paymentMethod} size="small" variant="outlined" />
                                          </Box>
                                          <Typography variant="body2" color="textSecondary">
                                            {new Date(expense.date).toLocaleDateString()}
                                          </Typography>
                                        </Box>
                                      }
                                    />
                                  </ListItem>
                                  {index < expenses.length - 1 && <Divider />}
                                </React.Fragment>
                              ))}
                          </List>
                          {Object.keys(months).indexOf(month) < Object.keys(months).length - 1 && (
                            <Divider sx={{ mt: 2, mb: 2 }} />
                          )}
                        </Box>
                      ))}
                    
                    {Object.keys(expensesByYearMonth).indexOf(year) < Object.keys(expensesByYearMonth).length - 1 && (
                      <Divider sx={{ mt: 3, mb: 3 }} />
                    )}
                  </Box>
                ))}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    );
  };


  // Show loading state
  if (loading) {
    return (
      <Box sx={{ p: 3, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <Box textAlign="center">
          <CircularProgress size={60} />
          <Typography variant="h6" sx={{ mt: 2 }}>
            Loading expenditure data...
          </Typography>
        </Box>
      </Box>
    );
  }

  // Show error state
  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
        <Button 
          variant="contained" 
          onClick={() => window.location.reload()}
        >
          Retry
        </Button>
      </Box>
    );
  }

  // Show empty state if no data
  if (!expenditureData || expenditureData.expenses.length === 0) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          Expenditure Dashboard
        </Typography>
        <Alert severity="info">
          No expenditure data available.
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Expenditure Dashboard
      </Typography>
      
      {/* View Mode Toggle */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={2}>
            <Typography variant="h6">View Mode</Typography>
            <ToggleButtonGroup
              value={viewMode}
              exclusive
              onChange={handleViewModeChange}
              aria-label="view mode"
              size={isMobile ? "small" : "medium"}
            >
              <ToggleButton value="monthly" aria-label="monthly view">
                <CalendarMonth sx={{ mr: 1 }} />
                Monthly
              </ToggleButton>
              <ToggleButton value="yearly" aria-label="yearly view">
                <TrendingUp sx={{ mr: 1 }} />
                Yearly
              </ToggleButton>
            </ToggleButtonGroup>
          </Box>
          
          {/* Month/Year Selectors */}
          {(viewMode === 'monthly' || viewMode === 'yearly') && (
            <Box display="flex" gap={2} mt={2} flexWrap="wrap">
              {viewMode === 'monthly' && (
                <FormControl size="small" sx={{ minWidth: 150 }}>
                  <InputLabel>Select Month</InputLabel>
                  <Select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    label="Select Month"
                  >
                    <MenuItem value="">All Months</MenuItem>
                    {expenditureData?.monthlySummaries
                      .sort((a, b) => {
                        // Parse month names to dates for proper sorting
                        const dateA = new Date(a.month + ' 1, 2000');
                        const dateB = new Date(b.month + ' 1, 2000');
                        return dateB.getTime() - dateA.getTime(); // Descending order
                      })
                      .map((month) => (
                        <MenuItem key={month.month} value={month.month}>
                          {month.month}
                        </MenuItem>
                      ))}
                  </Select>
                </FormControl>
              )}
              
              {viewMode === 'yearly' && (
                <FormControl size="small" sx={{ minWidth: 150 }}>
                  <InputLabel>Select Year</InputLabel>
                  <Select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(e.target.value)}
                    label="Select Year"
                  >
                    <MenuItem value="">All Years</MenuItem>
                    {expenditureData?.yearlySummaries
                      .sort((a, b) => parseInt(b.year) - parseInt(a.year)) // Descending order
                      .map((year) => (
                        <MenuItem key={year.year} value={year.year}>
                          {year.year}
                        </MenuItem>
                      ))}
                  </Select>
                </FormControl>
              )}
              
              <Button 
                variant="outlined" 
                size="small" 
                onClick={() => {
                  setSelectedMonth('');
                  setSelectedYear('');
                }}
              >
                Clear Selection
              </Button>
            </Box>
          )}
        </CardContent>
      </Card>


      {/* Summary Statistics */}
      <SummaryStats />

      {/* Category Chart */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12}>
          <CategoryChart />
        </Grid>
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Category Breakdown
              </Typography>
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: {
                    xs: '1fr',
                    sm: 'repeat(2, 1fr)',
                    md: 'repeat(3, 1fr)'
                  },
                  gap: 1,
                  maxHeight: { xs: '400px', sm: 'none' },
                  overflowY: { xs: 'auto', sm: 'visible' },
                  pr: { xs: 1, sm: 0 }
                }}
              >
                {Object.entries(summaryStats.categoryTotals)
                  .sort(([,a], [,b]) => b - a)
                  .map(([category, amount]) => (
                    <Box
                      key={category}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        p: 1,
                        borderRadius: 1,
                        '&:hover': {
                          backgroundColor: 'action.hover'
                        }
                      }}
                    >
                      <Box
                        sx={{
                          width: 12,
                          height: 12,
                          borderRadius: '50%',
                          backgroundColor: categoryColors[category] || '#607D8B',
                          mr: 1.5,
                          flexShrink: 0
                        }}
                      />
                      <Box sx={{ minWidth: 0, flex: 1 }}>
                        <Typography variant="body2" noWrap>
                          {category}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          ₹{amount.toFixed(2)} (${((amount / summaryStats.total) * 100).toFixed(1)}%)
                        </Typography>
                      </Box>
                    </Box>
                  ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Main Content based on View Mode */}
      {viewMode === 'monthly' && <MonthlyView />}
      {viewMode === 'yearly' && <YearlyView />}
    </Box>
  );
};

export default ExpenditureDashboard;

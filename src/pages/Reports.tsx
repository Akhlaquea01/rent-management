import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Button,
  Divider,
} from '@mui/material';
import { Download as DownloadIcon, Print as PrintIcon } from '@mui/icons-material';
import { useRentStore } from '../store/rentStore';

const Reports: React.FC = () => {
  const { data } = useRentStore();
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));

  // Get available years from data
  const availableYears = Object.keys(data.years).map(Number).sort((a, b) => b - a);

  // Get shops for selected year
  const selectedYearShops = data.years[selectedYear.toString()]?.shops || {};

  // Compute stats from new data structure
  const shopsArray = Object.entries(selectedYearShops).map(([shopNumber, shop]: [string, any]) => ({
    shopNumber,
    ...shop,
  }));

  const totalShops = shopsArray.length;
  const activeShops = shopsArray.filter((shop: any) => shop.tenant.status === 'Active').length;
  const inactiveShops = totalShops - activeShops;

  const totalAdvance = shopsArray.reduce((sum: number, shop: any) => sum + shop.advanceAmount, 0);

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const getMonthlyStats = () => {
    const monthName = new Date(selectedMonth + '-01').toLocaleDateString('en-US', { month: 'long' });
    let totalRent = 0;
    let totalCollected = 0;
    let overdueCount = 0;
    let partialCount = 0;

    shopsArray.forEach((shop: any) => {
      const monthlyData = shop.monthlyData || {};
      const monthData = monthlyData[monthName] || { rent: shop.rentAmount, paid: 0, status: 'Pending' };
      totalRent += monthData.rent || shop.rentAmount;
      totalCollected += monthData.paid || 0;
      if (monthData.status === 'Overdue') overdueCount++;
      if (monthData.status === 'Partial') partialCount++;
    });

    const totalPending = totalRent - totalCollected;

    return {
      totalRent,
      totalCollected,
      totalPending,
      overdueCount,
      partialCount,
      collectionRate: totalRent > 0 ? (totalCollected / totalRent) * 100 : 0,
    };
  };

  const getYearlyStats = () => {
    let totalRent = 0;
    let totalCollected = 0;

    shopsArray.forEach((shop: any) => {
      const monthlyData = shop.monthlyData || {};
      Object.values(monthlyData).forEach((month: any) => {
        totalRent += month.rent || shop.rentAmount;
        totalCollected += month.paid || 0;
      });
    });

    const totalPending = totalRent - totalCollected;

    return {
      totalRent,
      totalCollected,
      totalPending,
      collectionRate: totalRent > 0 ? (totalCollected / totalRent) * 100 : 0,
    };
  };

  const monthlyStats = getMonthlyStats();
  const yearlyStats = getYearlyStats();

  const handlePrint = () => {
    window.print();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Paid':
        return 'success';
      case 'Pending':
        return 'warning';
      case 'Partial':
        return 'info';
      case 'Overdue':
        return 'error';
      default:
        return 'default';
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Reports & Analytics</Typography>
        <Box>
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            sx={{ mr: 1 }}
          >
            Export Data
          </Button>
          <Button
            variant="outlined"
            startIcon={<PrintIcon />}
            onClick={handlePrint}
          >
            Print Report
          </Button>
        </Box>
      </Box>

      {/* Overview Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom variant="body2">
                Total Shops
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                {totalShops}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                {activeShops} Active, {inactiveShops} Inactive
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom variant="body2">
                Monthly Collection Rate
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                {monthlyStats.collectionRate.toFixed(1)}%
              </Typography>
              <Typography variant="body2" color="textSecondary">
                ₹{monthlyStats.totalCollected.toLocaleString()} / ₹{monthlyStats.totalRent.toLocaleString()}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom variant="body2">
                Yearly Collection Rate
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                {yearlyStats.collectionRate.toFixed(1)}%
              </Typography>
              <Typography variant="body2" color="textSecondary">
                ₹{yearlyStats.totalCollected.toLocaleString()} / ₹{yearlyStats.totalRent.toLocaleString()}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom variant="body2">
                Total Advance Balance
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'info.main' }}>
                ₹{totalAdvance.toLocaleString()}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Across all shops
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filters */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <FormControl fullWidth>
            <InputLabel>Select Year</InputLabel>
            <Select
              value={selectedYear}
              label="Select Year"
              onChange={(e) => setSelectedYear(Number(e.target.value))}
            >
              {availableYears.map((year) => (
                <MenuItem key={year} value={year}>
                  {year}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} md={6}>
          <FormControl fullWidth>
            <InputLabel>Select Month</InputLabel>
            <Select
              value={selectedMonth}
              label="Select Month"
              onChange={(e) => setSelectedMonth(e.target.value)}
            >
              {months.map((month, index) => {
                const monthValue = `${selectedYear}-${String(index + 1).padStart(2, '0')}`;
                return (
                  <MenuItem key={monthValue} value={monthValue}>
                    {month} {selectedYear}
                  </MenuItem>
                );
              })}
            </Select>
          </FormControl>
        </Grid>
      </Grid>

      {/* Detailed Reports */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Monthly Payment Status - {new Date(selectedMonth + '-01').toLocaleDateString('en-US', { month: 'long' })}
              </Typography>
              <TableContainer component={Paper}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Shop</TableCell>
                      <TableCell align="right">Rent</TableCell>
                      <TableCell align="right">Paid</TableCell>
                      <TableCell>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {shopsArray.map((shop: any) => {
                      const monthName = new Date(selectedMonth + '-01').toLocaleDateString('en-US', { month: 'long' });
                      const monthData = shop.monthlyData?.[monthName] || { rent: shop.rentAmount, paid: 0, status: 'Pending' };
                      const status = monthData.status;
                      const paidAmount = monthData.paid;

                      return (
                        <TableRow 
                          key={shop.shopNumber}
                          sx={{
                            backgroundColor: shop.tenant.status === 'Inactive' ? '#ffebee' : 'inherit',
                          }}
                        >
                          <TableCell>{shop.shopNumber}</TableCell>
                          <TableCell align="right">₹{shop.rentAmount.toLocaleString()}</TableCell>
                          <TableCell align="right">₹{paidAmount.toLocaleString()}</TableCell>
                          <TableCell>
                            <Chip
                              label={status}
                              color={getStatusColor(status) as any}
                              size="small"
                            />
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Payment Summary
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">
                    Monthly Collection
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                    ₹{monthlyStats.totalCollected.toLocaleString()}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">
                    Monthly Pending
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'warning.main' }}>
                    ₹{monthlyStats.totalPending.toLocaleString()}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">
                    Overdue Count
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'error.main' }}>
                    {monthlyStats.overdueCount}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">
                    Partial Payments
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'info.main' }}>
                    {monthlyStats.partialCount}
                  </Typography>
                </Grid>
              </Grid>

              <Divider sx={{ my: 2 }} />

              <Typography variant="h6" gutterBottom>
                Yearly Summary - {selectedYear}
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">
                    Total Collected
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                    ₹{yearlyStats.totalCollected.toLocaleString()}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">
                    Total Pending
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'warning.main' }}>
                    ₹{yearlyStats.totalPending.toLocaleString()}
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Printable Report */}
      <Box sx={{ display: 'none', '@media print': { display: 'block' } }}>
        <Paper sx={{ p: 3, m: 2 }}>
          <Typography variant="h4" gutterBottom align="center">
            Rent Management Report
          </Typography>
          <Typography variant="h6" gutterBottom align="center">
            {new Date(selectedMonth + '-01').toLocaleDateString('en-US', { month: 'long' })} - {selectedYear}
          </Typography>
          
          <Divider sx={{ my: 2 }} />
          
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={6}>
              <Typography variant="h6">Total Shops: {totalShops}</Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="h6">Active Shops: {activeShops}</Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="h6">Monthly Collection: ₹{monthlyStats.totalCollected.toLocaleString()}</Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="h6">Collection Rate: {monthlyStats.collectionRate.toFixed(1)}%</Typography>
            </Grid>
          </Grid>

          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Shop</TableCell>
                  <TableCell align="right">Rent</TableCell>
                  <TableCell align="right">Paid</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {shopsArray.map((shop: any) => {
                  const monthName = new Date(selectedMonth + '-01').toLocaleDateString('en-US', { month: 'long' });
                  const monthData = shop.monthlyData?.[monthName] || { rent: shop.rentAmount, paid: 0, status: 'Pending' };
                  const status = monthData.status;
                  const paidAmount = monthData.paid;

                  return (
                    <TableRow key={shop.shopNumber}>
                      <TableCell>{shop.shopNumber}</TableCell>
                      <TableCell align="right">₹{shop.rentAmount.toLocaleString()}</TableCell>
                      <TableCell align="right">₹{paidAmount.toLocaleString()}</TableCell>
                      <TableCell>{status}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </Box>
    </Box>
  );
};

export default Reports; 
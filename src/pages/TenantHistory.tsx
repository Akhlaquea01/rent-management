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
import { Print as PrintIcon } from '@mui/icons-material';
import { useRentStore } from '../store/rentStore';

const TenantHistory: React.FC = () => {
  const { data } = useRentStore();
  const [selectedShopNumber, setSelectedShopNumber] = useState('');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  // Get available years from data
  const availableYears = Object.keys(data.years).map(Number).sort((a, b) => b - a);

  // Get all shops from all years
  const allShops: Array<{ shopNumber: string; tenant: any; year: number }> = [];
  Object.entries(data.years).forEach(([year, yearData]: [string, any]) => {
    Object.entries(yearData.shops).forEach(([shopNumber, shop]: [string, any]) => {
      allShops.push({
        shopNumber,
        tenant: shop.tenant,
        year: Number(year),
      });
    });
  });

  // Get unique active shops
  const activeShops = allShops
    .filter(shop => shop.tenant.status === 'Active')
    .filter((shop, index, self) => 
      index === self.findIndex(s => s.shopNumber === shop.shopNumber)
    );

  // Compute yearly data for selected shop
  const yearlyData = selectedShopNumber && data.years[selectedYear.toString()]?.shops[selectedShopNumber] ? (() => {
    const shop = data.years[selectedYear.toString()].shops[selectedShopNumber];
    const monthlyData = shop.monthlyData || {};
    
    let totalRent = 0;
    let totalPaid = 0;
    let totalAdvanceUsed = 0;

    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];

    const monthlyDataArray = months.map(month => {
      const monthData = monthlyData[month] || { rent: shop.rentAmount, paid: 0, status: 'Pending', advanceUsed: 0 };
      totalRent += monthData.rent || shop.rentAmount;
      totalPaid += monthData.paid || 0;
      totalAdvanceUsed += monthData.advanceUsed || 0;
      
      return {
        month,
        rentAmount: monthData.rent || shop.rentAmount,
        paidAmount: monthData.paid || 0,
        advanceDeduction: monthData.advanceUsed || 0,
        status: monthData.status || 'Pending',
        paymentDate: (monthData as any).date || '-',
      };
    });

    // Calculate advance balance from transactions
    const transactions = data.advanceTransactions[selectedShopNumber] || [];
    const advanceBalance = transactions.reduce((acc: number, t: any) => 
      t.type === 'Deposit' ? acc + t.amount : acc - t.amount, 0);

    return {
      totalRent,
      totalPaid,
      totalPending: totalRent - totalPaid,
      advanceBalance,
      monthlyData: monthlyDataArray,
      status: shop.tenant.status,
    };
  })() : null;

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

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

  const handlePrint = () => {
    window.print();
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Shop History</Typography>
        {yearlyData && (
          <Button
            variant="outlined"
            startIcon={<PrintIcon />}
            onClick={handlePrint}
          >
            Print Summary
          </Button>
        )}
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Select Shop & Year
              </Typography>
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Choose Shop</InputLabel>
                <Select
                  value={selectedShopNumber}
                  label="Choose Shop"
                  onChange={(e) => setSelectedShopNumber(e.target.value)}
                >
                  {activeShops.map((shop) => (
                    <MenuItem key={shop.shopNumber} value={shop.shopNumber}>
                      {shop.tenant.name} - Shop {shop.shopNumber}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

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

              {yearlyData && (
                <Box sx={{ mt: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Summary
                  </Typography>
                  <Grid container spacing={1}>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="textSecondary">
                        Total Rent
                      </Typography>
                      <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                        ₹{yearlyData.totalRent.toLocaleString()}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="textSecondary">
                        Total Paid
                      </Typography>
                      <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                        ₹{yearlyData.totalPaid.toLocaleString()}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="textSecondary">
                        Pending
                      </Typography>
                      <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'warning.main' }}>
                        ₹{yearlyData.totalPending.toLocaleString()}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="textSecondary">
                        Advance Balance
                      </Typography>
                      <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                        ₹{yearlyData.advanceBalance.toLocaleString()}
                      </Typography>
                    </Grid>
                  </Grid>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Monthly Rent History - {selectedYear}
              </Typography>
              {yearlyData ? (
                <TableContainer component={Paper}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Month</TableCell>
                        <TableCell align="right">Rent Amount</TableCell>
                        <TableCell align="right">Paid Amount</TableCell>
                        <TableCell align="right">Advance Used</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Payment Date</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {yearlyData.monthlyData.map((monthData, index) => (
                        <TableRow 
                          key={monthData.month}
                          sx={{
                            backgroundColor: yearlyData.status === 'Inactive' ? '#ffebee' : 'inherit',
                          }}
                        >
                          <TableCell>{months[index]}</TableCell>
                          <TableCell align="right">
                            ₹{monthData.rentAmount.toLocaleString()}
                          </TableCell>
                          <TableCell align="right">
                            ₹{monthData.paidAmount.toLocaleString()}
                          </TableCell>
                          <TableCell align="right">
                            ₹{monthData.advanceDeduction.toLocaleString()}
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={monthData.status}
                              color={getStatusColor(monthData.status) as any}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            {monthData.paymentDate 
                              ? new Date(monthData.paymentDate).toLocaleDateString()
                              : '-'
                            }
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Typography color="textSecondary" align="center">
                  Select a shop and year to view history
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Printable Summary */}
      {yearlyData && (
        <Box sx={{ display: 'none', '@media print': { display: 'block' } }}>
          <Paper sx={{ p: 3, m: 2 }}>
            <Typography variant="h4" gutterBottom align="center">
              Rent Summary Report
            </Typography>
            <Typography variant="h6" gutterBottom align="center">
              {data.years[selectedYear.toString()]?.shops[selectedShopNumber]?.tenant.name} - Shop {selectedShopNumber}
            </Typography>
            <Typography variant="body1" gutterBottom align="center">
              Year: {selectedYear}
            </Typography>
            
            <Divider sx={{ my: 2 }} />
            
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={6}>
                <Typography variant="h6">Total Rent: ₹{yearlyData.totalRent.toLocaleString()}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="h6">Total Paid: ₹{yearlyData.totalPaid.toLocaleString()}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="h6">Pending: ₹{yearlyData.totalPending.toLocaleString()}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="h6">Advance Balance: ₹{yearlyData.advanceBalance.toLocaleString()}</Typography>
              </Grid>
            </Grid>

            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Month</TableCell>
                    <TableCell align="right">Rent</TableCell>
                    <TableCell align="right">Paid</TableCell>
                    <TableCell align="right">Advance</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {yearlyData.monthlyData.map((monthData, index) => (
                    <TableRow key={monthData.month}>
                      <TableCell>{months[index]}</TableCell>
                      <TableCell align="right">₹{monthData.rentAmount.toLocaleString()}</TableCell>
                      <TableCell align="right">₹{monthData.paidAmount.toLocaleString()}</TableCell>
                      <TableCell align="right">₹{monthData.advanceDeduction.toLocaleString()}</TableCell>
                      <TableCell>{monthData.status}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Box>
      )}
    </Box>
  );
};

export default TenantHistory; 
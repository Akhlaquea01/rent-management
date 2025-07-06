import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { useRentStore } from '../store/rentStore';
import toast from 'react-hot-toast';

const AdvanceTracker: React.FC = () => {
  const { data } = useRentStore();
  const years = Object.keys(data.years).sort().reverse();
  const defaultYear = years.includes(new Date().getFullYear().toString())
    ? new Date().getFullYear().toString()
    : years[0];
  const [selectedYear, setSelectedYear] = useState<string>(defaultYear);
  const shops = data.years[selectedYear]?.shops || {};
  const [selectedShop, setSelectedShop] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [formData, setFormData] = useState({
    type: 'Deposit' as 'Deposit' | 'Deduction',
    amount: 0,
    date: new Date().toISOString().split('T')[0],
    description: '',
  });

  // Build shops with advance transactions
  const shopsWithAdvance = Object.entries(shops)
    .filter(([shopNumber, _]: [string, any]) => Array.isArray(data.advanceTransactions[shopNumber]) && data.advanceTransactions[shopNumber].length > 0)
    .map(([shopNumber, shop]: [string, any]) => ({
      shopNumber,
      name: shop.tenant.name,
    }));

  // Get transactions for selected shop
  const transactions = selectedShop ? (data.advanceTransactions[selectedShop] as any[] || []) : [];
  // Compute current balance
  const currentBalance = transactions.reduce((acc: number, t: any) => t.type === 'Deposit' ? acc + t.amount : acc - t.amount, 0);

  // When shopsWithAdvance or selectedYear changes, select the first tenant by default
  React.useEffect(() => {
    if (shopsWithAdvance.length > 0) {
      setSelectedShop(shopsWithAdvance[0].shopNumber);
    } else {
      setSelectedShop('');
    }
  }, [selectedYear, shopsWithAdvance]);

  const handleSubmit = () => {
    if (!selectedShop || formData.amount <= 0 || !formData.description) {
      toast.error('Please fill in all required fields');
      return;
    }
    try {
      // Deep clone advanceTransactions
      useRentStore.setState((state) => {
        const newAdvanceTransactions = { ...state.data.advanceTransactions };
        if (!newAdvanceTransactions[selectedShop]) {
          newAdvanceTransactions[selectedShop] = [];
        }
        newAdvanceTransactions[selectedShop] = [
          ...newAdvanceTransactions[selectedShop],
          {
            type: formData.type,
            amount: formData.amount,
            date: formData.date,
            description: formData.description,
          },
        ];
        return { data: { ...state.data, advanceTransactions: newAdvanceTransactions } };
      });
      toast.success('Advance transaction added successfully');
      setFormData({
        type: 'Deposit',
        amount: 0,
        date: new Date().toISOString().split('T')[0],
        description: '',
      });
      setOpenDialog(false);
    } catch (error) {
      toast.error('An error occurred');
    }
  };

  const getTenantName = (shopNumber: string) => {
    const shop = shops[shopNumber];
    return shop ? `${shop.tenant.name} - Shop ${shopNumber}` : 'Unknown Tenant';
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ mb: 3 }}>
        Advance Tracker
      </Typography>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Year</InputLabel>
          <Select
            value={selectedYear}
            label="Year"
            onChange={(e) => setSelectedYear(e.target.value)}
          >
            {years.map((year) => (
              <MenuItem key={year} value={year}>{year}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>
      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Select Tenant
              </Typography>
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Choose Tenant</InputLabel>
                <Select
                  value={selectedShop}
                  label="Choose Tenant"
                  onChange={(e) => setSelectedShop(e.target.value)}
                >
                  {shopsWithAdvance.map((shop) => (
                    <MenuItem key={shop.shopNumber} value={shop.shopNumber}>
                      {shop.name} - Shop {shop.shopNumber}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              {selectedShop && (
                <Box>
                  <Typography variant="body2" color="textSecondary">
                    Current Advance Balance
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                    ₹{currentBalance.toLocaleString()}
                  </Typography>
                  <Button
                    fullWidth
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => setOpenDialog(true)}
                    sx={{ mt: 2 }}
                  >
                    Add Transaction
                  </Button>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Transaction History
              </Typography>
              {selectedShop ? (
                <TableContainer component={Paper}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Date</TableCell>
                        <TableCell>Type</TableCell>
                        <TableCell>Amount</TableCell>
                        <TableCell>Description</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {transactions.length > 0 ? (
                        transactions.map((transaction: any, idx: number) => (
                          <TableRow key={idx}>
                            <TableCell>
                              {new Date(transaction.date).toLocaleDateString()}
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={transaction.type}
                                color={transaction.type === 'Deposit' ? 'success' : 'warning'}
                                size="small"
                              />
                            </TableCell>
                            <TableCell>
                              <Typography
                                color={transaction.type === 'Deposit' ? 'success.main' : 'warning.main'}
                                sx={{ fontWeight: 'bold' }}
                              >
                                {transaction.type === 'Deposit' ? '+' : '-'}₹{transaction.amount.toLocaleString()}
                              </Typography>
                            </TableCell>
                            <TableCell>{transaction.description}</TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={4} align="center">
                            No transactions found
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Typography color="textSecondary" align="center">
                  Select a tenant to view transaction history
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      {/* Add Transaction Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Advance Transaction</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <Typography variant="body2" color="textSecondary" gutterBottom>
                Tenant: {getTenantName(selectedShop)}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Type</InputLabel>
                <Select
                  value={formData.type}
                  label="Type"
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as 'Deposit' | 'Deduction' })}
                >
                  <MenuItem value="Deposit">Deposit</MenuItem>
                  <MenuItem value="Deduction">Deduction</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Amount *"
                type="number"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Date *"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                required
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Description *"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                required
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            Add
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdvanceTracker; 
import React, { useState, useEffect } from 'react';
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
  FormControlLabel,
  Checkbox,
  Divider,
} from '@mui/material';
import { useRentStore } from '../store/rentStore';
import toast from 'react-hot-toast';

interface RentEntryFormData {
  shopNumber: string;
  month: string;
  year: number;
  rentAmount: number;
  paidAmount: number;
  paymentDate: string;
  paymentMode: string;
  useAdvance: boolean;
  advanceDeduction: number;
  remarks: string;
}

const RentEntry: React.FC = () => {
  const { data } = useRentStore();
  const currentYear = new Date().getFullYear().toString();
  const shops = data.years[currentYear]?.shops || {};
  const [formData, setFormData] = useState<RentEntryFormData>({
    shopNumber: '',
    month: new Date().toISOString().slice(0, 7),
    year: new Date().getFullYear(),
    rentAmount: 0,
    paidAmount: 0,
    paymentDate: new Date().toISOString().split('T')[0],
    paymentMode: 'Cash',
    useAdvance: false,
    advanceDeduction: 0,
    remarks: '',
  });

  const [selectedShop, setSelectedShop] = useState<any>(null);
  const [advanceBalance, setAdvanceBalance] = useState(0);

  // Build active shops list
  const activeShops = Object.entries(shops)
    .filter(([_, shop]: [string, any]) => shop.tenant.status === 'Active')
    .map(([shopNumber, shop]: [string, any]) => ({
      shopNumber,
      name: shop.tenant.name,
      rentAmount: shop.rentAmount,
    }));

  useEffect(() => {
    if (formData.shopNumber) {
      const shop = shops[formData.shopNumber];
      setSelectedShop(shop);
      if (shop) {
        setFormData(prev => ({
          ...prev,
          rentAmount: shop.rentAmount,
          paidAmount: shop.rentAmount,
        }));
        // Calculate advance balance from transactions
        const transactions = data.advanceTransactions[formData.shopNumber] || [];
        const balance = transactions.reduce((acc: number, t: any) => 
          t.type === 'Deposit' ? acc + t.amount : acc - t.amount, 0);
        setAdvanceBalance(balance);
      }
    }
  }, [formData.shopNumber, shops, data.advanceTransactions]);

  const handleSubmit = () => {
    if (!formData.shopNumber || formData.paidAmount <= 0) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (formData.useAdvance && formData.advanceDeduction > advanceBalance) {
      toast.error('Advance deduction cannot exceed available balance');
      return;
    }

    try {
      // Calculate final status
      let status: 'Paid' | 'Pending' | 'Partial' | 'Overdue' = 'Paid';
      if (formData.paidAmount < formData.rentAmount) {
        status = formData.paidAmount > 0 ? 'Partial' : 'Pending';
      }

      // Update monthly data in store
      useRentStore.setState((state) => {
        const newData = { ...state.data };
        const shop = newData.years[currentYear].shops[formData.shopNumber];
        if (shop) {
          const monthName = new Date(formData.month + '-01').toLocaleDateString('en-US', { month: 'long' });
          shop.monthlyData[monthName] = {
            rent: formData.rentAmount,
            paid: formData.paidAmount,
            status: status as any,
            date: formData.paymentDate,
            advanceUsed: formData.useAdvance ? formData.advanceDeduction : 0,
          };
        }
        return { data: newData };
      });

      // Add advance transaction if advance is used
      if (formData.useAdvance && formData.advanceDeduction > 0) {
        useRentStore.setState((state) => {
          const newData = { ...state.data };
          if (!newData.advanceTransactions[formData.shopNumber]) {
            newData.advanceTransactions[formData.shopNumber] = [];
          }
          newData.advanceTransactions[formData.shopNumber] = [
            ...newData.advanceTransactions[formData.shopNumber],
            {
              type: 'Deduction',
              amount: formData.advanceDeduction,
              date: formData.paymentDate,
              description: `Rent payment for ${formData.month}`,
            },
          ];
          return { data: newData };
        });
      }

      toast.success('Rent entry added successfully');
      
      // Reset form
      setFormData({
        shopNumber: '',
        month: new Date().toISOString().slice(0, 7),
        year: new Date().getFullYear(),
        rentAmount: 0,
        paidAmount: 0,
        paymentDate: new Date().toISOString().split('T')[0],
        paymentMode: 'Cash',
        useAdvance: false,
        advanceDeduction: 0,
        remarks: '',
      });
      setSelectedShop(null);
      setAdvanceBalance(0);
    } catch (error) {
      toast.error('An error occurred');
    }
  };

  const handleAdvanceChange = (checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      useAdvance: checked,
      advanceDeduction: checked ? Math.min(advanceBalance, prev.paidAmount) : 0,
    }));
  };

  const handleAdvanceDeductionChange = (value: number) => {
    const maxDeduction = Math.min(advanceBalance, formData.paidAmount);
    const deduction = Math.min(value, maxDeduction);
    setFormData(prev => ({
      ...prev,
      advanceDeduction: deduction,
    }));
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ mb: 3 }}>
        Rent Entry
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Payment Details
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Select Shop *</InputLabel>
                    <Select
                      value={formData.shopNumber}
                      label="Select Shop *"
                      onChange={(e) => setFormData({ ...formData, shopNumber: e.target.value })}
                    >
                      {activeShops.map((shop) => (
                        <MenuItem key={shop.shopNumber} value={shop.shopNumber}>
                          {shop.name} - Shop {shop.shopNumber}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Month"
                    type="month"
                    value={formData.month}
                    onChange={(e) => setFormData({ ...formData, month: e.target.value })}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Rent Amount"
                    type="number"
                    value={formData.rentAmount}
                    onChange={(e) => setFormData({ ...formData, rentAmount: Number(e.target.value) })}
                    disabled
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Paid Amount *"
                    type="number"
                    value={formData.paidAmount}
                    onChange={(e) => setFormData({ ...formData, paidAmount: Number(e.target.value) })}
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Payment Date"
                    type="date"
                    value={formData.paymentDate}
                    onChange={(e) => setFormData({ ...formData, paymentDate: e.target.value })}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Payment Mode</InputLabel>
                    <Select
                      value={formData.paymentMode}
                      label="Payment Mode"
                      onChange={(e) => setFormData({ ...formData, paymentMode: e.target.value as any })}
                    >
                      <MenuItem value="Cash">Cash</MenuItem>
                      <MenuItem value="Bank Transfer">Bank Transfer</MenuItem>
                      <MenuItem value="Cheque">Cheque</MenuItem>
                      <MenuItem value="Online">Online</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Remarks"
                    multiline
                    rows={2}
                    value={formData.remarks}
                    onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Advance Options
              </Typography>
              
              {selectedShop && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="textSecondary">
                    Available Advance Balance
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                    ₹{advanceBalance.toLocaleString()}
                  </Typography>
                </Box>
              )}

              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.useAdvance}
                    onChange={(e) => handleAdvanceChange(e.target.checked)}
                    disabled={!selectedShop || advanceBalance <= 0}
                  />
                }
                label="Use Advance Payment"
              />

              {formData.useAdvance && (
                <Box sx={{ mt: 2 }}>
                  <TextField
                    fullWidth
                    label="Advance Deduction"
                    type="number"
                    value={formData.advanceDeduction}
                    onChange={(e) => handleAdvanceDeductionChange(Number(e.target.value))}
                    helperText={`Max: ₹${Math.min(advanceBalance, formData.paidAmount).toLocaleString()}`}
                  />
                </Box>
              )}

              <Divider sx={{ my: 2 }} />

              {selectedShop && (
                <Box>
                  <Typography variant="body2" color="textSecondary">
                    Final Amount to Collect
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                    ₹{(formData.paidAmount - formData.advanceDeduction).toLocaleString()}
                  </Typography>
                </Box>
              )}

              <Button
                fullWidth
                variant="contained"
                size="large"
                onClick={handleSubmit}
                sx={{ mt: 2 }}
                disabled={!formData.shopNumber || formData.paidAmount <= 0}
              >
                Record Payment
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default RentEntry; 
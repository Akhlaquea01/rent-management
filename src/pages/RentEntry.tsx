import React, { useState, useEffect, useMemo } from 'react';
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
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
  const shops = useMemo(() => data.years[currentYear]?.shops || {}, [data.years, currentYear]);
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
  const [bulkDialogOpen, setBulkDialogOpen] = useState(false);
  const [bulkJson, setBulkJson] = useState('');

  // Build active shops list
  const activeShops = useMemo(() => Object.entries(shops)
    .filter(([_, shop]: [string, any]) => shop.tenant.status === 'Active')
    .map(([shopNumber, shop]: [string, any]) => ({
      shopNumber,
      name: shop.tenant.name,
      rentAmount: shop.rentAmount,
    })), [shops]);

  useEffect(() => {
    if (formData.shopNumber) {
      const shop = shops[formData.shopNumber];
      if (shop) {
        setFormData(prev => ({
          ...prev,
          rentAmount: shop.rentAmount,
          paidAmount: shop.rentAmount,
        }));
      }
    }
  }, [formData.shopNumber, shops]);

  const handleSubmit = () => {
    if (!formData.shopNumber || formData.paidAmount <= 0) {
      toast.error('Please fill in all required fields');
      return;
    }
    try {
      // Calculate total to allocate
      let totalToAllocate = formData.paidAmount + (formData.useAdvance ? formData.advanceDeduction : 0);
      const monthDate = new Date(formData.month + '-01');
      const monthName = monthDate.toLocaleDateString('en-US', { month: 'long' });
      const year = monthDate.getFullYear().toString();

      useRentStore.setState((state) => {
        // Deep clone years and shops
        const newYears = { ...state.data.years };
        // Deep clone all years (for previousYearDues update)
        Object.keys(newYears).forEach((y) => {
          newYears[y] = { ...newYears[y], shops: { ...newYears[y].shops } };
          Object.keys(newYears[y].shops).forEach((shopNum) => {
            newYears[y].shops[shopNum] = { ...newYears[y].shops[shopNum], monthlyData: { ...newYears[y].shops[shopNum].monthlyData } };
            if (newYears[y].shops[shopNum].previousYearDues) {
              newYears[y].shops[shopNum].previousYearDues = { ...newYears[y].shops[shopNum].previousYearDues };
            }
          });
        });
        const yearData = newYears[year];
        const shops = yearData.shops;
        const shop = shops[formData.shopNumber];

        // Gather all due months (previous years first, then current year), oldest to newest
        const allDueMonths: Array<{ year: string, month: string, shopKey: string }> = [];
        Object.keys(newYears)
          .filter(y => y < year)
          .sort()
          .forEach(y => {
            const shop = newYears[y]?.shops[formData.shopNumber];
            if (shop && shop.monthlyData) {
              Object.entries(shop.monthlyData).forEach(([m, md]: [string, any]) => {
                if (md.status !== 'Paid') {
                  allDueMonths.push({ year: y, month: m, shopKey: formData.shopNumber });
                }
              });
            }
          });
        if (shop && shop.monthlyData) {
          const monthsOrder = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
          ];
          for (const m of monthsOrder) {
            if (monthsOrder.indexOf(m) > monthDate.getMonth()) break;
            const md = shop.monthlyData[m];
            if (md && md.status !== 'Paid') {
              allDueMonths.push({ year, month: m, shopKey: formData.shopNumber });
            }
          }
        }

        // Allocate payment to dues
        let remaining = totalToAllocate;
        for (const due of allDueMonths) {
          const dueShop = newYears[due.year]?.shops[due.shopKey];
          if (!dueShop) continue;
          const md = dueShop.monthlyData[due.month];
          const dueAmount = (md?.rent || dueShop.rentAmount) - (md?.paid || 0);
          if (dueAmount > 0) {
            const pay = Math.min(remaining, dueAmount);
            dueShop.monthlyData[due.month] = {
              ...md,
              paid: (md?.paid || 0) + pay,
              status: (pay + (md?.paid || 0)) >= (md?.rent || dueShop.rentAmount) ? 'Paid' : (pay > 0 ? 'Partial' : 'Pending'),
              date: formData.paymentDate,
              advanceUsed: 0,
            };
            remaining -= pay;
          }
          if (remaining <= 0) break;
        }

        // If still remaining, apply to current month
        if (remaining > 0 && shop) {
          const md = shop.monthlyData[monthName] || { rent: shop.rentAmount, paid: 0, status: 'Pending', advanceUsed: 0 };
          const pay = Math.min(remaining, md.rent - (md.paid || 0));
          shop.monthlyData[monthName] = {
            ...md,
            paid: (md.paid || 0) + pay,
            status: ((md.paid || 0) + pay) >= md.rent ? 'Paid' : (pay > 0 ? 'Partial' : 'Pending'),
            date: formData.paymentDate,
            advanceUsed: formData.useAdvance ? formData.advanceDeduction : 0,
          };
          remaining -= pay;
        }

        // Update previousYearDues if all previous months are paid
        Object.keys(newYears)
          .filter(y => y < year)
          .forEach(y => {
            const shop = newYears[y]?.shops[formData.shopNumber];
            if (shop && shop.previousYearDues) {
              const unpaid = Object.entries(shop.monthlyData || {}).filter(([_, md]: [string, any]) => md.status !== 'Paid');
              if (unpaid.length === 0) {
                shop.previousYearDues.totalDues = 0;
                shop.previousYearDues.dueMonths = [];
              } else {
                shop.previousYearDues.dueMonths = unpaid.map(([m]) => m);
                shop.previousYearDues.totalDues = unpaid.reduce((sum, [_, md]: [string, any]) => sum + ((md.rent || 0) - (md.paid || 0)), 0);
              }
            }
          });

        // Deep clone advanceTransactions
        const newAdvanceTransactions = { ...state.data.advanceTransactions };
        // Add advance transaction if advance is used
        if (formData.useAdvance && formData.advanceDeduction > 0) {
          if (!newAdvanceTransactions[formData.shopNumber]) {
            newAdvanceTransactions[formData.shopNumber] = [];
          }
          newAdvanceTransactions[formData.shopNumber] = [
            ...newAdvanceTransactions[formData.shopNumber],
            {
              type: 'Deduction',
              amount: formData.advanceDeduction,
              date: formData.paymentDate,
              description: `Rent payment for ${formData.month}`,
            },
          ];
        }

        return { data: { ...state.data, years: newYears, advanceTransactions: newAdvanceTransactions } };
      });

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
    } catch (error) {
      toast.error('An error occurred');
    }
  };

  const handleBulkUpdate = () => {
    let parsed;
    try {
      parsed = JSON.parse(bulkJson);
    } catch (e) {
      toast.error('Invalid JSON');
      return;
    }
    // Expecting format: [{ year, shopNumber, month, rentAmount, paidAmount, paymentDate, paymentMode, remarks }]
    if (!Array.isArray(parsed)) {
      toast.error('JSON must be an array');
      return;
    }
    useRentStore.setState((state) => {
      // Deep clone years and shops
      const newYears = { ...state.data.years };
      parsed.forEach((entry) => {
        const { year, shopNumber, month, rentAmount, paidAmount, paymentDate } = entry;
        if (!newYears[year] || !newYears[year].shops[shopNumber]) return;
        newYears[year] = { ...newYears[year], shops: { ...newYears[year].shops } };
        newYears[year].shops[shopNumber] = { ...newYears[year].shops[shopNumber], monthlyData: { ...newYears[year].shops[shopNumber].monthlyData } };
        const shop = newYears[year].shops[shopNumber];
        const monthName = new Date(month + '-01').toLocaleDateString('en-US', { month: 'long' });
        shop.monthlyData[monthName] = {
          rent: rentAmount,
          paid: paidAmount,
          status: paidAmount >= rentAmount ? 'Paid' : paidAmount > 0 ? 'Partial' : 'Pending',
          date: paymentDate,
          advanceUsed: 0,
        };
      });
      return { data: { ...state.data, years: newYears } };
    });
    toast.success('Bulk rent update successful');
    setBulkDialogOpen(false);
    setBulkJson('');
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ mb: 3 }}>
        Rent Entry
      </Typography>
      <Button variant="outlined" sx={{ mb: 2 }} onClick={() => setBulkDialogOpen(true)}>
        Bulk Rent Update (JSON)
      </Button>
      <Dialog open={bulkDialogOpen} onClose={() => setBulkDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Bulk Rent Update (JSON)</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 1 }}>
            Paste an array of rent entries. Example:<br/>
            <pre style={{ background: '#f5f5f5', padding: 8, borderRadius: 4, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
{`[
  {
    "year": "2024",
    "shopNumber": "101",
    "month": "2024-07",
    "rentAmount": 10000,
    "paidAmount": 10000,
    "paymentDate": "2024-07-05"
  }
]`}
            </pre>
          </Typography>
          <TextField
            fullWidth
            multiline
            minRows={8}
            value={bulkJson}
            onChange={e => setBulkJson(e.target.value)}
            placeholder="Paste JSON here"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBulkDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleBulkUpdate}>Update</Button>
        </DialogActions>
      </Dialog>

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
              </Grid>
            </CardContent>
          </Card>
        </Grid>
        {/* Bulk JSON update UI will be added here */}
      </Grid>
    </Box>
  );
};

export default RentEntry; 
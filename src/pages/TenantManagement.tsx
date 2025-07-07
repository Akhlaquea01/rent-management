import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Card,
  CardContent,
  Chip,
  IconButton,
  useTheme,
  useMediaQuery,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Tooltip,
  Stack,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { useRentStore } from '../store/rentStore';
import { Tenant } from '../types';
import { ShopData } from '../types';
import toast from 'react-hot-toast';

const TenantManagement: React.FC = () => {
  // Update: get data from new structure
  const { data, addTenant, updateTenant, deleteTenant, getTenantByShopNumber } = useRentStore();
  const years = Object.keys(data.years).sort().reverse();
  const defaultYear = years.includes(new Date().getFullYear().toString())
    ? new Date().getFullYear().toString()
    : years[0];
  const [selectedYear, setSelectedYear] = useState<string>(defaultYear);
  const shops = data.years[selectedYear]?.shops || {};
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [openDialog, setOpenDialog] = useState(false);
  const [editingShopNumber, setEditingShopNumber] = useState<string | null>(null);
  const [formData, setFormData] = useState<{
    shopNumber: string;
    rentAmount: number;
    advanceAmount: number;
    tenant: Tenant;
  }>({
    shopNumber: '',
    rentAmount: 0,
    advanceAmount: 0,
    tenant: {
      name: '',
      status: 'Active',
      agreementDate: new Date().toISOString().split('T')[0],
      phoneNumber: '',
      email: '',
      address: '',
    },
  });

  const handleOpenDialog = (shopNumber?: string) => {
    if (shopNumber && shops[shopNumber]) {
      setEditingShopNumber(shopNumber);
      const shopData = shops[shopNumber];
      setFormData({
        shopNumber,
        rentAmount: shopData.rentAmount,
        advanceAmount: shopData.advanceAmount,
        tenant: {
          ...shopData.tenant,
          agreementDate: shopData.tenant.agreementDate.split('T')[0],
        },
      });
    } else {
      setEditingShopNumber(null);
      setFormData({
        shopNumber: '',
        rentAmount: 0,
        advanceAmount: 0,
        tenant: {
          name: '',
          status: 'Active',
          agreementDate: new Date().toISOString().split('T')[0],
          phoneNumber: '',
          email: '',
          address: '',
        },
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingShopNumber(null);
  };

  const handleSubmit = () => {
    if (!formData.tenant.name || !formData.shopNumber || formData.rentAmount <= 0) {
      toast.error('Please fill in all required fields');
      return;
    }
    // TODO: update addTenant, updateTenant, deleteTenant in store to work with new structure
    if (!editingShopNumber && shops[formData.shopNumber]) {
      toast.error('Shop number already exists');
      return;
    }
    try {
      if (editingShopNumber) {
        updateTenant(selectedYear, formData.shopNumber, {
          ...shops[formData.shopNumber],
          rentAmount: formData.rentAmount,
          advanceAmount: formData.advanceAmount,
          tenant: {
            ...formData.tenant,
            agreementDate: new Date(formData.tenant.agreementDate).toISOString(),
          },
        });
        toast.success('Tenant updated successfully');
      } else {
        addTenant(selectedYear, formData.shopNumber, {
          rentAmount: formData.rentAmount,
          advanceAmount: formData.advanceAmount,
          tenant: {
            ...formData.tenant,
            agreementDate: new Date(formData.tenant.agreementDate).toISOString(),
          },
          previousYearDues: { totalDues: 0, dueMonths: [], description: '' },
          currentYearDues: { totalDues: 0, dueMonths: [], description: '' },
          totalDuesBalance: 0,
          monthlyData: {},
        });
        toast.success('Tenant added successfully');
      }
      handleCloseDialog();
    } catch (error) {
      toast.error('An error occurred');
    }
  };

  const handleDelete = (shopNumber: string) => {
    if (window.confirm('Are you sure you want to delete this tenant?')) {
      deleteTenant(selectedYear, shopNumber);
      toast.success('Tenant deleted successfully');
    }
  };

  const getAdvanceDeposit = (shopNumber: string, shop: ShopData): number => {
    const transactions = Array.isArray(data.advanceTransactions[shopNumber]) ? data.advanceTransactions[shopNumber] : [];
    if (!transactions.length) return typeof shop.advanceAmount === 'number' ? shop.advanceAmount : 0;
    return transactions.filter((t: any) => t.type === 'Deposit').reduce((acc: number, t: any) => acc + t.amount, 0);
  };

  // Advance: always show original advanceAmount from shop data
  // Advance Remaining: advanceAmount minus sum of all 'Advance Deduction' transactions
  const getAdvanceRemaining = (shopNumber: string, shop: ShopData): number => {
    const transactions = Array.isArray(data.advanceTransactions[shopNumber]) ? data.advanceTransactions[shopNumber] : [];
    if (!shop || typeof shop.advanceAmount !== 'number') return 0;
    const totalAdvanceDeducted = transactions
      .filter((t: any) => t.type === 'Advance Deduction')
      .reduce((acc: number, t: any) => acc + t.amount, 0);
    return shop.advanceAmount - totalAdvanceDeducted;
  };

  // Helper to get dues breakdown for a shop
  const getDuesTooltip = (shopNumber: string, shop: ShopData) => {
    let totalPendingMonths = 0;
    let totalDueAmount = 0;
    const yearBreakdown: Record<string, { months: string[], amount: number }> = {};
    Object.entries(data.years).forEach(([year, yearData]) => {
      const s = yearData.shops[shopNumber];
      if (s && s.monthlyData) {
        const months: string[] = [];
        let yearDue = 0;
        Object.entries(s.monthlyData).forEach(([month, mdata]: [string, any]) => {
          if (mdata.status === 'Pending' || mdata.status === 'Partial') {
            months.push(month);
            yearDue += (mdata.rent || 0) - (mdata.paid || 0);
          }
        });
        if (months.length) {
          yearBreakdown[year] = { months, amount: yearDue };
          totalPendingMonths += months.length;
          totalDueAmount += yearDue;
        }
      }
    });
    return (
      <Box>
        <Typography variant="subtitle2">{shop.tenant.name}</Typography>
        <Typography variant="body2">Pending Months: <b>{totalPendingMonths}</b></Typography>
        <Typography variant="body2">Total Due: <b>₹{totalDueAmount.toLocaleString()}</b></Typography>
        {Object.entries(yearBreakdown).map(([year, info]) => (
          <Box key={year} sx={{ mt: 1 }}>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>{year}:</Typography>
            <Typography variant="body2" sx={{ ml: 1 }}>
              {info.months.join(', ')}
              {info.amount > 0 && ` (₹${info.amount.toLocaleString()})`}
            </Typography>
          </Box>
        ))}
      </Box>
    );
  };

  return (
    <Box>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center" justifyContent="space-between" sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="h4">Tenant Management</Typography>
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
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Add Tenant
        </Button>
      </Stack>
      <Card>
        <CardContent>
          {isMobile ? (
            <Grid container spacing={2}>
              {Object.entries(shops).map(([shopNumber, shopData]) => {
                const shop = shopData as ShopData;
                const advanceDeposit = getAdvanceDeposit(shopNumber, shop);
                const advanceRemaining = getAdvanceRemaining(shopNumber, shop);
                return (
                  <Grid item xs={12} key={shopNumber}>
                    <Card variant="outlined" sx={{ p: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                        <Typography variant="h6">{shop.tenant.name}</Typography>
                        <Chip
                          label={shop.tenant.status}
                          color={shop.tenant.status === 'Active' ? 'success' : 'default'}
                          size="small"
                        />
                      </Box>
                      <Typography variant="body2" color="textSecondary" gutterBottom>
                        Shop: {shopNumber}
                      </Typography>
                      <Typography variant="body2" gutterBottom>
                        Rent: ₹{shop.rentAmount.toLocaleString()}
                      </Typography>
                      <Typography variant="body2" color="textSecondary" gutterBottom>
                        Mobile: {shop.tenant.phoneNumber}
                      </Typography>
                      <Typography variant="body2" color="textSecondary" gutterBottom>
                        Advance: ₹{shop.advanceAmount.toLocaleString()}
                      </Typography>
                      <Typography variant="body2" color="textSecondary" gutterBottom>
                        Advance Remaining: ₹{advanceRemaining.toLocaleString()}
                      </Typography>
                      <Typography variant="body2" color="textSecondary" gutterBottom>
                        Agreement: {new Date(shop.tenant.agreementDate).toLocaleDateString()}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                        <Button
                          size="small"
                          startIcon={<EditIcon />}
                          onClick={() => handleOpenDialog(shopNumber)}
                          variant="outlined"
                        >
                          Edit
                        </Button>
                        <Button
                          size="small"
                          startIcon={<DeleteIcon />}
                          onClick={() => handleDelete(shopNumber)}
                          variant="outlined"
                          color="error"
                        >
                          Delete
                        </Button>
                      </Box>
                    </Card>
                  </Grid>
                );
              })}
            </Grid>
          ) : (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Shop Number</TableCell>
                    <TableCell align="right">Rent Amount</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Mobile</TableCell>
                    <TableCell align="right">Advance</TableCell>
                    <TableCell align="right">Advance Remaining</TableCell>
                    <TableCell>Agreement Date</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {Object.entries(shops).map(([shopNumber, shopData]) => {
                    const shop = shopData as ShopData;
                    const advanceDeposit = getAdvanceDeposit(shopNumber, shop);
                    const advanceRemaining = getAdvanceRemaining(shopNumber, shop);
                    return (
                      <TableRow key={shopNumber}>
                        <TableCell>
                          <Tooltip title={getDuesTooltip(shopNumber, shop)} arrow placement="right" enterDelay={300}>
                            <span style={{ cursor: 'pointer', textDecoration: 'underline', color: '#1976d2' }}>{shop.tenant.name}</span>
                          </Tooltip>
                        </TableCell>
                        <TableCell>{shopNumber}</TableCell>
                        <TableCell align="right">₹{shop.rentAmount.toLocaleString()}</TableCell>
                        <TableCell>
                          <Chip
                            label={shop.tenant.status}
                            color={shop.tenant.status === 'Active' ? 'success' : 'default'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>{shop.tenant.phoneNumber}</TableCell>
                        <TableCell align="right">₹{shop.advanceAmount.toLocaleString()}</TableCell>
                        <TableCell align="right">₹{advanceRemaining.toLocaleString()}</TableCell>
                        <TableCell>{new Date(shop.tenant.agreementDate).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <IconButton
                              size="small"
                              onClick={() => handleOpenDialog(shopNumber)}
                              color="primary"
                            >
                              <EditIcon />
                            </IconButton>
                            <IconButton
                              size="small"
                              onClick={() => handleDelete(shopNumber)}
                              color="error"
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Box>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>
      {/* Add/Edit Tenant Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingShopNumber ? 'Edit Tenant' : 'Add New Tenant'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Tenant Name *"
                value={formData.tenant.name}
                onChange={(e) => setFormData({ ...formData, tenant: { ...formData.tenant, name: e.target.value } })}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Shop Number *"
                value={formData.shopNumber}
                onChange={(e) => setFormData({ ...formData, shopNumber: e.target.value })}
                required
                disabled={!!editingShopNumber}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Rent Amount *"
                type="number"
                value={formData.rentAmount}
                onChange={(e) => setFormData({ ...formData, rentAmount: Number(e.target.value) })}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Advance Amount *"
                type="number"
                value={formData.advanceAmount}
                onChange={(e) => setFormData({ ...formData, advanceAmount: Number(e.target.value) })}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Agreement Date *"
                type="date"
                value={formData.tenant.agreementDate}
                onChange={(e) => setFormData({ ...formData, tenant: { ...formData.tenant, agreementDate: e.target.value } })}
                required
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={formData.tenant.status}
                  label="Status"
                  onChange={(e) => setFormData({ ...formData, tenant: { ...formData.tenant, status: e.target.value as 'Active' | 'Inactive' } })}
                >
                  <MenuItem value="Active">Active</MenuItem>
                  <MenuItem value="Inactive">Inactive</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Phone Number"
                value={formData.tenant.phoneNumber}
                onChange={(e) => setFormData({ ...formData, tenant: { ...formData.tenant, phoneNumber: e.target.value } })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Email"
                value={formData.tenant.email}
                onChange={(e) => setFormData({ ...formData, tenant: { ...formData.tenant, email: e.target.value } })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Address"
                value={formData.tenant.address}
                onChange={(e) => setFormData({ ...formData, tenant: { ...formData.tenant, address: e.target.value } })}
                multiline
                rows={2}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editingShopNumber ? 'Update' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TenantManagement; 
import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Chip,
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
  Button,
  Popover,
  IconButton,
  CircularProgress,
  Alert,
  TextField,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import CloseIcon from '@mui/icons-material/Close';
import SearchIcon from '@mui/icons-material/Search';
import SendIcon from '@mui/icons-material/Send';

import { ApiTenantData } from "../types";
import * as tenantService from "../services/tenantService";
import toast from "react-hot-toast";

// Utility function to encode text for WhatsApp URL
const encodeWhatsAppText = (text: string): string => {
  return encodeURIComponent(text);
};

// Utility function to generate dues reminder message
const generateDuesMessage = (
  tenantName: string,
  totalDueAmount: number,
  dueMonths: string | null
): string => {
  let message = `नमस्ते ${tenantName},

🏠 *किराया भुगतान अनुस्मारक*

• आपकी कुल बकाया राशि: *₹${totalDueAmount.toLocaleString()}*`;

  if (dueMonths) {
    message += `\n• बकाया महीने:\n${dueMonths}`;
  }

  message += `\n\n💳 *भुगतान करने के लिए नीचे दिए गए लिंक पर क्लिक करें:*
upi://pay?pa=9798211257@ybl&pn=Mohammad%20Ehsan%20Ahmad&am=${totalDueAmount}&cu=INR

    PhonePe: 9798211257
⚠️ कृपया जल्द से जल्द बकाया राशि का भुगतान करें।

🙏 धन्यवाद!
मोहम्मद एहसान अहमद
सिवाईपट्टी`;

  return message;
};

// Utility function to generate NOC (thanks for payment) message
const generateNOCMessage = (tenantName: string): string => {
  const currentDate = new Date();
  currentDate.setMonth(currentDate.getMonth() - 1);
  const currentMonth = currentDate.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });

  return `नमस्ते ${tenantName},

आपके सभी भुगतानों के लिए धन्यवाद।

यह संदेश आपको सूचित करने के लिए है कि आपके सभी किराया भुगतान ${currentMonth} तक पूर्ण रूप से प्राप्त हो गए हैं।

धन्यवाद!
मोहम्मद एहसान अहमद
सिवाईपट्टी`;
};

// Utility function to get WhatsApp URL
const getWhatsAppUrl = (message: string, mobileNumber: string): string => {
  const encodedMessage = encodeWhatsAppText(message);
  const formattedNumber = `91${mobileNumber}`;
  return `https://wa.me/${formattedNumber}?text=${encodedMessage}`;
};

const TenantManagement: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const isTablet = useMediaQuery(theme.breakpoints.down("lg"));

  const [tenantData, setTenantData] = useState<ApiTenantData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [popoverAnchorEl, setPopoverAnchorEl] = useState<HTMLElement | null>(null);
  const [popoverTenant, setPopoverTenant] = useState<ApiTenantData | null>(null);
  const [mobileDialogOpen, setMobileDialogOpen] = useState(false);
  const [selectedTenantForMobile, setSelectedTenantForMobile] = useState<ApiTenantData | null>(null);
  const [bulkMessageType, setBulkMessageType] = useState<'dues' | 'noc'>('dues');
  const showBulkOption = false;

  // Fetch tenant data from API
  useEffect(() => {
    const fetchTenantData = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await tenantService.getAll();

        // Map API response (ApiTenantRecord[]) → ApiTenantData[] that the UI expects
        const mapped: ApiTenantData[] = res.data.map((record) => ({
          shop_no: record.shop_no,
          tenant: record.tenant,
        }));
        setTenantData(mapped);
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to fetch tenant data';
        setError(msg);
        toast.error(msg);
        console.error('Error fetching tenant data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchTenantData();
  }, []);

  // Parse shop number for sorting
  const parseShopNumber = (shopNum: string) => {
    const match = shopNum.match(/^(\d+)(?:-(\w+))?$/);
    return {
      number: match ? parseInt(match[1], 10) : 0,
      suffix: match?.[2] || ''
    };
  };

  // Calculate statistics for all tenants (for counts)
  const allTenantStats = useMemo(() => {
    const activeCount = tenantData.filter(t => t.tenant.status === 'Active').length;
    const inactiveCount = tenantData.filter(t => t.tenant.status === 'Inactive').length;

    return {
      activeCount,
      inactiveCount,
      totalCount: tenantData.length
    };
  }, [tenantData]);

  // Filter and sort data
  const filteredAndSortedData = useMemo(() => {
    let filtered = tenantData;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(item =>
        item.tenant.tenant_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.shop_no.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.tenant.mobile_number.includes(searchTerm)
      );
    }

    // Apply status filter
    if (statusFilter !== 'All') {
      filtered = filtered.filter(item => item.tenant.status === statusFilter);
    }

    // Sort by shop number
    return filtered.sort((a, b) => {
      const shopA = parseShopNumber(a.shop_no);
      const shopB = parseShopNumber(b.shop_no);

      if (shopA.number !== shopB.number) {
        return shopA.number - shopB.number;
      }

      return shopA.suffix.localeCompare(shopB.suffix);
    });
  }, [tenantData, searchTerm, statusFilter]);

  // Calculate statistics for filtered data
  const filteredStats = useMemo(() => {
    const totalAdvance = filteredAndSortedData.reduce((sum, item) => sum + (item.tenant.advance_paid || 0), 0);
    const totalDues = filteredAndSortedData.reduce((sum, item) => sum + (item.tenant.total_due || 0), 0);
    const advanceRemaining = filteredAndSortedData.reduce((sum, item) => sum + (item.tenant.advance_remaining || 0), 0);

    return {
      totalAdvance,
      totalDues,
      advanceRemaining,
      filteredCount: filteredAndSortedData.length
    };
  }, [filteredAndSortedData]);

  const handlePopoverOpen = (event: React.MouseEvent<HTMLElement>, tenant: ApiTenantData) => {
    setPopoverAnchorEl(event.currentTarget);
    setPopoverTenant(tenant);
  };

  const handlePopoverClose = () => {
    setPopoverAnchorEl(null);
    setPopoverTenant(null);
  };

  const handleMobileDialogOpen = (tenant: ApiTenantData) => {
    setSelectedTenantForMobile(tenant);
    setMobileDialogOpen(true);
  };

  const handleMobileDialogClose = () => {
    setMobileDialogOpen(false);
    setSelectedTenantForMobile(null);
  };

  // Enhanced tooltip content with address and father's name
  const getDuesTooltip = (tenant: ApiTenantData) => {
    const { tenant: tenantInfo } = tenant;
    return (
      <Box>
        <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
          {tenantInfo.tenant_name}
        </Typography>

        <Typography variant="body2" sx={{ mb: 0.5 }}>
          Shop: <b>{tenant.shop_no}</b>
        </Typography>

        <Typography variant="body2" sx={{ mb: 0.5 }}>
          Monthly Rent: <b>₹{tenantInfo.monthly_rent.toLocaleString()}</b>
        </Typography>

        {tenantInfo.fathers_name && (
          <Typography variant="body2" sx={{ mb: 0.5 }}>
            Father's Name: <b>{tenantInfo.fathers_name}</b>
          </Typography>
        )}

        {tenantInfo.address && tenantInfo.address !== "NA" && (
          <Typography variant="body2" sx={{ mb: 0.5 }}>
            Address: <b>{tenantInfo.address}</b>
          </Typography>
        )}

        {tenantInfo.id_number && tenantInfo.id_number !== "0" && (
          <Typography variant="body2" sx={{ mb: 0.5 }}>
            ID Number: <b>{tenantInfo.id_number}</b>
          </Typography>
        )}

        {tenantInfo.email && tenantInfo.email !== "NA" && (
          <Typography variant="body2" sx={{ mb: 0.5 }}>
            Email: <b>{tenantInfo.email}</b>
          </Typography>
        )}

        {tenantInfo.total_due && tenantInfo.total_due > 0 && (
          <>
            <Typography variant="body2" sx={{ mb: 0.5, color: '#b71c1c' }}>
              Total Due: <b>₹{tenantInfo.total_due.toLocaleString()}</b>
            </Typography>
            {tenantInfo.due_months && (
              <Box sx={{ mt: 1, mb: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>Due Months:</Typography>
                <Typography variant="body2" sx={{ ml: 1, fontSize: '0.75rem' }}>
                  {tenantInfo.due_months}
                </Typography>
              </Box>
            )}
          </>
        )}

        {tenantInfo.advance_paid && (
          <Typography variant="body2" sx={{ mb: 0.5 }}>
            Advance Paid: <b>₹{tenantInfo.advance_paid.toLocaleString()}</b>
          </Typography>
        )}

        {tenantInfo.advance_remaining && (
          <Typography variant="body2" sx={{ mb: 0.5 }}>
            Advance Remaining: <b>₹{tenantInfo.advance_remaining.toLocaleString()}</b>
          </Typography>
        )}

        <Typography variant="body2" sx={{ mb: 0.5 }}>
          Agreement Status: <b>{tenantInfo.agreement_status}</b>
        </Typography>

        {tenantInfo.comment && (
          <Typography variant="body2" sx={{ mt: 1, fontStyle: 'italic' }}>
            Comment: {tenantInfo.comment}
          </Typography>
        )}
      </Box>
    );
  };

  // Check if tenant can receive WhatsApp messages
  const canSendWhatsApp = (tenant: ApiTenantData): boolean => {
    const { tenant: tenantInfo } = tenant;
    return tenantInfo.status === 'Active' &&
      tenantInfo.mobile_number &&
      tenantInfo.mobile_number !== '0' &&
      tenantInfo.mobile_number.trim() !== '';
  };

  // Handle single WhatsApp notification
  const handleWhatsAppNotification = (tenant: ApiTenantData, messageType: 'dues' | 'noc' = 'dues') => {
    const { tenant: tenantInfo } = tenant;

    // Check if tenant can receive messages
    if (!canSendWhatsApp(tenant)) {
      const reason = tenantInfo.status !== 'Active' ? 'tenant is inactive' : 'mobile number is missing or invalid';
      alert(`Cannot send message: ${reason}`);
      return;
    }

    let message: string;
    if (messageType === 'dues' && tenantInfo.total_due && tenantInfo.total_due > 0) {
      message = generateDuesMessage(
        `${tenantInfo.tenant_name} (Shop No-${tenant.shop_no})`,
        tenantInfo.total_due,
        tenantInfo.due_months
      );
    } else if (messageType === 'noc') {
      message = generateNOCMessage(`${tenantInfo.tenant_name} (Shop No-${tenant.shop_no})`);
    } else {
      return; // Don't send message if no dues and trying to send dues message
    }

    const whatsappUrl = getWhatsAppUrl(message, tenantInfo.mobile_number);
    window.open(whatsappUrl, '_blank');
  };

  // Handle bulk WhatsApp notifications
  const handleBulkWhatsAppNotification = () => {
    const tenantsToMessage = filteredAndSortedData.filter(tenant => {
      // First check if tenant can receive messages
      if (!canSendWhatsApp(tenant)) {
        return false;
      }

      // Then check message type criteria
      if (bulkMessageType === 'dues') {
        return tenant.tenant.total_due && tenant.tenant.total_due > 0;
      } else {
        return !tenant.tenant.total_due || tenant.tenant.total_due === 0;
      }
    });

    if (tenantsToMessage.length === 0) {
      alert(`No eligible tenants found for ${bulkMessageType === 'dues' ? 'dues' : 'NOC'} messages. Make sure tenants are active and have valid mobile numbers.`);
      return;
    }

    // Send messages one by one with a small delay
    tenantsToMessage.forEach((tenant, index) => {
      setTimeout(() => {
        handleWhatsAppNotification(tenant, bulkMessageType);
      }, index * 2000); // 2 second delay between messages
    });

    alert(`Opening WhatsApp for ${tenantsToMessage.length} eligible tenants. Messages will be sent with 2-second intervals.`);
  };

  // Common card content for mobile view
  const renderMobileCard = (tenant: ApiTenantData) => {
    const { tenant: tenantInfo } = tenant;
    const hasDues = tenantInfo.total_due && tenantInfo.total_due > 0;
    const canSend = canSendWhatsApp(tenant);

    return (
      <Card variant="outlined" sx={{ p: 2 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 1 }}>
          <Typography
            variant="h6"
            onClick={(e) => handlePopoverOpen(e, tenant)}
            sx={{ cursor: 'pointer', textDecoration: 'underline', color: '#1976d2' }}
          >
            {tenantInfo.tenant_name}
          </Typography>
          <Chip
            label={tenantInfo.status}
            color={tenantInfo.status === "Active" ? "success" : "default"}
            size="small"
          />
        </Box>

        <Typography variant="body2" color="textSecondary" gutterBottom>
          Shop: {tenant.shop_no}
        </Typography>

        <Typography variant="body2" gutterBottom>
          Monthly Rent: ₹{tenantInfo.monthly_rent.toLocaleString()}
        </Typography>

        <Typography variant="body2" color="textSecondary" gutterBottom>
          Mobile: {tenantInfo.mobile_number}
        </Typography>

        {tenantInfo.advance_paid && (
          <Typography variant="body2" color="textSecondary" gutterBottom>
            Advance Paid: ₹{tenantInfo.advance_paid.toLocaleString()}
          </Typography>
        )}

        {tenantInfo.advance_remaining && (
          <Typography variant="body2" color="textSecondary" gutterBottom>
            Advance Remaining: ₹{tenantInfo.advance_remaining.toLocaleString()}
          </Typography>
        )}

        <Typography
          variant="body2"
          sx={hasDues ? {
            color: '#b71c1c',
            backgroundColor: '#ffebee',
            fontWeight: 'bold',
            px: 1.5,
            py: 0.5,
            borderRadius: 2,
            display: 'inline-block',
          } : {
            color: 'text.secondary',
          }}
          gutterBottom
        >
          Total Due: ₹{(tenantInfo.total_due || 0).toLocaleString()}
        </Typography>

        <Typography variant="body2" color="textSecondary" gutterBottom>
          Agreement Status: {tenantInfo.agreement_status}
        </Typography>

        <Box sx={{ display: 'flex', gap: 1, mt: 1, flexDirection: 'column' }}>
          <Button
            variant="outlined"
            size="small"
            onClick={() => handleMobileDialogOpen(tenant)}
            fullWidth
          >
            View Details
          </Button>
          <Button
            variant="contained"
            color={hasDues ? "error" : "success"}
            startIcon={hasDues ? <WhatsAppIcon /> : <WhatsAppIcon />}
            size="small"
            onClick={() => handleWhatsAppNotification(tenant, hasDues ? 'dues' : 'noc')}
            disabled={!canSend}
            fullWidth
          >
            {!canSend ? "Cannot Send" : (hasDues ? "Send Dues Reminder" : "Send NOC")}
          </Button>
        </Box>
      </Card>
    );
  };

  // Common table row for desktop view
  const renderTableRow = (tenant: ApiTenantData) => {
    const { tenant: tenantInfo } = tenant;
    const hasDues = tenantInfo.total_due && tenantInfo.total_due > 0;
    const canSend = canSendWhatsApp(tenant);

    return (
      <TableRow key={tenant.shop_no}>
        <TableCell>
          <Tooltip
            title={getDuesTooltip(tenant)}
            arrow
            placement="right"
            enterDelay={300}
          >
            <span style={{ cursor: "pointer", textDecoration: "underline", color: "#1976d2" }}>
              {tenantInfo.tenant_name}
            </span>
          </Tooltip>
        </TableCell>
        <TableCell>{tenant.shop_no}</TableCell>
        <TableCell align="right">₹{tenantInfo.monthly_rent.toLocaleString()}</TableCell>
        <TableCell>
          <Chip
            label={tenantInfo.status}
            color={tenantInfo.status === "Active" ? "success" : "default"}
            size="small"
          />
        </TableCell>
        <TableCell>{tenantInfo.mobile_number}</TableCell>
        <TableCell align="right">₹{(tenantInfo.advance_paid || 0).toLocaleString()}</TableCell>
        <TableCell align="right">₹{(tenantInfo.advance_remaining || 0).toLocaleString()}</TableCell>
        <TableCell
          align="right"
          sx={hasDues ? {
            color: '#b71c1c',
            backgroundColor: '#ffebee',
            fontWeight: 'bold',
            px: 1.5,
            py: 0.5,
            borderRadius: 2,
            minWidth: 110,
          } : {}}
        >
          ₹{(tenantInfo.total_due || 0).toLocaleString()}
        </TableCell>
        <TableCell>{tenantInfo.agreement_status}</TableCell>
        <TableCell align="center">
          <Tooltip title={
            !canSend
              ? (tenantInfo.status !== 'Active' ? "Cannot send: Tenant is inactive" : "Cannot send: Mobile number missing")
              : (hasDues ? "Send dues reminder" : "Send NOC message")
          }>
            <span>
              <IconButton
                color={hasDues ? "error" : "success"}
                size="small"
                onClick={() => handleWhatsAppNotification(tenant, hasDues ? 'dues' : 'noc')}
                disabled={!canSend}
              >
                {hasDues ? <WhatsAppIcon /> : <WhatsAppIcon />}
              </IconButton>
            </span>
          </Tooltip>
        </TableCell>
      </TableRow>
    );
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 4 }}>
        <CircularProgress />
        <Typography variant="body1" sx={{ ml: 2 }}>
          Loading tenant data...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button
          variant="outlined"
          onClick={() => window.location.reload()}
        >
          Retry
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
          <Typography variant={isMobile ? "h5" : "h4"}>Tenant Management</Typography>
          <Typography variant="body2" color="textSecondary">
            Showing: {filteredStats.filteredCount} of {allTenantStats.totalCount}
          </Typography>
        </Box>

        <Box sx={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(6, 1fr)',
          gap: 2,
          p: 2,
          backgroundColor: 'grey.50',
          borderRadius: 2,
          border: '1px solid',
          borderColor: 'grey.200'
        }}>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h6" color="textSecondary">
              {allTenantStats.totalCount}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Total Tenants
            </Typography>
          </Box>

          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h6" color="success.main">
              {allTenantStats.activeCount}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Active
            </Typography>
          </Box>

          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h6" color="text.secondary">
              {allTenantStats.inactiveCount}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Inactive
            </Typography>
          </Box>

          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h6" color="primary.main">
              ₹{filteredStats.totalAdvance.toLocaleString()}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Total Advance
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h6" color="primary.main">
              ₹{filteredStats.advanceRemaining.toLocaleString()}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Advance Remaining
            </Typography>
          </Box>

          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h6" color="error.main">
              ₹{filteredStats.totalDues.toLocaleString()}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Total Dues
            </Typography>
          </Box>
        </Box>
      </Box>

      <Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
        <TextField
          placeholder="Search by name, shop number, or mobile..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          sx={{ minWidth: 300, maxWidth: 400 }}
        />

        <FormControl sx={{ minWidth: 120 }}>
          <InputLabel>Status</InputLabel>
          <Select
            value={statusFilter}
            label="Status"
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <MenuItem value="All">All</MenuItem>
            <MenuItem value="Active">Active</MenuItem>
            <MenuItem value="Inactive">Inactive</MenuItem>
          </Select>
        </FormControl>

        {showBulkOption && <FormControl sx={{ minWidth: 140 }}>
          <InputLabel>Message Type</InputLabel>
          <Select
            value={bulkMessageType}
            label="Message Type"
            onChange={(e) => setBulkMessageType(e.target.value as 'dues' | 'noc')}
          >
            <MenuItem value="dues">Dues Reminder</MenuItem>
            <MenuItem value="noc">NOC Message</MenuItem>
          </Select>
        </FormControl>}

        {showBulkOption && <Button
          variant="contained"
          color="primary"
          startIcon={<SendIcon />}
          onClick={handleBulkWhatsAppNotification}
          sx={{ minWidth: 160 }}
        >
          Send Bulk Messages
        </Button>}
      </Box>

      <Card>
        <CardContent sx={{ p: isMobile ? 1 : 2 }}>
          {filteredAndSortedData.length === 0 ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 4 }}>
              <Typography variant="body1" color="textSecondary">
                {searchTerm ? 'No tenants found matching your search.' : 'No tenant data available.'}
              </Typography>
            </Box>
          ) : isMobile ? (
            <Grid container spacing={2}>
              {filteredAndSortedData.map((tenant) => (
                <Grid item xs={12} key={tenant.shop_no}>
                  {renderMobileCard(tenant)}
                </Grid>
              ))}
            </Grid>
          ) : (
            <TableContainer component={Paper}>
              <Table size={isTablet ? "small" : "medium"}>
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Shop Number</TableCell>
                    <TableCell align="right">Monthly Rent</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Mobile</TableCell>
                    <TableCell align="right">Advance Paid</TableCell>
                    <TableCell align="right">Advance Remaining</TableCell>
                    <TableCell align="right">Total Due</TableCell>
                    <TableCell>Agreement Status</TableCell>
                    <TableCell align="center">Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredAndSortedData.map((tenant) =>
                    renderTableRow(tenant)
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      <Popover
        id={popoverAnchorEl ? 'dues-popover' : undefined}
        open={Boolean(popoverAnchorEl)}
        anchorEl={popoverAnchorEl}
        onClose={handlePopoverClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'center',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'center',
        }}
      >
        {popoverTenant && (
          <Box sx={{ p: 2, position: 'relative', minWidth: 250, maxWidth: 320 }}>
            <IconButton
              aria-label="close"
              onClick={handlePopoverClose}
              sx={{ position: 'absolute', right: 4, top: 4, color: (theme) => theme.palette.grey[500] }}
            >
              <CloseIcon />
            </IconButton>
            {getDuesTooltip(popoverTenant)}
          </Box>
        )}
      </Popover>

      {/* Mobile Dialog for detailed view */}
      <Dialog
        open={mobileDialogOpen}
        onClose={handleMobileDialogClose}
        maxWidth="sm"
        fullWidth
        fullScreen={isMobile}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">Tenant Details</Typography>
          <IconButton
            aria-label="close"
            onClick={handleMobileDialogClose}
            sx={{ color: (theme) => theme.palette.grey[500] }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {selectedTenantForMobile && (
            <Box sx={{ pt: 1 }}>
              {getDuesTooltip(selectedTenantForMobile)}
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ flexDirection: 'column', gap: 1 }}>
          {selectedTenantForMobile && (
            <Button
              variant="contained"
              color={selectedTenantForMobile.tenant.total_due && selectedTenantForMobile.tenant.total_due > 0 ? "error" : "success"}
              startIcon={selectedTenantForMobile.tenant.total_due && selectedTenantForMobile.tenant.total_due > 0 ? <WhatsAppIcon /> : <WhatsAppIcon />}
              onClick={() => {
                const hasDues = selectedTenantForMobile.tenant.total_due && selectedTenantForMobile.tenant.total_due > 0;
                handleWhatsAppNotification(selectedTenantForMobile, hasDues ? 'dues' : 'noc');
                handleMobileDialogClose();
              }}
              disabled={!canSendWhatsApp(selectedTenantForMobile)}
              fullWidth
            >
              {!canSendWhatsApp(selectedTenantForMobile)
                ? "Cannot Send"
                : (selectedTenantForMobile.tenant.total_due && selectedTenantForMobile.tenant.total_due > 0 ? "Send Dues Reminder" : "Send NOC")
              }
            </Button>
          )}
          <Button onClick={handleMobileDialogClose} variant="outlined" fullWidth>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TenantManagement;

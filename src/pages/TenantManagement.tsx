import React, { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
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
  IconButton,
} from '@mui/material';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';

import { useRentContext } from "../context/RentContext";
import { ShopData, RentManagementData, YearData, MonthlyData } from "../types";

// Utility function to encode text for WhatsApp URL
const encodeWhatsAppText = (text: string): string => {
  return encodeURIComponent(text); // Only encode, do not replace newlines
};

// Utility function to get dues information
const getDuesInfo = (shopNumber: string, data: RentManagementData) => {
  let totalPendingMonths = 0;
  let totalDueAmount = 0;
  const yearBreakdown: Record<string, { months: string[]; amount: number }> = {};
  
  Object.entries(data.years).forEach(([year, yearData]) => {
    const yd = yearData as YearData;
    const shop = yd.shops[shopNumber];
    if (shop && shop.monthlyData) {
      const months: string[] = [];
      let yearDue = 0;
      Object.entries(shop.monthlyData).forEach(([month, mdata]) => {
        const md = mdata as MonthlyData;
        const totalPaid = (md.paid || 0) + (md.advanceUsed || 0);
        const monthlyRent = md.rent || 0;
        const monthlyDue = monthlyRent - totalPaid;
        
        if (monthlyDue > 0) {
          months.push(month);
          yearDue += monthlyDue;
        }
      });
      if (months.length) {
        yearBreakdown[year] = { months, amount: yearDue };
        totalPendingMonths += months.length;
        totalDueAmount += yearDue;
      }
    }
  });
  
  return { totalPendingMonths, totalDueAmount, yearBreakdown };
};

// Utility function to format pending months for WhatsApp message
const formatPendingMonths = (yearBreakdown: Record<string, { months: string[]; amount: number }>): string => {
  // Flatten to [Month(Year), ...]
  const all: string[] = [];
  Object.entries(yearBreakdown).forEach(([year, info]) => {
    info.months.forEach(month => {
      all.push(`${month}(${year})`);
    });
  });
  return all.join(', ');
};

// Utility function to generate WhatsApp message
const generateWhatsAppMessage = (tenantName: string, totalDueAmount: number, yearBreakdown: Record<string, { months: string[]; amount: number }>): string => {
  const pendingMonthsText = formatPendingMonths(yearBreakdown);
  
  return `Hello,

The following tenant has pending dues:

• Name: ${tenantName}
• Total Due: ₹${totalDueAmount.toLocaleString()}
• Pending Months: ${pendingMonthsText}

Please take necessary action.

Thank you!`;
};

// Utility function to get WhatsApp URL
const getWhatsAppUrl = (message: string): string => {
  const encodedMessage = encodeWhatsAppText(message);
  return `https://wa.me/918797247279?text=${encodedMessage}`;
};

const TenantManagement: React.FC = () => {
  const { state } = useRentContext();
  const { data } = state;
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const isTablet = useMediaQuery(theme.breakpoints.down("lg"));

  // Memoized data processing
  const years = useMemo(() => Object.keys(data.years).sort().reverse(), [data.years]);
  const defaultYear = useMemo(() => {
    const currentYear = new Date().getFullYear().toString();
    return years.includes(currentYear) ? currentYear : years[0];
  }, [years]);
  
  const [selectedYear, setSelectedYear] = useState<string>(defaultYear);
  const shops = data.years[selectedYear]?.shops || {};

  // Advance remaining calculation
  const getAdvanceRemaining = (shopNumber: string, shop: ShopData): number => {
    const transactions = Array.isArray(data.advanceTransactions[shopNumber])
      ? data.advanceTransactions[shopNumber]
      : [];
    if (!shop || typeof shop.advanceAmount !== "number") return 0;
    const totalAdvanceDeducted = transactions
      .filter((t: any) => t.type === "Advance Deduction")
      .reduce((acc: number, t: any) => acc + t.amount, 0);
    return shop.advanceAmount - totalAdvanceDeducted;
  };

  // Dues tooltip content
  const getDuesTooltip = (shopNumber: string, shop: ShopData) => {
    const { totalPendingMonths, totalDueAmount, yearBreakdown } = getDuesInfo(shopNumber, data);
    
    return (
      <Box>
        <Typography variant="subtitle2">{shop.tenant.name}</Typography>
        <Typography variant="body2">
          Pending Months: <b>{totalPendingMonths}</b>
        </Typography>
        <Typography variant="body2">
          Total Due: <b>₹{totalDueAmount.toLocaleString()}</b>
        </Typography>
        {Object.entries(yearBreakdown).map(([year, info]) => (
          <Box key={year} sx={{ mt: 1 }}>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {year}:
            </Typography>
            <Typography variant="body2" sx={{ ml: 1 }}>
              {info.months.join(", ")}
              {info.amount > 0 && ` (₹${info.amount.toLocaleString()})`}
            </Typography>
          </Box>
        ))}
      </Box>
    );
  };

  // Handle WhatsApp notification
  const handleWhatsAppNotification = (shopNumber: string, shop: ShopData) => {
    const { totalDueAmount, yearBreakdown } = getDuesInfo(shopNumber, data);
    const message = generateWhatsAppMessage(shop.tenant.name, totalDueAmount, yearBreakdown);
    const whatsappUrl = getWhatsAppUrl(message);
    window.open(whatsappUrl, '_blank');
  };

  // Common card content for mobile view
  const renderMobileCard = (shopNumber: string, shop: ShopData) => {
    const advanceRemaining = getAdvanceRemaining(shopNumber, shop);
    const { totalDueAmount } = getDuesInfo(shopNumber, data);
    const hasDues = totalDueAmount > 0;

    return (
      <Card variant="outlined" sx={{ p: 2 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 1 }}>
          <Typography variant="h6">{shop.tenant.name}</Typography>
          <Chip
            label={shop.tenant.status}
            color={shop.tenant.status === "Active" ? "success" : "default"}
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
          Pending Dues: ₹{totalDueAmount.toLocaleString()}
        </Typography>
        
        <Typography variant="body2" color="textSecondary" gutterBottom>
          Agreement: {new Date(shop.tenant.agreementDate).toLocaleDateString()}
        </Typography>

        {hasDues && (
          <Button
            variant="contained"
            color="success"
            startIcon={<WhatsAppIcon />}
            size="small"
            onClick={() => handleWhatsAppNotification(shopNumber, shop)}
            sx={{ mt: 1 }}
            fullWidth
          >
            Send WhatsApp
          </Button>
        )}
      </Card>
    );
  };

  // Common table row for desktop view
  const renderTableRow = (shopNumber: string, shop: ShopData) => {
    const advanceRemaining = getAdvanceRemaining(shopNumber, shop);
    const { totalDueAmount } = getDuesInfo(shopNumber, data);
    const hasDues = totalDueAmount > 0;

    return (
      <TableRow key={shopNumber}>
        <TableCell>
          <Tooltip
            title={getDuesTooltip(shopNumber, shop)}
            arrow
            placement="right"
            enterDelay={300}
          >
            <span style={{ cursor: "pointer", textDecoration: "underline", color: "#1976d2" }}>
              {shop.tenant.name}
            </span>
          </Tooltip>
        </TableCell>
        <TableCell>{shopNumber}</TableCell>
        <TableCell align="right">₹{shop.rentAmount.toLocaleString()}</TableCell>
        <TableCell>
          <Chip
            label={shop.tenant.status}
            color={shop.tenant.status === "Active" ? "success" : "default"}
            size="small"
          />
        </TableCell>
        <TableCell>{shop.tenant.phoneNumber}</TableCell>
        <TableCell align="right">₹{shop.advanceAmount.toLocaleString()}</TableCell>
        <TableCell align="right">₹{advanceRemaining.toLocaleString()}</TableCell>
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
          ₹{totalDueAmount.toLocaleString()}
        </TableCell>
        <TableCell>
          {new Date(shop.tenant.agreementDate).toLocaleDateString()}
        </TableCell>
        <TableCell align="center">
          {hasDues && (
            <Tooltip title="Send WhatsApp notification">
              <IconButton
                color="success"
                size="small"
                onClick={() => handleWhatsAppNotification(shopNumber, shop)}
              >
                <WhatsAppIcon />
              </IconButton>
            </Tooltip>
          )}
        </TableCell>
      </TableRow>
    );
  };

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap" }}>
          <Typography variant={isMobile ? "h5" : "h4"}>Tenant Management</Typography>
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
      </Box>

      <Card>
        <CardContent sx={{ p: isMobile ? 1 : 2 }}>
          {isMobile ? (
            <Grid container spacing={2}>
              {Object.entries(shops).map(([shopNumber, shopData]) => (
                <Grid item xs={12} key={shopNumber}>
                  {renderMobileCard(shopNumber, shopData as ShopData)}
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
                    <TableCell align="right">Rent Amount</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Mobile</TableCell>
                    <TableCell align="right">Advance</TableCell>
                    <TableCell align="right">Advance Remaining</TableCell>
                    <TableCell align="right">Pending Dues</TableCell>
                    <TableCell>Agreement Date</TableCell>
                    <TableCell align="center">Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {Object.entries(shops).map(([shopNumber, shopData]) => 
                    renderTableRow(shopNumber, shopData as ShopData)
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default TenantManagement;
import React, { useState, useMemo, useEffect } from 'react';
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
  Popover,
  IconButton,
  CircularProgress,
} from '@mui/material';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import CloseIcon from '@mui/icons-material/Close';

import { useRentContext } from "../context/RentContext";
import { ShopData, RentManagementData, YearData, MonthlyData } from "../types";
import { getDuesInfo, calculateTotalDues } from "../utils/duesCalculator";

// Utility function to encode text for WhatsApp URL
const encodeWhatsAppText = (text: string): string => {
  return encodeURIComponent(text); // Only encode, do not replace newlines
};



// Utility function to format pending months for WhatsApp message
const formatPendingMonths = (yearBreakdown: Record<string, { months: string[]; amount: number }>): string => {
  return Object.entries(yearBreakdown)
    .map(([year, info]) => {
      if (info.months.length === 0) return '';
      // The amount per year is not available with the new data structure, so it's omitted.
      return `${year}: ${info.months.join(', ')}`;
    })
    .filter(Boolean)
    .join('\n');
};

// Utility function to generate WhatsApp message
const generateWhatsAppMessage = (
  tenantName: string,
  totalDueAmount: number,
  yearBreakdown: Record<string, { months: string[]; amount: number }>
): string => {
  const pendingMonthsText = formatPendingMonths(yearBreakdown);

  let message = `नमस्ते ${tenantName},\n• आपकी कुल बकाया राशि: ₹${totalDueAmount.toLocaleString()}\n• बकाया महीने:\n${pendingMonthsText}`;

  message += `\n\nकृपया जल्द से जल्द बकाया राशि का भुगतान करें।\n\nधन्यवाद!`;

  return message;
};


// Utility function to get WhatsApp URL
const getWhatsAppUrl = (message: string): string => {
  const encodedMessage = encodeWhatsAppText(message);
  return `https://wa.me/918797247279?text=${encodedMessage}`;
};

const TenantManagement: React.FC = () => {
  const { state, fetchYearData, isYearLoading } = useRentContext();
  const { data, error } = state;
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const isTablet = useMediaQuery(theme.breakpoints.down("lg"));

  // Available years to fetch (2019 to current year)
  const availableYears = useMemo(() => {
    const years = [];
    for (let year = 2019; year <= new Date().getFullYear(); year++) {
      years.push(year.toString());
    }
    return years.sort().reverse();
  }, []);

  // Memoized data processing
  const loadedYears = useMemo(() => Object.keys(data.years).sort().reverse(), [data.years]);
  const defaultYear = useMemo(() => {
    const currentYear = new Date().getFullYear().toString(); // Use actual current year
    return loadedYears.includes(currentYear) ? currentYear : loadedYears[0] || currentYear;
  }, [loadedYears]);
  
  const [selectedYear, setSelectedYear] = useState<string>(defaultYear);
  const shops = data.years[selectedYear]?.shops || {};

  // Parse shop number for sorting
  const parseShopNumber = (shopNum: string) => {
    const match = shopNum.match(/^(\d+)(?:-(\w+))?$/);
    return {
      number: match ? parseInt(match[1], 10) : 0,
      suffix: match?.[2] || ''
    };
  };

  // Sort shops by shop number
  const sortedShops = Object.entries(shops).sort(([shopNumberA], [shopNumberB]) => {
    const shopA = parseShopNumber(shopNumberA);
    const shopB = parseShopNumber(shopNumberB);

    if (shopA.number !== shopB.number) {
      return shopA.number - shopB.number;
    }

    return shopA.suffix.localeCompare(shopB.suffix);
  });

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

  // Pre-calculate all derived data for shops to avoid re-computation
  const shopsWithDetails = useMemo(() => {
    return sortedShops.map(([shopNumber, shop]) => {
      const duesInfo = getDuesInfo(shopNumber, data, selectedYear);
      const advanceRemaining = getAdvanceRemaining(shopNumber, shop);
      return { shopNumber, shop, duesInfo, advanceRemaining };
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortedShops, data, selectedYear]);

  type ShopWithDetails = (typeof shopsWithDetails)[0];

  const [popoverAnchorEl, setPopoverAnchorEl] = useState<HTMLElement | null>(null);
  const [popoverShopDetails, setPopoverShopDetails] = useState<ShopWithDetails | null>(null);

  // Fetch year data when selected year changes
  useEffect(() => {
    if (selectedYear && !data.years[selectedYear] && !isYearLoading(selectedYear)) {
      fetchYearData(selectedYear);
    }
  }, [selectedYear, data.years, fetchYearData, isYearLoading]);

  const handlePopoverOpen = (event: React.MouseEvent<HTMLElement>, shopDetails: ShopWithDetails) => {
    setPopoverAnchorEl(event.currentTarget);
    setPopoverShopDetails(shopDetails);
  };

  const handlePopoverClose = () => {
    setPopoverAnchorEl(null);
    setPopoverShopDetails(null);
  };

  // Dues tooltip content
  const getDuesTooltip = (shop: ShopData, duesInfo: ShopWithDetails['duesInfo']) => {
    const { totalPendingMonths, totalDueAmount, yearBreakdown } = duesInfo;
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
          info.months.length > 0 && (
            <Box key={year} sx={{ mt: 1 }}>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>{year}:</Typography>
              <Typography variant="body2" sx={{ ml: 1 }}>
                {info.months.join(', ')}
              </Typography>
            </Box>
          )
        ))}
      </Box>
    );
  };

  // Handle WhatsApp notification
  const handleWhatsAppNotification = (shop: ShopData, duesInfo: ShopWithDetails['duesInfo']) => {
    const { totalDueAmount, yearBreakdown } = duesInfo;
    const message = generateWhatsAppMessage(shop.tenant.name, totalDueAmount, yearBreakdown);
    const whatsappUrl = getWhatsAppUrl(message);
    window.open(whatsappUrl, '_blank');
  };

  // Common card content for mobile view
  const renderMobileCard = (shopDetails: ShopWithDetails) => {
    const { shopNumber, shop, duesInfo, advanceRemaining } = shopDetails;
    const { totalDueAmount } = duesInfo;
    const hasDues = totalDueAmount > 0;

    return (
      <Card variant="outlined" sx={{ p: 2 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 1 }}>
          <Typography
            variant="h6"
            onClick={(e) => handlePopoverOpen(e, shopDetails)}
            sx={{ cursor: 'pointer', textDecoration: 'underline', color: '#1976d2' }}
          >
            {shop.tenant.name}
          </Typography>
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
            onClick={() => handleWhatsAppNotification(shop, duesInfo)}
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
  const renderTableRow = (shopDetails: ShopWithDetails) => {
    const { shopNumber, shop, duesInfo, advanceRemaining } = shopDetails;
    const { totalDueAmount } = duesInfo;
    const hasDues = totalDueAmount > 0;

    return (
      <TableRow key={shopNumber}>
        <TableCell>
          <Tooltip
            title={getDuesTooltip(shop, duesInfo)}
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
                onClick={() => handleWhatsAppNotification(shop, duesInfo)}
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
              {availableYears.map((year) => (
                <MenuItem key={year} value={year}>
                  {year} {loadedYears.includes(year) ? '(Loaded)' : ''}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      </Box>

      <Card>
        <CardContent sx={{ p: isMobile ? 1 : 2 }}>
          {isYearLoading(selectedYear) ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 4 }}>
              <CircularProgress />
              <Typography variant="body1" sx={{ ml: 2 }}>
                Loading {selectedYear} data...
              </Typography>
            </Box>
          ) : error && error.includes(selectedYear) ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 4 }}>
              <Typography variant="body1" color="error" sx={{ textAlign: 'center' }}>
                {error}
                <br />
                <Button 
                  variant="outlined" 
                  onClick={() => fetchYearData(selectedYear)}
                  sx={{ mt: 2 }}
                >
                  Retry
                </Button>
              </Typography>
            </Box>
          ) : Object.keys(shops).length === 0 ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 4 }}>
              <Typography variant="body1" color="textSecondary">
                No tenant data available for {selectedYear}
              </Typography>
            </Box>
          ) : isMobile ? (
            <Grid container spacing={2}>
              {shopsWithDetails.map((details) => (
                <Grid item xs={12} key={details.shopNumber}>
                  {renderMobileCard(details)}
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
                  {shopsWithDetails.map((details) => 
                    renderTableRow(details)
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
        {popoverShopDetails && (
          <Box sx={{ p: 2, position: 'relative', minWidth: 250, maxWidth: 320 }}>
            <IconButton
              aria-label="close"
              onClick={handlePopoverClose}
              sx={{ position: 'absolute', right: 4, top: 4, color: (theme) => theme.palette.grey[500] }}
            >
              <CloseIcon />
            </IconButton>
            {getDuesTooltip(popoverShopDetails.shop, popoverShopDetails.duesInfo)}
          </Box>
        )}
      </Popover>
    </Box>
  );
};

export default TenantManagement;
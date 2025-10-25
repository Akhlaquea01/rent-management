import React, { useState } from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  useTheme,
  useMediaQuery,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
} from '@mui/material';
import {
  People as PeopleIcon,
  Payment as PaymentIcon,
  Warning as WarningIcon,
  AccountBalance as AccountBalanceIcon,
  FileDownload as FileDownloadIcon,
} from '@mui/icons-material';
import { useRentContext } from "../context/RentContext";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import CollectionGraphs from "../components/CollectionGraphs";



const StatCard: React.FC<{
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  subtitle?: string;
}> = ({ title, value, icon, color, subtitle }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  return (
    <Card sx={{ height: "100%" }}>
      <CardContent sx={{ p: isMobile ? 1.5 : 2 }}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Box>
            <Typography
              color="textSecondary"
              gutterBottom
              variant={isMobile ? "caption" : "body2"}
            >
              {title}
            </Typography>
            <Typography
              variant={isMobile ? "h6" : "h4"}
              component="div"
              sx={{ fontWeight: "bold" }}
            >
              {value}
            </Typography>
            {subtitle && (
              <Typography
                variant={isMobile ? "caption" : "body2"}
                color="textSecondary"
              >
                {subtitle}
              </Typography>
            )}
          </Box>
          <Box
            sx={{
              backgroundColor: color,
              borderRadius: "50%",
              p: isMobile ? 0.5 : 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {React.cloneElement(icon as React.ReactElement, {
              sx: { fontSize: isMobile ? 20 : 24, color: "white" },
            })}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

const Dashboard: React.FC = () => {
  const { state, fetchYearData, isYearLoading } = useRentContext();
  const { data, loading, error } = state;

  // Available years to fetch (2019 to current year)
  const availableYears = React.useMemo(() => {
    const years = [];
    for (let year = 2019; year <= new Date().getFullYear(); year++) {
      years.push(year.toString());
    }
    return years.sort().reverse();
  }, []);

  const loadedYears = data && data.years ? Object.keys(data.years).sort().reverse() : [];
  const defaultYear = loadedYears.includes(new Date().getFullYear().toString())
    ? new Date().getFullYear().toString()
    : loadedYears[0] || new Date().getFullYear().toString();
  const [selectedYear, setSelectedYear] = useState<string>(defaultYear);
  const [showInactiveShops, setShowInactiveShops] = useState<boolean>(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  // Fetch year data when selected year changes
  React.useEffect(() => {
    if (selectedYear && !data.years[selectedYear] && !isYearLoading(selectedYear)) {
      fetchYearData(selectedYear);
    }
  }, [selectedYear, data.years, fetchYearData, isYearLoading]);



  if (loading && loadedYears.length === 0) return <div>Loading...</div>;
  if (error && error.includes(selectedYear)) return <div style={{ color: "red" }}>{error}</div>;
  if (!data || !data.years) return <div>No data available.</div>;
  const shops = data.years[selectedYear]?.shops || {};

  // Compute dashboard stats from new data structure
  const shopsArray = Object.entries(shops).map(
    ([shopNumber, shop]: [string, any]) => ({
      shopNumber,
      ...shop,
      totalDues: shop.previousYearDues?.totalDues || 0,
    })
  );

  const totalShops = shopsArray.length;
  const activeShops = shopsArray.filter(
    (shop: any) => shop.tenant.status === "Active"
  ).length;
  const inactiveShops = totalShops - activeShops;

  const totalRentCollected = shopsArray.reduce((sum: number, shop: any) => {
    const monthlyData = shop.monthlyData || {};
    return sum + (Object.values(monthlyData) as any[]).reduce(
      (monthSum: number, month: any) => monthSum + (Number(month.paid) || 0),
      0
    );
  }, 0);

  const totalDues = shopsArray.reduce(
    (sum: number, shop: any) => sum + (shop.previousYearDues?.totalDues || 0),
    0
  );

  const totalAdvance = shopsArray.reduce((sum: number, shop: any) => {
    return sum + (shop.advanceAmount || 0);
  }, 0);

  const stats = {
    totalShops,
    activeShops,
    inactiveShops,
    totalRentCollected,
    totalDues,
    totalAdvance,
  };



  const overdueShops = shopsArray
    .filter((shop: any) => {
      const hasDues = shop.totalDues > 0;
      const isActive = shop.tenant.status === "Active";
      const isInactive = shop.tenant.status !== "Active";
      
      if (showInactiveShops) {
        return hasDues; // Show both active and inactive shops with dues
      } else {
        return hasDues && isActive; // Show only active shops with dues
      }
    })
    .sort(
      (a: any, b: any) => b.totalDues - a.totalDues
    );

  return (
    <Box>
      <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
        <Typography variant="h4" gutterBottom sx={{ mb: 0 }}>
          Dashboard Overview
        </Typography>
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

      {/* Statistics Cards */}
      <Grid container spacing={isMobile ? 2 : 3} sx={{ mb: 4, width: "100%" }}>
        <Grid item xs={12} sm={6} md={3} sx={{ minWidth: 0 }}>
          <StatCard
            title="Total Shops"
            value={stats.totalShops}
            icon={<PeopleIcon sx={{ color: "white" }} />}
            color="#1976d2"
            subtitle={`${stats.activeShops} Active, ${stats.inactiveShops} Inactive`}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3} sx={{ minWidth: 0 }}>
          <StatCard
            title="Rent Collected"
            value={`₹${stats.totalRentCollected.toLocaleString()}`}
            icon={<PaymentIcon sx={{ color: "white" }} />}
            color="#2e7d32"
            subtitle="Total collected this year"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3} sx={{ minWidth: 0 }}>
          <StatCard
            title="Total Dues"
            value={`₹${stats.totalDues.toLocaleString()}`}
            icon={<WarningIcon sx={{ color: "white" }} />}
            color="#ed6c02"
            subtitle="Pending payments"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3} sx={{ minWidth: 0 }}>
          <StatCard
            title="Advance Balance"
            value={`₹${stats.totalAdvance.toLocaleString()}`}
            icon={<AccountBalanceIcon sx={{ color: "white" }} />}
            color="#9c27b0"
            subtitle="Total advance deposits"
          />
        </Grid>
      </Grid>

      {/* Collection Analytics and Overdue Tenants */}
      <Grid container spacing={isMobile ? 2 : 3}>
        <Grid item xs={12} sx={{ width: "100%" }}>
          <CollectionGraphs shopsArray={shopsArray} selectedYear={selectedYear} />
        </Grid>

        <Grid item xs={12} sx={{ width: "100%" }}>
          <Card>
            <CardContent>
              <Typography
                variant="h6"
                gutterBottom
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <span>Shops with Dues ({overdueShops.length})</span>
                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={showInactiveShops}
                        onChange={(e) => setShowInactiveShops(e.target.checked)}
                        size="small"
                      />
                    }
                    label="Include Inactive"
                    sx={{ fontSize: "0.875rem" }}
                  />
                  <FileDownloadIcon
                    sx={{ cursor: "pointer", ml: 1 }}
                    titleAccess="Export to PDF"
                    onClick={async () => {
                      try {
                        // Create paginated HTML tables with proper page breaks
                        const createPaginatedHTMLTables = () => {
                          const rowsPerPage = 25; // Adjust based on your needs
                          const totalPages = Math.ceil(overdueShops.length / rowsPerPage);
                          const tables = [];

                          for (let page = 0; page < totalPages; page++) {
                            const startIndex = page * rowsPerPage;
                            const endIndex = Math.min(startIndex + rowsPerPage, overdueShops.length);
                            const pageShops = overdueShops.slice(startIndex, endIndex);

                            const tableHTML = `
                              <div style="font-family: Arial, sans-serif; padding: 20px; background: white; page-break-after: ${page < totalPages - 1 ? 'always' : 'avoid'};">
                                <h2 style="text-align: center; margin-bottom: 10px; font-size: 18px; font-weight: bold;">
                                  Shops with Dues Report - ${selectedYear} | (Page ${page + 1} of ${totalPages})
                                </h2>
                                <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
                                  <thead>
                                    <tr style="background-color: #1976d2; color: white;">
                                      <th style="border: 1px solid #000; padding: 8px; text-align: center;">Name</th>
                                      <th style="border: 1px solid #000; padding: 8px; text-align: center;">Shop</th>
                                      ${showInactiveShops ? '<th style="border: 1px solid #000; padding: 8px; text-align: center;">Status</th>' : ''}
                                      <th style="border: 1px solid #000; padding: 8px; text-align: right;">Due Amount</th>
                                      <th style="border: 1px solid #000; padding: 8px; text-align: center;">Due Months</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    ${pageShops.map((shop: any, index: number) => {
                                      const previousYearDueMonths = shop.previousYearDues?.dueMonths || [];
                                      const dueMonths = previousYearDueMonths.join(", ");
                                      const rowBgColor = index % 2 === 0 ? 'background-color: #f5f5f5;' : '';
                                      
                                      return `
                                        <tr style="${rowBgColor}">
                                          <td style="border: 1px solid #000; padding: 6px; text-align: left;">${shop.tenant.tenant_name_hindi || shop.tenant.name}</td>
                                          <td style="border: 1px solid #000; padding: 6px; text-align: center;">${shop.shopNumber}</td>
                                          ${showInactiveShops ? `<td style="border: 1px solid #000; padding: 6px; text-align: center; color: ${shop.tenant.status === "Active" ? "green" : "red"}; font-weight: bold;">${shop.tenant.status}</td>` : ''}
                                          <td style="border: 1px solid #000; padding: 6px; text-align: right;">₹${shop.totalDues.toLocaleString()}</td>
                                          <td style="border: 1px solid #000; padding: 6px; text-align: center;">${dueMonths || "N/A"}</td>
                                        </tr>
                                      `;
                                    }).join('')}
                                  </tbody>
                                </table>
                                ${page === totalPages - 1 ? `
                                  <div style="margin-top: 20px; padding: 10px; background-color: #f0f0f0; border: 1px solid #ccc;">
                                    <p style="margin: 5px 0; font-weight: bold;">Summary:</p>
                                    <p style="margin: 5px 0;">Total Shops with Dues: ${overdueShops.length}</p>
                                    <p style="margin: 5px 0;">Total Due Amount: ₹${overdueShops.reduce((sum: number, shop: any) => sum + shop.totalDues, 0).toLocaleString()}</p>
                                  </div>
                                ` : ''}
                              </div>
                            `;
                            tables.push(tableHTML);
                          }

                          return tables.join('');
                        };

                        // Create temporary element
                        const tempDiv = document.createElement('div');
                        tempDiv.innerHTML = createPaginatedHTMLTables();
                        tempDiv.style.position = 'absolute';
                        tempDiv.style.left = '-9999px';
                        tempDiv.style.top = '-9999px';
                        document.body.appendChild(tempDiv);

                        try {
                          // Create PDF with proper page handling
                          const pdf = new jsPDF('portrait', 'mm', 'a4');
                          const imgWidth = 210;
                          const pageHeight = 295;
                          const margin = 10;
                          const contentWidth = imgWidth - (2 * margin);

                          // Get all page elements
                          const pageElements = tempDiv.querySelectorAll('div[style*="page-break-after"]');
                          
                          for (let i = 0; i < pageElements.length; i++) {
                            if (i > 0) {
                              pdf.addPage();
                            }

                            // Create a temporary container for this page
                            const pageContainer = document.createElement('div');
                            pageContainer.appendChild(pageElements[i].cloneNode(true));
                            pageContainer.style.position = 'absolute';
                            pageContainer.style.left = '-9999px';
                            pageContainer.style.top = '-9999px';
                            pageContainer.style.width = '210mm';
                            document.body.appendChild(pageContainer);

                            try {
                              // Capture this page as canvas
                              const canvas = await html2canvas(pageContainer, {
                                scale: 2,
                                useCORS: true,
                                allowTaint: true,
                                backgroundColor: '#ffffff',
                                width: 794, // A4 width in pixels at 96 DPI
                                height: 1123 // A4 height in pixels at 96 DPI
                              });

                              // Add image to PDF
                              const imgData = canvas.toDataURL('image/png');
                              const imgHeight = (canvas.height * imgWidth) / canvas.width;
                              
                              // Center the image on the page
                              const yOffset = (pageHeight - imgHeight) / 2;
                              pdf.addImage(imgData, 'PNG', margin, yOffset, contentWidth, imgHeight);
                            } finally {
                              // Clean up page container
                              document.body.removeChild(pageContainer);
                            }
                          }

                          // Save the PDF
                          const now = new Date();
                          const pad = (n: number) => n.toString().padStart(2, "0");
                          const timestamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}_${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`;
                          pdf.save(`ShopsWithDues_${timestamp}.pdf`);
                        } finally {
                          // Clean up
                          document.body.removeChild(tempDiv);
                        }
                      } catch (error) {
                        console.error('Error generating PDF:', error);
                        alert('Error generating PDF. Please try again.');
                      }
                    }}
                  />
                </Box>
              </Typography>
              {isMobile ? (
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                  {overdueShops.map((shop: any) => (
                    <Card
                      key={shop.shopNumber}
                      variant="outlined"
                      sx={{ p: 1 }}
                    >
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <Box>
                          <Typography variant="subtitle2">
                            {shop.tenant.name}
                          </Typography>
                          <Typography variant="body2" color="textSecondary">
                            Shop {shop.shopNumber}
                          </Typography>
                          {showInactiveShops && (
                            <Typography 
                              variant="caption" 
                              color={shop.tenant.status === "Active" ? "success.main" : "error.main"}
                              sx={{ fontWeight: "bold" }}
                            >
                              {shop.tenant.status}
                            </Typography>
                          )}
                        </Box>
                        <Box sx={{ textAlign: "right" }}>
                          <Typography
                            variant="body2"
                            color="error.main"
                            sx={{ fontWeight: "bold" }}
                          >
                            ₹{shop.totalDues.toLocaleString()}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            Due Amount
                          </Typography>
                        </Box>
                      </Box>
                    </Card>
                  ))}
                </Box>
              ) : (
                <TableContainer
                  sx={{ height: 300, overflow: "auto", width: "100%" }}
                >
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Name</TableCell>
                        <TableCell>Shop</TableCell>
                        {showInactiveShops && <TableCell>Status</TableCell>}
                        <TableCell align="right">Due Amount</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {overdueShops.map((shop: any) => (
                        <TableRow key={shop.shopNumber}>
                          <TableCell>{shop.tenant.name}</TableCell>
                          <TableCell>{shop.shopNumber}</TableCell>
                          {showInactiveShops && (
                            <TableCell>
                              <Typography
                                variant="body2"
                                color={shop.tenant.status === "Active" ? "success.main" : "error.main"}
                                sx={{ fontWeight: "bold" }}
                              >
                                {shop.tenant.status}
                              </Typography>
                            </TableCell>
                          )}
                          <TableCell align="right">
                            <Typography
                              color="error.main"
                              sx={{ fontWeight: "bold" }}
                            >
                              ₹{shop.totalDues.toLocaleString()}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;
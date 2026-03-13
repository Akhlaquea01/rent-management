import React from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  useTheme,
  useMediaQuery,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
} from '@mui/material';
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import {
  People as PeopleIcon,
  Payment as PaymentIcon,
  Warning as WarningIcon,
  AccountBalance as AccountBalanceIcon,
  FileDownload as FileDownloadIcon,
} from '@mui/icons-material';
import { useDashboardStats } from "../hooks/useDashboardStats";
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
    <Card
      sx={{
        height: "100%",
        boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
        borderLeft: `5px solid ${color}`,
        transition: "transform 0.2s",
        "&:hover": {
          transform: "translateY(-2px)",
          boxShadow: "0 6px 16px rgba(0,0,0,0.1)",
        }
      }}
    >
      <CardContent sx={{ p: isMobile ? 2 : 3 }}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            mb: 1
          }}
        >
          <Typography
            color="textSecondary"
            variant={isMobile ? "body2" : "subtitle1"}
            sx={{ fontWeight: 500 }}
          >
            {title}
          </Typography>

          <Box
            sx={{
              backgroundColor: color,
              borderRadius: "12px",
              p: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: `0 4px 8px ${color}40`,
            }}
          >
            {React.cloneElement(icon as React.ReactElement, {
              sx: { fontSize: isMobile ? 20 : 24, color: "white" },
            })}
          </Box>
        </Box>

        <Typography
          variant={isMobile ? "h5" : "h4"}
          component="div"
          sx={{ fontWeight: "bold", mb: 0.5 }}
        >
          {value}
        </Typography>

        {subtitle && (
          <Typography
            variant={isMobile ? "caption" : "body2"}
            color="textSecondary"
            sx={{ display: 'block' }}
          >
            {subtitle}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
};

const Dashboard: React.FC = () => {
  const {
    loading,
    error,
    selectedYear,
    setSelectedYear,
    availableYears,
    loadedYears,
    showInactiveShops,
    setShowInactiveShops,
    shopsArray,
    stats,
    overdueShops,
  } = useDashboardStats();

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const columns: GridColDef[] = React.useMemo(() => {
    const cols: GridColDef[] = [
      { field: 'tenantName', headerName: 'Name', flex: 1, minWidth: 150 },
      { field: 'shopNumber', headerName: 'Shop', width: 100 },
    ];

    if (showInactiveShops) {
      cols.push({
        field: 'tenantStatus',
        headerName: 'Status',
        width: 120,
        renderCell: (params: GridRenderCellParams) => (
          <Typography
            variant="body2"
            color={params.value === "Active" ? "success.main" : "error.main"}
            sx={{ fontWeight: "bold" }}
          >
            {params.value}
          </Typography>
        ),
      });
    }

    cols.push({
      field: 'totalDues',
      headerName: 'Due Amount',
      type: 'number',
      width: 150,
      renderCell: (params: GridRenderCellParams) => (
         <Typography
            variant="body2"
            color="error.main"
            sx={{ fontWeight: "bold" }}
          >
            ₹{params.value.toLocaleString()}
          </Typography>
      )
    });

     cols.push({
      field: 'dueMonths',
      headerName: 'Due Months',
      flex: 1,
      minWidth: 200,
      valueGetter: (params) => params.value?.join(', ') || '',
    });

    return cols;
  }, [showInactiveShops]);

  if (loading && loadedYears.length === 0) return <div>Loading...</div>;
  if (error && error.includes(selectedYear)) return <div style={{ color: "red" }}>{error}</div>;
  // if (shopsArray.length === 0 && !loading) return <div>No data available.</div>;

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
                <div style={{ height: 400, width: '100%' }}>
                  <DataGrid
                    rows={overdueShops}
                    columns={columns}
                    getRowId={(row) => row.shopNumber}
                    pageSize={5}
                    rowsPerPageOptions={[5, 10, 25]}
                    disableSelectionOnClick
                    density="compact"
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;
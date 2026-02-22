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
import { Download as DownloadIcon } from '@mui/icons-material';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { useRentContext } from "../context/RentContext";
import { calculateTotalDues } from "../utils/duesCalculator";

const Reports: React.FC = () => {
  const { state, fetchYearData, isYearLoading } = useRentContext();
  const { data } = state;
  const now = new Date();
  const currentYear = new Date().getFullYear(); // Use actual current year
  const currentMonth = now.getMonth(); // 0-based
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedMonth, setSelectedMonth] = useState(
    `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}`
  );

  // Available years to fetch (2019 to current year)
  const availableYears = React.useMemo(() => {
    const years = [];
    for (let year = 2019; year <= new Date().getFullYear(); year++) {
      years.push(year);
    }
    return years.sort((a, b) => b - a);
  }, []);

  // Get loaded years from data
  const loadedYears = Object.keys(data.years)
    .map(Number)
    .sort((a, b) => b - a);

  // Fetch year data for selected year and any years needed by the selected month's report
  React.useEffect(() => {
    const yearsNeeded = new Set<string>();
    if (selectedYear) yearsNeeded.add(selectedYear.toString());

    // Check if the selected month implies we need previous year's data for the report
    if (selectedMonth) {
      const currentDate = new Date(selectedMonth + "-01");
      const prev1 = new Date(currentDate);
      prev1.setMonth(currentDate.getMonth() - 1);
      yearsNeeded.add(prev1.getFullYear().toString());

      const prev2 = new Date(currentDate);
      prev2.setMonth(currentDate.getMonth() - 2);
      yearsNeeded.add(prev2.getFullYear().toString());
    }

    yearsNeeded.forEach(year => {
      if (!data.years[year] && !isYearLoading(year)) {
        fetchYearData(year);
      }
    });
  }, [selectedYear, selectedMonth, data.years, fetchYearData, isYearLoading]);

  // Get shops for selected year
  const selectedYearShops = data.years[selectedYear.toString()]?.shops || {};

  // Parse shop number for sorting
  const parseShopNumber = (shopNum: string) => {
    const match = shopNum.match(/^(\d+)(?:-(\w+))?$/);
    return {
      number: match ? parseInt(match[1], 10) : 0,
      suffix: match?.[2] || ''
    };
  };

  // Compute stats from new data structure and sort by shop number
  // Filter out inactive shops
  const shopsArray = Object.entries(selectedYearShops)
    .map(([shopNumber, shop]: [string, any]) => ({
      shopNumber,
      ...shop,
    }))
    .filter((shop: any) => shop.tenant.status === "Active") // Only include active shops
    .sort((a, b) => {
      const shopA = parseShopNumber(a.shopNumber);
      const shopB = parseShopNumber(b.shopNumber);

      if (shopA.number !== shopB.number) {
        return shopA.number - shopB.number;
      }

      return shopA.suffix.localeCompare(shopB.suffix);
    });

  const totalShops = shopsArray.length; // Now only active shops
  const activeShops = totalShops; // All shops in array are active

  const totalAdvance = shopsArray.reduce(
    (sum: number, shop: any) => sum + shop.advanceAmount,
    0
  );

  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const getMonthlyStats = () => {
    const monthName = new Date(selectedMonth + "-01").toLocaleDateString(
      "en-US",
      { month: "long" }
    );
    let totalRent = 0;
    let totalCollected = 0;
    let partialCount = 0;

    shopsArray.forEach((shop: any) => {
      const monthlyData = shop.monthlyData || {};
      const monthData = monthlyData[monthName];
      const rentAmount = monthData?.rent !== undefined ? monthData.rent : shop.rentAmount;
      const finalMonthData = monthData || { rent: rentAmount, paid: 0, status: "Pending" };
      totalRent += rentAmount;
      totalCollected += finalMonthData.paid || 0;
      if (finalMonthData.status === "Partially Paid") {
        partialCount++;
      }
    });

    const totalPending = totalRent - totalCollected;

    return {
      totalRent,
      totalCollected,
      totalPending,
      partialCount,
      collectionRate: totalRent > 0 ? (totalCollected / totalRent) * 100 : 0,
    };
  };

  const getYearlyStats = () => {
    let totalRent = 0;
    let totalCollected = 0;
    const now = new Date();
    const isCurrentYear = selectedYear === now.getFullYear();
    const monthsToInclude = isCurrentYear ? now.getMonth() + 1 : 12;

    shopsArray.forEach((shop: any) => {
      const monthlyData = shop.monthlyData || {};
      months.slice(0, monthsToInclude).forEach((month) => {
        const monthData = monthlyData[month];
        const rentAmount = monthData?.rent !== undefined ? monthData.rent : shop.rentAmount;
        const finalMonthData = monthData || {
          rent: shop.rentAmount,
          paid: 0,
        };
        totalRent += rentAmount;
        totalCollected += finalMonthData.paid || 0;
      });
    });

    const totalPending = shopsArray.reduce((sum, shop) => {
      return sum + calculateTotalDues(shop);
    }, 0);

    return {
      totalRent,
      totalCollected,
      totalPending,
      collectionRate: totalRent > 0 ? (totalCollected / totalRent) * 100 : 0,
    };
  };

  const monthlyStats = getMonthlyStats();
  const yearlyStats = getYearlyStats();

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Paid":
        return "success";
      case "Pending":
        return "warning";
      case "Partial":
        return "info";
      default:
        return "default";
    }
  };

  return (
    <Box>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Typography variant="h4">Reports & Analytics</Typography>
        <Box>
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            sx={{ mr: 1 }}
            onClick={async () => {
              // Export Monthly Report as PDF with Hindi support using html2canvas
              const monthName = new Date(
                selectedMonth + "-01"
              ).toLocaleDateString("en-US", { month: "long" });

              // Get previous month names (two months back)
              const currentDate = new Date(selectedMonth + "-01");
              const previousMonth1 = new Date(currentDate);
              previousMonth1.setMonth(currentDate.getMonth() - 1);
              const previousMonth1Name = previousMonth1.toLocaleDateString("en-US", { month: "long" });

              const previousMonth2 = new Date(currentDate);
              previousMonth2.setMonth(currentDate.getMonth() - 2);
              const previousMonth2Name = previousMonth2.toLocaleDateString("en-US", { month: "long" });

              // Create paginated HTML tables with Hindi support
              const createPaginatedHTMLTables = () => {
                const rowsPerPage = 32;
                const totalPages = Math.ceil(shopsArray.length / rowsPerPage);
                const tables = [];

                for (let page = 0; page < totalPages; page++) {
                  const startIndex = page * rowsPerPage;
                  const endIndex = Math.min(startIndex + rowsPerPage, shopsArray.length);
                  const pageShops = shopsArray.slice(startIndex, endIndex);

                  const tableHTML = `
                    <div style="font-family: 'Noto Sans Devanagari', Arial, sans-serif; padding: 20px; background: white; page-break-after: ${page < totalPages - 1 ? 'always' : 'avoid'};">
                      <h2 style="text-align: center; margin-bottom: 10px; font-size: 18px; font-weight: bold; white-space: nowrap;">
                        Monthly Rent Collection Report ${monthName} ${selectedYear} | (Page ${page + 1} of ${totalPages})
                      </h2>
                      <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
                        <thead>
                          <tr style="background-color: #4285f4; color: white;white-space: nowrap;">
                            <th style="border: 1px solid #000; padding: 8px; text-align: center;">Dues Months</th>
                            <th style="border: 1px solid #000; padding: 8px; text-align: center;">Shop Number</th>
                            <th style="border: 1px solid #000; padding: 8px; text-align: left;">Tenant Name</th>
                            <th style="border: 1px solid #000; padding: 8px; text-align: right;">Rent Amount</th>
                            <th style="border: 1px solid #000; padding: 8px; text-align: right;">${previousMonth2Name}</th>
                            <th style="border: 1px solid #000; padding: 8px; text-align: right;">${previousMonth1Name}</th>
                            <th style="border: 1px solid #000; padding: 8px; text-align: right;">${monthName}</th>
                            <th style="border: 1px solid #000; padding: 8px; text-align: center;">Date</th>
                            <th style="border: 1px solid #000; padding: 8px; text-align: center;">Signature</th>
                          </tr>
                        </thead>
                        <tbody>
                          ${pageShops.map((shop: any) => {
                    // Helper to get data for a specific date (year/month)
                    const getMonthData = (date: Date) => {
                      const year = date.getFullYear();
                      const month = date.toLocaleDateString("en-US", { month: "long" });

                      if (year === selectedYear) {
                        return shop.monthlyData?.[month];
                      } else {
                        // Try to get from previous year data
                        const prevYearShop = data.years[year]?.shops?.[shop.shopNumber];
                        return prevYearShop?.monthlyData?.[month];
                      }
                    };

                    const monthData = getMonthData(currentDate);
                    const previousMonth1Data = getMonthData(previousMonth1);
                    const previousMonth2Data = getMonthData(previousMonth2);

                    const rentAmount = monthData?.rent !== undefined ? monthData.rent : shop.rentAmount;
                    const finalMonthData = monthData || {
                      rent: shop.rentAmount,
                      paid: 0,
                      status: "Pending",
                    };

                    // Calculate due months - use previousYearDues as single source of truth
                    const dueMonths = shop.previousYearDues?.dueMonths || [];
                    const totalDues = shop.previousYearDues?.totalDues || 0;

                    // Use Hindi name for proper rendering
                    const tenantName = shop.tenant.tenant_name_hindi || shop.tenant.name || 'N/A';
                    // If totalDues is 0, duesCount should be 0 even if dueMonths array has entries
                    const duesCount = totalDues > 0 ? (dueMonths.length > 0 ? dueMonths.length : 0) : 0;
                    const rowBgColor = duesCount > 0 ? 'background-color: #ffebee;' : '';

                    return `
                              <tr style="${rowBgColor}">
                                <td style="border: 1px solid #000; padding: 6px; text-align: center;">${duesCount}</td>
                                <td style="border: 1px solid #000; padding: 6px; text-align: center;">${shop.shopNumber}</td>
                                <td style="border: 1px solid #000; padding: 6px; text-align: left; font-family: 'Noto Sans Devanagari', Arial, sans-serif;">${tenantName}</td>
                                <td style="border: 1px solid #000; padding: 6px; text-align: right;">₹${(rentAmount || 0).toLocaleString()}</td>
                                <td style="border: 1px solid #000; padding: 6px; text-align: right;">₹${(previousMonth2Data?.paid || 0).toLocaleString()}</td>
                                <td style="border: 1px solid #000; padding: 6px; text-align: right;">₹${(previousMonth1Data?.paid || 0).toLocaleString()}</td>
                                <td style="border: 1px solid #000; padding: 6px; text-align: right;">${finalMonthData.status === "Paid" ? `₹${(finalMonthData.paid || 0).toLocaleString()}` : ""}</td>
                                <td style="border: 1px solid #000; padding: 6px; text-align: center;"></td>
                                <td style="border: 1px solid #000; padding: 6px; text-align: center;"></td>
                              </tr>
                            `;
                  }).join('')}
                        </tbody>
                      </table>
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
                pdf.save(`MonthlyReport_${selectedYear}_${monthName}.pdf`);
              } catch (error) {
                console.error('Error generating PDF:', error);
                alert('Error generating PDF. Please try again.');
              } finally {
                // Clean up
                document.body.removeChild(tempDiv);
              }
            }}
          >
            Export Monthly Report
          </Button>
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={() => {
              // Export Annual Report (tabular, styled)
              const now = new Date();
              const isCurrentYear = selectedYear === now.getFullYear();
              const monthsToInclude = isCurrentYear ? now.getMonth() + 1 : 12;
              const monthCols = months.slice(0, monthsToInclude);
              const wsRows: any[] = [];
              // Header
              const header = [
                "Shop",
                "Tenant Name",
                "Rent Amount",
                "Advance Remaining",
                "Previous Year Pending Months",
                "Current Year Pending Months",
                ...monthCols,
              ];
              wsRows.push(header);
              shopsArray.forEach((shop: any) => {
                // Advance Remaining
                const transactions =
                  data.advanceTransactions[shop.shopNumber] || [];
                const advanceRemaining = transactions.reduce(
                  (acc: number, t: any) =>
                    t.type === "Deposit" ? acc + t.amount : acc - t.amount,
                  0
                );
                // Previous Year Pending Months
                // Only show pending months if totalDues > 0
                const totalDues = shop.previousYearDues?.totalDues || 0;
                let prevPending = "";

                if (totalDues > 0) {
                  // Use the array from the current shop data (which comes from JSON or valid fallback)
                  prevPending = (shop.previousYearDues?.dueMonths || []).join(", ");
                }
                // Current Year Pending Months
                const monthlyData = shop.monthlyData || {};
                // Only count months as pending if they have data AND status is not "Paid"
                // Don't count months with no data as pending
                const currPendingMonths = monthCols
                  .filter((month) => {
                    const m = monthlyData[month];
                    return m && m.status !== "Paid";
                  })
                  .join(", ");
                // Row
                const row = [
                  shop.shopNumber,
                  shop.tenant.name,
                  shop.rentAmount,
                  advanceRemaining,
                  prevPending,
                  currPendingMonths,
                  ...monthCols.map((month) => {
                    const m = monthlyData[month];
                    return m && m.status === "Paid" ? m.paid : "";
                  }),
                ];
                wsRows.push(row);
              });
              // Create worksheet
              const ws = XLSX.utils.aoa_to_sheet(wsRows);
              // Style: highlight pending months and rows with dues
              shopsArray.forEach((shop: any, i: number) => {
                const rowIdx = i + 1; // header is row 0
                const monthlyData = shop.monthlyData || {};
                // Row highlight for dues
                if (
                  calculateTotalDues(shop) > 0
                ) {
                  for (let c = 0; c < wsRows[0].length; c++) {
                    const cell = XLSX.utils.encode_cell({ r: rowIdx, c });
                    if (!ws[cell]) ws[cell] = { t: "s", v: "" };
                    ws[cell].s = { fill: { fgColor: { rgb: "FFEBEE" } } }; // light red
                  }
                }
                // Highlight pending months
                // Use same logic as currPendingMonths: only highlight months with data AND status is not "Paid"
                monthCols.forEach((month, mIdx) => {
                  const m = monthlyData[month];
                  if (m && m.status !== "Paid") {
                    const cell = XLSX.utils.encode_cell({
                      r: rowIdx,
                      c: 6 + mIdx,
                    });
                    if (!ws[cell]) ws[cell] = { t: "s", v: "" };
                    ws[cell].s = { fill: { fgColor: { rgb: "FFF9C4" } } }; // yellow
                  }
                });
              });
              // Set column widths
              ws["!cols"] = [
                { wch: 10 }, // Shop
                { wch: 24 }, // Tenant Name
                { wch: 12 }, // Rent Amount
                { wch: 16 }, // Advance Remaining
                { wch: 28 }, // Prev Year Pending
                { wch: 28 }, // Curr Year Pending
                ...monthCols.map(() => ({ wch: 10 })),
              ];
              // Create workbook and export
              const wb = XLSX.utils.book_new();
              XLSX.utils.book_append_sheet(wb, ws, "AnnualReport");
              XLSX.writeFile(wb, `AnnualReport_${selectedYear}_tabular.xlsx`);
            }}
          >
            Export Annual Report
          </Button>
        </Box>
      </Box>

      {/* Overview Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom variant="body2">
                Total Shops
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: "bold" }}>
                {totalShops}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Active Shops Only
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom variant="body2">
                Monthly Collection Rate
              </Typography>
              <Typography
                variant="h4"
                sx={{ fontWeight: "bold", color: "success.main" }}
              >
                {monthlyStats.collectionRate.toFixed(1)}%
              </Typography>
              <Typography variant="body2" color="textSecondary">
                ₹{(monthlyStats.totalCollected || 0).toLocaleString()} / ₹
                {(monthlyStats.totalRent || 0).toLocaleString()}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom variant="body2">
                Yearly Collection Rate
              </Typography>
              <Typography
                variant="h4"
                sx={{ fontWeight: "bold", color: "primary.main" }}
              >
                {yearlyStats.collectionRate.toFixed(1)}%
              </Typography>
              <Typography variant="body2" color="textSecondary">
                ₹{(yearlyStats.totalCollected || 0).toLocaleString()} / ₹
                {(yearlyStats.totalRent || 0).toLocaleString()}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom variant="body2">
                Total Advance Balance
              </Typography>
              <Typography
                variant="h4"
                sx={{ fontWeight: "bold", color: "info.main" }}
              >
                ₹{(totalAdvance || 0).toLocaleString()}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Across all shops
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filters */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <FormControl fullWidth>
            <InputLabel>Select Year</InputLabel>
            <Select
              value={selectedYear}
              label="Select Year"
              onChange={(e) => setSelectedYear(Number(e.target.value))}
            >
              {availableYears.map((year) => (
                <MenuItem key={year} value={year}>
                  {year} {loadedYears.includes(year) ? '(Loaded)' : ''}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} md={6}>
          <FormControl fullWidth>
            <InputLabel>Select Month</InputLabel>
            <Select
              value={selectedMonth}
              label="Select Month"
              onChange={(e) => setSelectedMonth(e.target.value)}
            >
              {months.map((month, index) => {
                const monthValue = `${selectedYear}-${String(
                  index + 1
                ).padStart(2, "0")}`;
                return (
                  <MenuItem key={monthValue} value={monthValue}>
                    {month} {selectedYear}
                  </MenuItem>
                );
              })}
            </Select>
          </FormControl>
        </Grid>
      </Grid>

      {/* Detailed Reports */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Monthly Payment Status -{" "}
                {new Date(selectedMonth + "-01").toLocaleDateString("en-US", {
                  month: "long",
                })}
              </Typography>
              <TableContainer
                component={Paper}
                sx={{ maxHeight: 400, overflow: "auto" }}
              >
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Shop</TableCell>
                      <TableCell>Tenant Name</TableCell>
                      <TableCell align="right">Rent</TableCell>
                      <TableCell align="right">Paid</TableCell>
                      <TableCell>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {shopsArray.map((shop: any) => {
                      const monthName = new Date(
                        selectedMonth + "-01"
                      ).toLocaleDateString("en-US", { month: "long" });
                      const monthData = shop.monthlyData?.[monthName] || {
                        rent: shop.rentAmount,
                        paid: 0,
                        status: "Pending",
                      };
                      const status = monthData.status;
                      const paidAmount = monthData.paid;

                      return (
                        <TableRow
                          key={shop.shopNumber}
                          sx={{
                            backgroundColor: (() => {
                              if (status === "Due") {
                                return "#ffebee"; // Reddish for Due status
                              }
                              if (status === "Partially Paid") {
                                return "#f5f5f5"; // Grey for Inactive tenant
                              }
                              return "inherit";
                            })(),
                          }}
                        >
                          <TableCell>{shop.shopNumber}</TableCell>
                          <TableCell>{shop.tenant.name}</TableCell>
                          <TableCell align="right">
                            ₹{(shop.rentAmount || 0).toLocaleString()}
                          </TableCell>
                          <TableCell align="right">
                            ₹{(paidAmount || 0).toLocaleString()}
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={status}
                              color={getStatusColor(status) as any}
                              size="small"
                            />
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Payment Summary
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">
                    Monthly Collection
                  </Typography>
                  <Typography
                    variant="h6"
                    sx={{ fontWeight: "bold", color: "success.main" }}
                  >
                    ₹{(monthlyStats.totalCollected || 0).toLocaleString()}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">
                    Monthly Pending
                  </Typography>
                  <Typography
                    variant="h6"
                    sx={{ fontWeight: "bold", color: "warning.main" }}
                  >
                    ₹{(monthlyStats.totalPending || 0).toLocaleString()}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">
                    Total Expected Collection
                  </Typography>
                  <Typography
                    variant="h6"
                    sx={{ fontWeight: "bold", color: "primary.main" }}
                  >
                    ₹{(monthlyStats.totalRent || 0).toLocaleString()}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">
                    Partial Payments
                  </Typography>
                  <Typography
                    variant="h6"
                    sx={{ fontWeight: "bold", color: "info.main" }}
                  >
                    {monthlyStats.partialCount}
                  </Typography>
                </Grid>
              </Grid>

              <Divider sx={{ my: 2 }} />

              <Typography variant="h6" gutterBottom>
                Yearly Summary - {selectedYear}
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">
                    Total Collected
                  </Typography>
                  <Typography
                    variant="h6"
                    sx={{ fontWeight: "bold", color: "success.main" }}
                  >
                    ₹{(yearlyStats.totalCollected || 0).toLocaleString()}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">
                    Total Pending
                  </Typography>
                  <Typography
                    variant="h6"
                    sx={{ fontWeight: "bold", color: "warning.main" }}
                  >
                    ₹{(yearlyStats.totalPending || 0).toLocaleString()}
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Printable Report */}
      <Box sx={{ display: "none", "@media print": { display: "block" } }}>
        <Paper sx={{ p: 3, m: 2 }}>
          <Typography variant="h4" gutterBottom align="center">
            Rent Management Report
          </Typography>
          <Typography variant="h6" gutterBottom align="center">
            {new Date(selectedMonth + "-01").toLocaleDateString("en-US", {
              month: "long",
            })}{" "}
            - {selectedYear}
          </Typography>

          <Divider sx={{ my: 2 }} />

          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={6}>
              <Typography variant="h6">Total Shops: {totalShops}</Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="h6">Active Shops: {activeShops}</Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="h6">
                Monthly Collection: ₹
                {(monthlyStats.totalCollected || 0).toLocaleString()}
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="h6">
                Collection Rate: {monthlyStats.collectionRate.toFixed(1)}%
              </Typography>
            </Grid>
          </Grid>

          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Shop</TableCell>
                  <TableCell align="right">Rent</TableCell>
                  <TableCell align="right">Paid</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {shopsArray.map((shop: any) => {
                  const monthName = new Date(
                    selectedMonth + "-01"
                  ).toLocaleDateString("en-US", { month: "long" });
                  const monthData = shop.monthlyData?.[monthName] || {
                    rent: shop.rentAmount,
                    paid: 0,
                    status: "Pending",
                  };
                  const status = monthData.status;
                  const paidAmount = monthData.paid;

                  return (
                    <TableRow key={shop.shopNumber}>
                      <TableCell>{shop.shopNumber}</TableCell>
                      <TableCell align="right">
                        ₹{(shop.rentAmount || 0).toLocaleString()}
                      </TableCell>
                      <TableCell align="right">
                        ₹{(paidAmount || 0).toLocaleString()}
                      </TableCell>
                      <TableCell>{status}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </Box>
    </Box>
  );
};

export default Reports;

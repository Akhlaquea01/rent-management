import React from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  People as PeopleIcon,
  Payment as PaymentIcon,
  Warning as WarningIcon,
  AccountBalance as AccountBalanceIcon,
} from '@mui/icons-material';
import { useRentStore } from '../store/rentStore';

const StatCard: React.FC<{
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  subtitle?: string;
}> = ({ title, value, icon, color, subtitle }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent sx={{ p: isMobile ? 1.5 : 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Typography color="textSecondary" gutterBottom variant={isMobile ? "caption" : "body2"}>
              {title}
            </Typography>
            <Typography variant={isMobile ? "h6" : "h4"} component="div" sx={{ fontWeight: 'bold' }}>
              {value}
            </Typography>
            {subtitle && (
              <Typography variant={isMobile ? "caption" : "body2"} color="textSecondary">
                {subtitle}
              </Typography>
            )}
          </Box>
          <Box
            sx={{
              backgroundColor: color,
              borderRadius: '50%',
              p: isMobile ? 0.5 : 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {React.cloneElement(icon as React.ReactElement, { 
              sx: { fontSize: isMobile ? 20 : 24, color: 'white' } 
            })}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

const Dashboard: React.FC = () => {
  const { data } = useRentStore();
  const currentYear = new Date().getFullYear().toString();
  const shops = data.years[currentYear]?.shops || {};
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // Compute dashboard stats from new data structure
  const shopsArray = Object.entries(shops).map(([shopNumber, shop]: [string, any]) => ({
    shopNumber,
    ...shop,
  }));

  const totalShops = shopsArray.length;
  const activeShops = shopsArray.filter((shop: any) => shop.tenant.status === 'Active').length;
  const inactiveShops = totalShops - activeShops;

  const totalRentCollected = shopsArray.reduce((sum: number, shop: any) => {
    const monthlyData = shop.monthlyData || {};
    const monthlySum: number = (Object.values(monthlyData) as any[]).reduce((monthSum: number, month: any) => 
      monthSum + (Number(month.paid) || 0), 0);
    return sum + monthlySum;
  }, 0);

  const totalDues = shopsArray.reduce((sum: number, shop: any) => sum + shop.totalDuesBalance, 0);

  const totalAdvance = shopsArray.reduce((sum: number, shop: any) => sum + shop.advanceAmount, 0);

  const monthlyCollection = Object.entries(shops).map(([shopNumber, shop]: [string, any]) => {
    const monthlyData = shop.monthlyData || {};
    const currentMonth = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    const currentMonthData = monthlyData[currentMonth.split(' ')[0]] || { paid: 0 };
    return {
      month: currentMonth,
      amount: currentMonthData.paid,
    };
  });

  const stats = {
    totalShops,
    activeShops,
    inactiveShops,
    totalRentCollected,
    totalDues,
    totalAdvance,
    monthlyCollection,
  };

  const recentShops = shopsArray
    .sort((a: any, b: any) => new Date(b.tenant.agreementDate).getTime() - new Date(a.tenant.agreementDate).getTime())
    .slice(0, 5);

  const overdueShops = shopsArray
    .filter((shop: any) => shop.totalDuesBalance > 0)
    .sort((a: any, b: any) => b.totalDuesBalance - a.totalDuesBalance)
    .slice(0, 5);

  return (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ mb: 3 }}>
        Dashboard Overview
      </Typography>

      {/* Statistics Cards */}
      <Grid container spacing={isMobile ? 2 : 3} sx={{ mb: 4 }}>
        <Grid item xs={6} sm={6} md={3}>
          <StatCard
            title="Total Shops"
            value={stats.totalShops}
            icon={<PeopleIcon sx={{ color: 'white' }} />}
            color="#1976d2"
            subtitle={`${stats.activeShops} Active, ${stats.inactiveShops} Inactive`}
          />
        </Grid>
        <Grid item xs={6} sm={6} md={3}>
          <StatCard
            title="Rent Collected"
            value={`₹${stats.totalRentCollected.toLocaleString()}`}
            icon={<PaymentIcon sx={{ color: 'white' }} />}
            color="#2e7d32"
            subtitle="Total collected this year"
          />
        </Grid>
        <Grid item xs={6} sm={6} md={3}>
          <StatCard
            title="Total Dues"
            value={`₹${stats.totalDues.toLocaleString()}`}
            icon={<WarningIcon sx={{ color: 'white' }} />}
            color="#ed6c02"
            subtitle="Pending payments"
          />
        </Grid>
        <Grid item xs={6} sm={6} md={3}>
          <StatCard
            title="Advance Balance"
            value={`₹${stats.totalAdvance.toLocaleString()}`}
            icon={<AccountBalanceIcon sx={{ color: 'white' }} />}
            color="#9c27b0"
            subtitle="Total advance deposits"
          />
        </Grid>
      </Grid>

      {/* Recent Activity and Overdue Tenants */}
      <Grid container spacing={isMobile ? 2 : 3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Recent Shops
              </Typography>
              {isMobile ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {recentShops.map((shop: any) => (
                    <Card key={shop.shopNumber} variant="outlined" sx={{ p: 1 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Box>
                          <Typography variant="subtitle2">{shop.tenant.name}</Typography>
                          <Typography variant="body2" color="textSecondary">
                            Shop {shop.shopNumber}
                          </Typography>
                        </Box>
                        <Box sx={{ textAlign: 'right' }}>
                          <Chip
                            label={shop.tenant.status}
                            size="small"
                            color={shop.tenant.status === 'Active' ? 'success' : 'default'}
                          />
                          <Typography variant="body2" sx={{ mt: 0.5 }}>
                            ₹{shop.rentAmount.toLocaleString()}
                          </Typography>
                        </Box>
                      </Box>
                    </Card>
                  ))}
                </Box>
              ) : (
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Name</TableCell>
                        <TableCell>Shop</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Rent</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {recentShops.map((shop: any) => (
                        <TableRow key={shop.shopNumber}>
                          <TableCell>{shop.tenant.name}</TableCell>
                          <TableCell>{shop.shopNumber}</TableCell>
                          <TableCell>
                            <Chip
                              label={shop.tenant.status}
                              size="small"
                              color={shop.tenant.status === 'Active' ? 'success' : 'default'}
                            />
                          </TableCell>
                          <TableCell>₹{shop.rentAmount.toLocaleString()}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Shops with Dues
              </Typography>
              {isMobile ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {overdueShops.map((shop: any) => (
                    <Card key={shop.shopNumber} variant="outlined" sx={{ p: 1 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Box>
                          <Typography variant="subtitle2">{shop.tenant.name}</Typography>
                          <Typography variant="body2" color="textSecondary">
                            Shop {shop.shopNumber}
                          </Typography>
                        </Box>
                        <Box sx={{ textAlign: 'right' }}>
                          <Typography variant="body2" color="error.main" sx={{ fontWeight: 'bold' }}>
                            ₹{shop.totalDuesBalance.toLocaleString()}
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
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Name</TableCell>
                        <TableCell>Shop</TableCell>
                        <TableCell align="right">Due Amount</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {overdueShops.map((shop: any) => (
                        <TableRow key={shop.shopNumber}>
                          <TableCell>{shop.tenant.name}</TableCell>
                          <TableCell>{shop.shopNumber}</TableCell>
                          <TableCell align="right">
                            <Typography color="error.main" sx={{ fontWeight: 'bold' }}>
                              ₹{shop.totalDuesBalance.toLocaleString()}
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
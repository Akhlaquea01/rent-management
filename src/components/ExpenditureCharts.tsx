import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Grid,
  LinearProgress,
  Chip
} from '@mui/material';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title, PointElement, LineElement } from 'chart.js';
import { Pie, Bar, Line } from 'react-chartjs-2';
import { generateCategoryColors } from '../data/expenditureData';

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title, PointElement, LineElement);

interface ExpenditureChartsProps {
  categoryTotals: { [key: string]: number };
  monthlyData?: { month: string; total: number }[];
  totalAmount: number;
  budget?: { [key: string]: number };
}

const ExpenditureCharts: React.FC<ExpenditureChartsProps> = ({
  categoryTotals,
  monthlyData,
  totalAmount,
  budget = {}
}) => {
  // Generate dynamic category colors
  const categoryColors = generateCategoryColors(Object.keys(categoryTotals));
  
  // Category breakdown pie chart
  const pieChartData = {
    labels: Object.keys(categoryTotals),
    datasets: [
      {
        data: Object.values(categoryTotals),
        backgroundColor: Object.keys(categoryTotals).map(cat => categoryColors[cat] || '#607D8B'),
        borderWidth: 2,
        borderColor: '#fff'
      }
    ]
  };

  // Monthly trend line chart
  const lineChartData = monthlyData ? {
    labels: monthlyData.map(m => m.month),
    datasets: [
      {
        label: 'Total Spending',
        data: monthlyData.map(m => m.total),
        borderColor: 'rgba(25, 118, 210, 1)',
        backgroundColor: 'rgba(25, 118, 210, 0.1)',
        borderWidth: 3,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: 'rgba(25, 118, 210, 1)',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 6,
        pointHoverRadius: 8
      }
    ]
  } : null;

  // Budget vs actual comparison
  const BudgetComparison = () => {
    const categories = Object.keys(categoryTotals);
    const budgetCategories = Object.keys(budget);
    const allCategoriesSet = new Set([...categories, ...budgetCategories]);
    const allCategories = Array.from(allCategoriesSet);

    return (
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Budget vs Actual Spending
          </Typography>
          <Box sx={{ mt: 2 }}>
            {allCategories.map(category => {
              const actual = categoryTotals[category] || 0;
              const budgetAmount = budget[category] || 0;
              const percentage = budgetAmount > 0 ? (actual / budgetAmount) * 100 : 0;
              const isOverBudget = percentage > 100;

              return (
                <Box key={category} sx={{ mb: 2 }}>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Box
                        sx={{
                          width: 12,
                          height: 12,
                          borderRadius: '50%',
                          backgroundColor: categoryColors[category] || '#607D8B'
                        }}
                      />
                      <Typography variant="body2">{category}</Typography>
                    </Box>
                    <Box display="flex" gap={1} alignItems="center">
                      <Typography variant="body2" color="textSecondary">
                        ₹{actual.toFixed(2)} / ₹{budgetAmount.toFixed(2)}
                      </Typography>
                      <Chip
                        label={`${percentage.toFixed(0)}%`}
                        size="small"
                        color={isOverBudget ? 'error' : percentage > 80 ? 'warning' : 'success'}
                      />
                    </Box>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={Math.min(percentage, 100)}
                    sx={{
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: 'rgba(0,0,0,0.1)',
                      '& .MuiLinearProgress-bar': {
                        backgroundColor: isOverBudget ? '#f44336' : percentage > 80 ? '#ff9800' : '#4caf50'
                      }
                    }}
                  />
                </Box>
              );
            })}
          </Box>
        </CardContent>
      </Card>
    );
  };

  return (
    <Grid container spacing={3}>
      {/* Category Breakdown Pie Chart */}
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Spending by Category
            </Typography>
            <Box height={300}>
              <Pie 
                data={pieChartData} 
                options={{ 
                  responsive: true, 
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'bottom',
                      labels: {
                        padding: 20,
                        usePointStyle: true
                      }
                    },
                    tooltip: {
                      callbacks: {
                        label: function(context) {
                          const value = context.parsed;
                          const percentage = ((value / totalAmount) * 100).toFixed(1);
                          return `${context.label}: ₹${value.toFixed(2)} (${percentage}%)`;
                        }
                      }
                    }
                  }
                }} 
              />
            </Box>
          </CardContent>
        </Card>
      </Grid>

      {/* Monthly Trend Chart */}
      {lineChartData && (
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Monthly Spending Trend
              </Typography>
              <Box height={300}>
                <Line 
                  data={lineChartData} 
                  options={{ 
                    responsive: true, 
                    maintainAspectRatio: false,
                    scales: {
                      y: {
                        beginAtZero: true,
                        ticks: {
                          callback: function(value) {
                            return '₹' + value;
                          }
                        }
                      }
                    },
                    plugins: {
                      tooltip: {
                        callbacks: {
                          label: function(context) {
                            return 'Total Spending: ₹' + context.parsed.y.toFixed(2);
                          }
                        }
                      }
                    }
                  }} 
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      )}

      {/* Budget Comparison */}
      {Object.keys(budget).length > 0 && (
        <Grid item xs={12}>
          <BudgetComparison />
        </Grid>
      )}
    </Grid>
  );
};

export default ExpenditureCharts;

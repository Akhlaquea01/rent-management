import React from 'react';
import { Box, Typography, Paper, Button } from '@mui/material';
import { useRentContext } from '../context/RentContext';

const ContextDebugger: React.FC = () => {
  const { state, forceRefresh } = useRentContext();

  return (
    <Paper sx={{ p: 2, m: 2, backgroundColor: '#f5f5f5' }}>
      <Typography variant="h6" gutterBottom>
        Context Debug Info
      </Typography>
      <Box>
        <Typography variant="body2">
          <strong>Loading:</strong> {state.loading ? 'Yes' : 'No'}
        </Typography>
        <Typography variant="body2">
          <strong>Error:</strong> {state.error || 'None'}
        </Typography>
        <Typography variant="body2">
          <strong>Years:</strong> {Object.keys(state.data.years || {}).join(', ')}
        </Typography>
        <Typography variant="body2">
          <strong>Total Shops:</strong> {
            Object.values(state.data.years || {}).reduce((total, year) =>
              total + Object.keys(year.shops || {}).length, 0
            )
          }
        </Typography>
        <Typography variant="body2">
          <strong>Advance Transactions:</strong> {
            Object.keys(state.data.advanceTransactions || {}).length
          } shops
        </Typography>
      </Box>
      <Box sx={{ mt: 2 }}>
        <Button
          variant="outlined"
          size="small"
          onClick={forceRefresh}
        >
          Refresh Data
        </Button>
      </Box>
    </Paper>
  );
};

export default ContextDebugger;
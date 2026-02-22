import React from 'react';
import { Box, Alert, Button, Typography } from '@mui/material';
import { ErrorOutline as ErrorOutlineIcon } from '@mui/icons-material';

interface ErrorStateProps {
    message?: string;
    onRetry?: () => void;
}

const ErrorState: React.FC<ErrorStateProps> = ({
    message = 'Something went wrong. Please try again.',
    onRetry,
}) => (
    <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 2 }}>
        <Alert
            severity="error"
            icon={<ErrorOutlineIcon />}
            sx={{ width: '100%', borderRadius: 2 }}
        >
            <Typography variant="body2">{message}</Typography>
        </Alert>
        {onRetry && (
            <Button variant="outlined" color="error" onClick={onRetry} size="small">
                Retry
            </Button>
        )}
    </Box>
);

export default ErrorState;

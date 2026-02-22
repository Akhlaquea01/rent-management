import React from 'react';
import { Box, Typography } from '@mui/material';
import { InboxOutlined as InboxIcon } from '@mui/icons-material';

interface EmptyStateProps {
    message?: string;
    subMessage?: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({
    message = 'No data available',
    subMessage,
}) => (
    <Box
        sx={{
            py: 6,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 1,
            color: 'text.secondary',
        }}
    >
        <InboxIcon sx={{ fontSize: 56, opacity: 0.35 }} />
        <Typography variant="body1" fontWeight={500}>
            {message}
        </Typography>
        {subMessage && (
            <Typography variant="body2" color="text.disabled">
                {subMessage}
            </Typography>
        )}
    </Box>
);

export default EmptyState;

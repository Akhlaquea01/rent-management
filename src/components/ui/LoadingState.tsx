import React from 'react';
import { Box, Skeleton, Card, CardContent } from '@mui/material';

interface LoadingStateProps {
    /** 'card' renders stat-card skeletons, 'table' renders a table skeleton, 'page' renders a full-page spinner */
    variant?: 'card' | 'table' | 'page';
    /** Number of skeleton rows/cards to show (default: 4) */
    count?: number;
}

const LoadingState: React.FC<LoadingStateProps> = ({ variant = 'page', count = 4 }) => {
    if (variant === 'card') {
        return (
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 2 }}>
                {Array.from({ length: count }).map((_, i) => (
                    <Card key={i}>
                        <CardContent>
                            <Skeleton variant="text" width="60%" height={20} />
                            <Skeleton variant="text" width="40%" height={40} sx={{ mt: 1 }} />
                            <Skeleton variant="text" width="80%" height={16} sx={{ mt: 0.5 }} />
                        </CardContent>
                    </Card>
                ))}
            </Box>
        );
    }

    if (variant === 'table') {
        return (
            <Box sx={{ width: '100%' }}>
                <Skeleton variant="rectangular" height={48} sx={{ mb: 1 }} />
                {Array.from({ length: count }).map((_, i) => (
                    <Skeleton key={i} variant="rectangular" height={40} sx={{ mb: 0.5 }} />
                ))}
            </Box>
        );
    }

    // Default: page-level centered spinner skeleton
    return (
        <Box sx={{ p: 3 }}>
            <Skeleton variant="text" width="30%" height={40} sx={{ mb: 2 }} />
            <Skeleton variant="rectangular" height={120} sx={{ mb: 2, borderRadius: 2 }} />
            <Skeleton variant="rectangular" height={300} sx={{ borderRadius: 2 }} />
        </Box>
    );
};

export default LoadingState;

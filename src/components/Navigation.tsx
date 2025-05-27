import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { AppBar, Toolbar, Button, Box, Typography } from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PersonIcon from '@mui/icons-material/Person';

interface NavigationProps {
  currentPage: 'date' | 'partner';
}

const Navigation: React.FC<NavigationProps> = ({ currentPage }) => {
  return (
    <AppBar position="static" sx={{ bgcolor: '#3F334D' }}>
      <Toolbar>
        <Typography 
          variant="h5" 
          component="div" 
          sx={{ 
            flexGrow: 1,
            fontWeight: 'bold',
            color: '#FFFFFF'
          }}
        >
          Performance Impressions Dashboard
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            component={RouterLink}
            to="/date"
            variant={currentPage === 'date' ? 'contained' : 'text'}
            startIcon={<DashboardIcon />}
            sx={{
              color: currentPage === 'date' ? '#FFFFFF' : '#EAF0CE',
              bgcolor: currentPage === 'date' ? '#574B60' : 'transparent',
              '&:hover': {
                bgcolor: currentPage === 'date' ? '#7D8491' : 'rgba(234, 240, 206, 0.1)',
              },
            }}
          >
            Date Analytics
          </Button>
          <Button
            component={RouterLink}
            to="/"
            variant={currentPage === 'partner' ? 'contained' : 'text'}
            startIcon={<PersonIcon />}
            sx={{
              color: currentPage === 'partner' ? '#FFFFFF' : '#EAF0CE',
              bgcolor: currentPage === 'partner' ? '#574B60' : 'transparent',
              '&:hover': {
                bgcolor: currentPage === 'partner' ? '#7D8491' : 'rgba(234, 240, 206, 0.1)',
              },
            }}
          >
            Partner Analytics
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Navigation; 
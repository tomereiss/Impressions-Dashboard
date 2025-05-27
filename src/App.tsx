import React, { useState, useEffect } from 'react';
import { Container, Box, CssBaseline, ThemeProvider, createTheme, AppBar, Toolbar, Typography, Grid, Paper } from '@mui/material';
import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom';
import DateSelector from './components/DateSelector';
import DataTable from './components/DataTable';
import PartnerAnalytics from './components/PartnerAnalytics';
import Navigation from './components/Navigation';
import { API_BASE_URL } from './config';

const theme = createTheme({
  palette: {
    mode: 'light',
  },
});

const DateAnalytics = () => {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [partnerId, setPartnerId] = useState<string>('');

  useEffect(() => {
    const fetchAvailableDates = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/available-dates`);
        if (!response.ok) {
          throw new Error('Failed to fetch dates');
        }
        const dates = await response.json();
        setAvailableDates(dates);
        
        // Set the most recent date as default
        if (dates.length > 0) {
          setSelectedDate(dates[0]);
        }
      } catch (error) {
        console.error('Error fetching dates:', error);
      }
    };

    fetchAvailableDates();
  }, []);

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4, bgcolor: '#FFFFFF' }}>
      <Grid container spacing={3}>
        {/* Header Section */}
        <Grid item xs={12}>
          <Paper elevation={3} sx={{ p: 3, bgcolor: '#3F334D', color: '#FFFFFF' }}>
            <Typography variant="h4" gutterBottom>
              Date Analytics
            </Typography>
            <Typography variant="subtitle1">
              View analytics for specific dates
            </Typography>
          </Paper>
        </Grid>

        {/* Date Selector and Data Tables */}
        <Grid item xs={12}>
          <Box sx={{ mb: 3 }}>
            <DateSelector onDateChange={setSelectedDate} />
          </Box>
          {selectedDate && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <DataTable date={selectedDate} type="impressions_stats" partnerId={partnerId} />
              <DataTable date={selectedDate} type="bad_impressions" partnerId={partnerId} />
            </Box>
          )}
        </Grid>
      </Grid>
    </Container>
  );
};

const AppContent = () => {
  const location = useLocation();
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [partnerId, setPartnerId] = useState<string>('');

  useEffect(() => {
    const fetchAvailableDates = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/available-dates`);
        if (!response.ok) {
          throw new Error('Failed to fetch dates');
        }
        const dates = await response.json();
        setAvailableDates(dates);
      } catch (error) {
        console.error('Error fetching dates:', error);
      }
    };

    fetchAvailableDates();
  }, []);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navigation currentPage={location.pathname === '/date' ? 'date' : 'partner'} />
      <Container component="main" sx={{ flexGrow: 1, py: 3 }}>
        <Routes>
          <Route path="/" element={<PartnerAnalytics />} />
          <Route path="/date" element={<DateAnalytics />} />
        </Routes>
      </Container>
    </Box>
  );
};

const App = () => {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </ThemeProvider>
  );
};

export default App; 
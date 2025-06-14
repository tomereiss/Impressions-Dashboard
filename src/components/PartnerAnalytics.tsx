import React, { useState, useEffect, useRef } from 'react';
import type { ChangeEvent } from 'react';
import {
  Container,
  Grid,
  Paper,
  Typography,
  TextField,
  Box,
  Card,
  CardContent,
  CardHeader,
  Divider,
  useTheme,
  CircularProgress,
  Alert,
  Collapse,
  IconButton,
  styled,
  Stack,
  Button
} from '@mui/material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import DataTable from './DataTable';
import BadFromTotalGraph from './BadFromTotalGraph';
import ViolationsPieChart from './ViolationsPieChart';
import { API_BASE_URL } from '../config';

interface WeeklyDataPoint {
  date: string;
  impressions_count: string;
  bad_impressions_count: string;
  bad_from_total_in_percentage: string;
  violation_count?: string;
}

interface ViolationData {
  date: string;
  totalBadImpressions: number;
  violations: {
    type: string;
    count: number;
  }[];
}

interface StatsDataPoint {
  date: string;
  percentage: number;
  totalImpressions: number;
  badImpressions: number;
}

interface ViolationRow {
  partnerId: string;
  violation: string;
  violation_count: string;
}

interface PartnerAlert {
  partnerId: string;
  impressionsCount: number;
  badPercentage: number;
}

const COLORS = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEEAD', '#D4A5A5', '#9B59B6', '#3498DB'];

// Styled components for animations
const ExpandableCardHeader = styled(CardHeader)(({ theme }) => ({
  cursor: 'pointer',
  transition: 'all 0.3s ease',
  '&:hover': {
    backgroundColor: 'rgba(0, 0, 0, 0.1)', // Darker gray on hover
  },
}));

const ExpandableCard = styled(Card)<{ isexpanded: string; index: number }>(({ theme, isexpanded, index }) => ({
  marginBottom: theme.spacing(2),
  transition: 'all 0.3s ease',
  transform: isexpanded === 'true' ? 'scale(1)' : 'scale(0.98)',
  border: '1px solid #E0E0E0',
  '&:hover': {
    transform: isexpanded === 'true' ? 'scale(1)' : 'scale(0.99) translateY(2px)',
    backgroundColor: '#9ED0E6',
    boxShadow: theme.shadows[2],
  },
}));

const ExpandMore = styled((props: any) => {
  const { expand, ...other } = props;
  return <IconButton {...other} />;
})(({ theme, expand }) => ({
  transform: !expand ? 'rotate(0deg)' : 'rotate(180deg)',
  marginLeft: 'auto',
  transition: theme.transitions.create('transform', {
    duration: theme.transitions.duration.shortest,
  }),
}));

const PartnerAnalytics: React.FC = () => {
  const [partnerId, setPartnerId] = useState<string>('');
  const [searchPartnerId, setSearchPartnerId] = useState<string>('');
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [weeklyData, setWeeklyData] = useState<WeeklyDataPoint[]>([]);
  const [violationData, setViolationData] = useState<ViolationData[]>([]);
  const [stats, setStats] = useState<StatsDataPoint[]>([]);
  const [violationsDataArray, setViolationsDataArray] = useState<Array<{
    date: string;
    totalBadImpressions: number;
    violations: Array<{
      type: string;
      count: number;
    }>;
  }>>([]);
  const [error, setError] = useState<string | null>(null);
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  const [isGraphExpanded, setIsGraphExpanded] = useState(true);
  const [isTablesExpanded, setIsTablesExpanded] = useState(true);
  const [alerts, setAlerts] = useState<PartnerAlert[]>([]);
  const [impressionsThreshold, setImpressionsThreshold] = useState<number>(1000000);
  const [percentageThreshold, setPercentageThreshold] = useState<number>(1);
  const theme = useTheme();
  const searchSectionRef = useRef<HTMLDivElement>(null);
  const summarySectionRef = useRef<HTMLDivElement>(null);

  const scrollToSearch = () => {
    searchSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollToSummary = () => {
    summarySectionRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    const fetchAvailableDates = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/available-dates`);
        if (!response.ok) {
          throw new Error('Failed to fetch available dates');
        }
        const dates = await response.json();
        setAvailableDates(dates);
      } catch (error) {
        console.error('Error fetching available dates:', error);
      }
    };

    fetchAvailableDates();
  }, []);

  const fetchPartnerData = async () => {
    if (!searchPartnerId) return;

    try {
      setLoading(true);
      setError(null);

      // Check if we have cached data for this partner
      const cacheKey = `partner_${searchPartnerId}_analytics`;
      const cachedData = localStorage.getItem(cacheKey);
      const cacheTimestamp = localStorage.getItem(`${cacheKey}_timestamp`);
      
      // Use cached data if it's less than 1 hour old
      if (cachedData && cacheTimestamp) {
        const cacheAge = Date.now() - parseInt(cacheTimestamp);
        if (cacheAge < 3600000) { // 1 hour in milliseconds
          console.log('Using cached analytics data for partner', searchPartnerId);
          const parsedData = JSON.parse(cachedData);
          setWeeklyData(parsedData.weeklyData);
          setViolationData(parsedData.violationData);
          setStats(parsedData.stats);
          setAvailableDates(parsedData.availableDates);
          setViolationsDataArray(parsedData.violationsDataArray);
          setLoading(false);
          return;
        }
      }

      const weeklyData: WeeklyDataPoint[] = [];
      const violationDataArray: ViolationData[] = [];
      const stats: StatsDataPoint[] = [];

      console.log('=== Partner Data Analysis ===');
      console.log('Partner ID:', searchPartnerId);
      console.log('Available dates:', availableDates);
      console.log('------------------------');

      // Get only the last 7 days of data
      const today = new Date();
      const sevenDaysAgo = new Date(today);
      sevenDaysAgo.setDate(today.getDate() - 8);

      // Clear previous violations data before adding new ones
      setViolationsDataArray([]);

      for (const date of availableDates) {
        try {
          // Fetch impressions data
          const response = await fetch(`${API_BASE_URL}/api/impressions-count/${date}`);
          if (response.ok) {
            const data = await response.json();
            const partnerData = data.find((row: any) => 
              String(row.partner_id || row.partnerId || row['partner id']).trim() === String(searchPartnerId).trim()
            );
            
            if (partnerData) {
              console.log(`\nDate: ${formatDateForDisplay(date)}`);
              console.log('Impressions Data:', {
                partner_id: partnerData.partner_id || partnerData.partnerId || partnerData['partner id'],
                impressions_count: partnerData.impressions_count,
                bad_impressions_count: partnerData.bad_impressions_count,
                bad_from_total_in_percentage: partnerData.bad_from_total_in_percentage,
                violation_count: partnerData.violation_count
              });

              // Handle nan values
              const impressionsCount = partnerData.impressions_count === 'nan' ? '0' : partnerData.impressions_count;
              const badImpressionsCount = partnerData.bad_impressions_count === 'nan' ? '0' : partnerData.bad_impressions_count;
              const percentage = partnerData.bad_from_total_in_percentage === 'nan' ? '0%' : partnerData.bad_from_total_in_percentage;
              const violationCount = partnerData.violation_count === 'nan' ? '0' : partnerData.violation_count;

              weeklyData.push({
                date: formatDateForDisplay(date),
                impressions_count: impressionsCount,
                bad_impressions_count: badImpressionsCount,
                bad_from_total_in_percentage: percentage,
                violation_count: violationCount
              });

              const badImpressions = parseInt(badImpressionsCount) || 0;
              const totalImpressions = parseInt(impressionsCount) || 0;
              const calculatedPercentage = totalImpressions > 0 ? (badImpressions / totalImpressions) * 100 : 0;
              
              console.log('Calculated daily percentage:', {
                badImpressions,
                totalImpressions,
                percentage: calculatedPercentage.toFixed(2) + '%'
              });

              stats.push({
                date: formatDateForDisplay(date),
                percentage: parseFloat(calculatedPercentage.toFixed(2)),
                totalImpressions,
                badImpressions
              });
            }
          }

          // Fetch violation data from bad_impressions table
          const violationsResponse = await fetch(`${API_BASE_URL}/api/bad-impressions/${date}`);
          if (violationsResponse.ok) {
            const violationsData = await violationsResponse.json();
            const partnerViolations = violationsData.filter((row: ViolationRow) => 
              String(row.partnerId).trim() === String(searchPartnerId).trim()
            );
            
            if (partnerViolations.length > 0) {
              console.log('\n=== Violations Data Processing ===');
              console.log('Raw partner violations:', partnerViolations);

              // Process violations directly from the array
              const violations = partnerViolations.map((v: ViolationRow) => ({
                type: v.violation,
                count: parseInt(v.violation_count) || 0
              })).filter((v: { count: number }) => v.count > 0);

              console.log('Processed violations:', violations);

              const violationsData = {
                date: formatDateForDisplay(date),
                totalBadImpressions: violations.reduce((sum: number, v: { count: number }) => sum + v.count, 0),
                violations
              };
              console.log('Final violations data for pie chart:', violationsData);
              violationDataArray.push(violationsData);
            }
          }
        } catch (error) {
          console.error(`Error fetching data for date ${date}:`, error);
        }
      }

      // Sort data by date
      weeklyData.sort((a, b) => {
        const [dayA, monthA, yearA] = a.date.split('/');
        const [dayB, monthB, yearB] = b.date.split('/');
        const dateA = new Date(2000 + parseInt(yearA), parseInt(monthA) - 1, parseInt(dayA));
        const dateB = new Date(2000 + parseInt(yearB), parseInt(monthB) - 1, parseInt(dayB));
        return dateA.getTime() - dateB.getTime();
      });

      violationDataArray.sort((a, b) => {
        const [dayA, monthA, yearA] = a.date.split('/');
        const [dayB, monthB, yearB] = b.date.split('/');
        const dateA = new Date(2000 + parseInt(yearA), parseInt(monthA) - 1, parseInt(dayA));
        const dateB = new Date(2000 + parseInt(yearB), parseInt(monthB) - 1, parseInt(dayB));
        return dateA.getTime() - dateB.getTime();
      });

      const filteredWeeklyData = weeklyData.filter(data => {
        const [day, month, year] = data.date.split('/');
        const dataDate = new Date(2000 + parseInt(year), parseInt(month) - 1, parseInt(day));
        return dataDate >= sevenDaysAgo && dataDate < today;
      });

      const filteredViolationData = violationDataArray.filter(data => {
        const [day, month, year] = data.date.split('/');
        const dataDate = new Date(2000 + parseInt(year), parseInt(month) - 1, parseInt(day));
        return dataDate >= sevenDaysAgo && dataDate < today;
      });

      const filteredStats = stats.filter(stat => {
        const [day, month, year] = stat.date.split('/');
        const dataDate = new Date(2000 + parseInt(year), parseInt(month) - 1, parseInt(day));
        return dataDate >= sevenDaysAgo && dataDate < today;
      });

      const filteredAvailableDates = availableDates.filter(date => {
        const [day, month, year] = [date.substring(0, 2), date.substring(2, 4), date.substring(4, 6)];
        const dataDate = new Date(2000 + parseInt(year), parseInt(month) - 1, parseInt(day));
        return dataDate >= sevenDaysAgo && dataDate < today;
      });

      console.log(`\n=== Weekly Partner ${searchPartnerId} Summary Report ===`);
      console.log('Date range:', filteredWeeklyData[0]?.date, 'to', filteredWeeklyData[filteredWeeklyData.length - 1]?.date);
      console.log('Total dates with data:', filteredStats.length);
      console.log('Total impressions:', filteredStats.reduce((sum, stat) => sum + stat.totalImpressions, 0).toLocaleString());
      console.log('Average bad percentage:', (filteredStats.reduce((sum, stat) => sum + stat.percentage, 0) / filteredStats.length).toFixed(2) + '%');
      console.log('------------------------');

      // Cache the processed data
      const dataToCache = {
        weeklyData: filteredWeeklyData,
        violationData: filteredViolationData,
        stats: filteredStats,
        availableDates: filteredAvailableDates,
        violationsDataArray: filteredViolationData
      };
      localStorage.setItem(cacheKey, JSON.stringify(dataToCache));
      localStorage.setItem(`${cacheKey}_timestamp`, Date.now().toString());

      setWeeklyData(filteredWeeklyData);
      setViolationData(filteredViolationData);
      setStats(filteredStats);
      setAvailableDates(filteredAvailableDates);
      setViolationsDataArray(filteredViolationData);
    } catch (error) {
      console.error('Error fetching partner data:', error);
      setError('Failed to fetch partner data');
    } finally {
      setLoading(false);
    }
  };

  // Format date for display (DDMMYY -> DD/MM/YY)
  const formatDateForDisplay = (date: string) => {
    const day = date.substring(0, 2);
    const month = date.substring(2, 4);
    const year = date.substring(4, 6);
    return `${day}/${month}/${year}`;
  };

  useEffect(() => {
    if (searchPartnerId) {
      fetchPartnerData();
    }
  }, [searchPartnerId]);

  const handlePartnerIdChange = (event: ChangeEvent<HTMLInputElement>) => {
    setPartnerId(event.target.value);
  };

  const handleSearch = () => {
    // Clear all previous data
    setWeeklyData([]);
    setViolationData([]);
    setStats([]);
    setViolationsDataArray([]);
    setExpandedCard(null);
    setSearchPartnerId(partnerId);
    // Scroll to search section after a short delay to ensure the data is loaded
    setTimeout(scrollToSearch, 100);
  };

  const handleCardClick = (date: string) => {
    setExpandedCard(expandedCard === date ? null : date);
  };

  // Update fetchAlerts to use the thresholds
  const fetchAlerts = async () => {
    try {
      const partnerStats = new Map<string, { totalImpressions: number[], badPercentages: number[] }>();
      
      // Get only the last 7 days of data
      const today = new Date();
      const sevenDaysAgo = new Date(today);
      sevenDaysAgo.setDate(today.getDate() - 8);

      // Filter available dates to only include the last 7 days
      const filteredDates = availableDates.filter(date => {
        const [day, month, year] = [date.substring(0, 2), date.substring(2, 4), date.substring(4, 6)];
        const dataDate = new Date(2000 + parseInt(year), parseInt(month) - 1, parseInt(day));
        return dataDate >= sevenDaysAgo && dataDate < today;
      });
      
      // Fetch data for filtered dates only
      for (const date of filteredDates) {
        const response = await fetch(`${API_BASE_URL}/api/impressions-count/${date}`);
        if (!response.ok) {
          throw new Error('Failed to fetch impressions data');
        }
        const data = await response.json();
        
        // Process each partner's data
        data.forEach((row: any) => {
          const partnerId = row.partner_id || row.partnerId || row['partner id'];
          const impressionsCount = parseInt(row.impressions_count === 'nan' ? '0' : row.impressions_count) || 0;
          const badPercentage = parseFloat(row.bad_from_total_in_percentage === 'nan' ? '0' : row.bad_from_total_in_percentage.replace('%', '')) || 0;
          
          if (!partnerStats.has(partnerId)) {
            partnerStats.set(partnerId, { totalImpressions: [], badPercentages: [] });
          }
          
          const stats = partnerStats.get(partnerId)!;
          stats.totalImpressions.push(impressionsCount);
          stats.badPercentages.push(badPercentage);
        });
      }
      
      // Calculate averages and filter partners using thresholds
      const alerts: PartnerAlert[] = Array.from(partnerStats.entries())
        .map(([partnerId, stats]) => {
          const avgImpressions = stats.totalImpressions.reduce((a, b) => a + b, 0) / stats.totalImpressions.length;
          const avgBadPercentage = stats.badPercentages.reduce((a, b) => a + b, 0) / stats.badPercentages.length;
          
          return {
            partnerId,
            impressionsCount: avgImpressions,
            badPercentage: avgBadPercentage
          };
        })
        .filter(alert => 
          alert.impressionsCount >= impressionsThreshold && 
          alert.badPercentage >= percentageThreshold
        )
        .sort((a, b) => b.badPercentage - a.badPercentage);

      setAlerts(alerts);
    } catch (error) {
      console.error('Error fetching alerts:', error);
      setError('Failed to fetch alerts');
    }
  };

  // Add effect to refetch alerts when thresholds change
  useEffect(() => {
    if (availableDates.length > 0) {
      fetchAlerts();
    }
  }, [availableDates, impressionsThreshold, percentageThreshold]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4, bgcolor: '#FFFFFF' }}>
      <Grid container spacing={3}>
        {/* Header Section */}
        <Grid item xs={12}>
          <Paper elevation={3} sx={{ p: 3, bgcolor: '#3F334D', color: '#FFFFFF' }}>
            <Typography variant="h4" gutterBottom>
              Weekly Impressions Analysis
            </Typography>
            <Typography variant="subtitle1">
              View detailed analytics for specific partners
            </Typography>
          </Paper>
        </Grid>

        {/* Alerts Section */}
        <Grid item xs={12}>
          <Paper 
            elevation={3} 
            sx={{ 
              mb: 4, 
              p: 3,
              backgroundColor: '#FFF3E0',
              border: '1px solid #FFB74D'
            }}
          >
            <Typography variant="h6" sx={{ mb: 2, color: '#E65100', fontWeight: 'bold' }}>
              Weekly High Risk Partners Alerts
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Minimum Daily Impressions"
                  type="number"
                  value={impressionsThreshold}
                  onChange={(e) => setImpressionsThreshold(Number(e.target.value))}
                  InputProps={{
                    inputProps: { min: 0, step: 1000 }
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      '& fieldset': {
                        borderColor: '#FFB74D',
                      },
                      '&:hover fieldset': {
                        borderColor: '#E65100',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#E65100',
                      },
                    },
                    '& .MuiInputLabel-root': {
                      color: '#E65100',
                    },
                    '& .MuiInputLabel-root.Mui-focused': {
                      color: '#E65100',
                    },
                  }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Minimum Bad Percentage"
                  type="number"
                  value={percentageThreshold}
                  onChange={(e) => setPercentageThreshold(Number(e.target.value))}
                  InputProps={{
                    inputProps: { min: 0, max: 100, step: 0.1 }
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      '& fieldset': {
                        borderColor: '#FFB74D',
                      },
                      '&:hover fieldset': {
                        borderColor: '#E65100',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#E65100',
                      },
                    },
                    '& .MuiInputLabel-root': {
                      color: '#E65100',
                    },
                    '& .MuiInputLabel-root.Mui-focused': {
                      color: '#E65100',
                    },
                  }}
                />
              </Grid>
            </Grid>
            <Typography variant="body2" sx={{ mb: 2, color: '#BF360C' }}>
              The following partners have an average of more than {impressionsThreshold.toLocaleString()} impressions per day and average bad impression percentage exceeding {percentageThreshold}% in the last week:
            </Typography>
            <Grid container spacing={2}>
              {alerts.map((alert, index) => (
                <Grid item xs={12} sm={6} md={4} key={index}>
                  <Paper 
                    elevation={1}
                    sx={{ 
                      p: 2,
                      backgroundColor: '#FFFFFF',
                      border: '1px solid #FFB74D',
                      '&:hover': {
                        backgroundColor: '#FFF3E0',
                        cursor: 'pointer'
                      }
                    }}
                    onClick={() => {
                      setPartnerId(alert.partnerId);
                      setSearchPartnerId(alert.partnerId);
                      setTimeout(scrollToSummary, 100);
                    }}
                  >
                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: '#E65100' }}>
                      Partner ID: {alert.partnerId}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Avg. Daily Impressions: {alert.impressionsCount.toLocaleString()}
                    </Typography>
                    <Typography variant="body2" color="error">
                      Avg. Bad Percentage: {alert.badPercentage.toFixed(2)}%
                    </Typography>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </Paper>
        </Grid>

        {/* Partner ID Input */}
        <Grid item xs={12} ref={searchSectionRef}>
          <Paper elevation={3} sx={{ p: 3, bgcolor: '#FFFFFF' }}>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                fullWidth
                label="Partner ID"
                value={partnerId}
                onChange={handlePartnerIdChange}
                placeholder="Enter partner ID"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': {
                      borderColor: '#3F334D',
                    },
                    '&:hover fieldset': {
                      borderColor: '#574B60',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#574B60',
                    },
                  },
                  '& .MuiInputLabel-root': {
                    color: '#3F334D',
                  },
                  '& .MuiInputLabel-root.Mui-focused': {
                    color: '#574B60',
                  },
                }}
              />
              <Button
                variant="contained"
                onClick={handleSearch}
                sx={{
                  bgcolor: '#574B60',
                  '&:hover': {
                    bgcolor: '#3F334D',
                  },
                  minWidth: '120px',
                  height: '56px'
                }}
              >
                Search
              </Button>
            </Box>
          </Paper>
        </Grid>

        {/* Charts Section */}
        <Grid item xs={12} ref={summarySectionRef}>
          <Card elevation={3}>
            <CardHeader
              title="Weekly Partner Summary Report"
              sx={{
                bgcolor: '#7D8491',
                color: '#FFFFFF',
                '& .MuiCardHeader-title': {
                  fontSize: '1.2rem',
                  fontWeight: 'bold'
                },
                '&:hover': {
                  bgcolor: '#3F334D',
                  cursor: 'pointer',
                  transition: 'background-color 0.3s ease'
                }
              }}
              onClick={() => setIsGraphExpanded(!isGraphExpanded)}
              action={
                <IconButton
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsGraphExpanded(!isGraphExpanded);
                  }}
                  sx={{ color: '#FFFFFF' }}
                >
                  <ExpandMoreIcon
                    sx={{
                      transform: isGraphExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 0.3s'
                    }}
                  />
                </IconButton>
              }
            />
            <Divider />
            <Collapse in={isGraphExpanded}>
              <CardContent sx={{ bgcolor: '#FFFFFF', p: 2, pb: 4 }}>
                {/* Summary Cards */}
                <Grid container spacing={2} sx={{ mb: 3 }}>
                  <Grid item xs={12} md={6}>
                    <Paper 
                      elevation={1}
                      sx={{ 
                        p: 2,
                        border: '1px solid #E0E0E0',
                        borderRadius: 1,
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                      }}
                    >
                      <Typography 
                        variant="subtitle1" 
                        sx={{ 
                          color: '#3F334D',
                          fontWeight: 'medium',
                          mb: 1
                        }}
                      >
                        Good Impressions
                      </Typography>
                      <Typography 
                        variant="h4" 
                        sx={{ 
                          color: '#2E7D32',
                          fontWeight: 'bold'
                        }}
                      >
                        {weeklyData.reduce((sum, data) => sum + (parseInt(data.impressions_count) || 0), 0).toLocaleString()}
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Paper 
                      elevation={1}
                      sx={{ 
                        p: 2,
                        border: '1px solid #E0E0E0',
                        borderRadius: 1,
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                      }}
                    >
                      <Typography 
                        variant="subtitle1" 
                        sx={{ 
                          color: '#3F334D',
                          fontWeight: 'medium',
                          mb: 1
                        }}
                      >
                        Bad Impressions
                      </Typography>
                      <Typography 
                        variant="h4" 
                        sx={{ 
                          color: '#C62828',
                          fontWeight: 'bold'
                        }}
                      >
                        {weeklyData.reduce((sum, data) => {
                          const violationsCount = parseInt(data.violation_count || '0');
                          return sum + (Number.isNaN(violationsCount) ? 0 : violationsCount);
                        }, 0).toLocaleString()}
                      </Typography>
                    </Paper>
                  </Grid>
                </Grid>

                {/* Graphs Grid */}
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Paper 
                      elevation={1} 
                      sx={{ 
                        p: 2, 
                        height: '100%',
                        minHeight: '500px',
                        border: '1px solid #E0E0E0',
                        borderRadius: 1,
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                      }}
                    >
                      <Typography 
                        variant="h6" 
                        sx={{ 
                          mb: 2, 
                          color: '#3F334D',
                          fontWeight: 'medium'
                        }}
                      >
                        Bad Impressions from Total
                      </Typography>
                      <Box sx={{ height: 450 }}>
                        <BadFromTotalGraph partnerId={searchPartnerId} />
                      </Box>
                    </Paper>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Paper 
                      elevation={1} 
                      sx={{ 
                        p: 2, 
                        height: '100%',
                        minHeight: '400px',
                        border: '1px solid #E0E0E0',
                        borderRadius: 1,
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                      }}
                    >
                      <Typography 
                        variant="h6" 
                        sx={{ 
                          mb: 2, 
                          color: '#3F334D',
                          fontWeight: 'medium'
                        }}
                      >
                        Violations Analysis
                      </Typography>
                      <Box sx={{ height: 350, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                        <ViolationsPieChart 
                          partnerId={searchPartnerId} 
                          violationData={violationsDataArray}
                        />
                      </Box>
                    </Paper>
                  </Grid>
                </Grid>
              </CardContent>
            </Collapse>
          </Card>
        </Grid>

        {/* Tables Section */}
        {searchPartnerId && (
          <Grid item xs={12}>
            <Card>
              <CardHeader 
                title="Weekly Partner Data by Date" 
                sx={{ 
                  bgcolor: '#7D8491', 
                  color: '#FFFFFF',
                  '& .MuiCardHeader-title': {
                    fontSize: '1.2rem',
                    fontWeight: 'bold'
                  }
                }}
                action={
                  <IconButton
                    onClick={() => setIsTablesExpanded(!isTablesExpanded)}
                    sx={{ color: '#FFFFFF' }}
                  >
                    <ExpandMoreIcon
                      sx={{
                        transform: isTablesExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'transform 0.3s'
                      }}
                    />
                  </IconButton>
                }
              />
              <Collapse in={isTablesExpanded}>
                <CardContent sx={{ bgcolor: '#FFFFFF' }}>
                  <Stack spacing={1}>
                    {[...weeklyData].sort((a, b) => {
                      const [dayA, monthA, yearA] = a.date.split('/');
                      const [dayB, monthB, yearB] = b.date.split('/');
                      const dateA = new Date(2000 + parseInt(yearA), parseInt(monthA) - 1, parseInt(dayA));
                      const dateB = new Date(2000 + parseInt(yearB), parseInt(monthB) - 1, parseInt(dayB));
                      return dateB.getTime() - dateA.getTime(); // Reverse order
                    }).map((data, index) => (
                      <ExpandableCard 
                        key={data.date} 
                        isexpanded={(expandedCard === data.date).toString()}
                        index={index}
                        sx={{ 
                          transform: `translateY(${expandedCard === data.date ? 0 : index * -4}px)`,
                          zIndex: expandedCard === data.date ? 2 : 1,
                          position: 'relative',
                          boxShadow: expandedCard === data.date ? 3 : 1,
                          '&:hover': {
                            zIndex: 3,
                          }
                        }}
                      >
                        <ExpandableCardHeader
                          title={data.date}
                          onClick={() => handleCardClick(data.date)}
                          sx={{ 
                            bgcolor: '#F5F5F5',
                            color: '#000000',
                            '& .MuiCardHeader-title': {
                              fontSize: '1.1rem',
                              fontWeight: 'medium'
                            },
                            borderBottom: '1px solid rgba(0, 0, 0, 0.1)'
                          }}
                        />
                        <Collapse in={expandedCard === data.date} timeout="auto" unmountOnExit>
                          <CardContent sx={{ bgcolor: '#FFFFFF' }}>
                            <Grid container spacing={2}>
                              <Grid item xs={12}>
                                <DataTable
                                  date={data.date.replace(/\//g, '')}
                                  type="impressions_stats"
                                  partnerId={searchPartnerId}
                                />
                              </Grid>
                              <Grid item xs={12}>
                                <DataTable
                                  date={data.date.replace(/\//g, '')}
                                  type="bad_impressions"
                                  partnerId={searchPartnerId}
                                />
                              </Grid>
                            </Grid>
                          </CardContent>
                        </Collapse>
                      </ExpandableCard>
                    ))}
                  </Stack>
                </CardContent>
              </Collapse>
            </Card>
          </Grid>
        )}

        {/* No Partner ID Message */}
        {!searchPartnerId && (
          <Grid item xs={12}>
            <Paper elevation={3} sx={{ p: 3, textAlign: 'center', bgcolor: '#FFFFFF' }}>
              <Typography variant="h6" sx={{ color: '#3F334D' }}>
                Please enter a Partner ID to view detailed data
              </Typography>
            </Paper>
          </Grid>
        )}
      </Grid>
    </Container>
  );
};

export default PartnerAnalytics; 
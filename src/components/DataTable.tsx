import React, { useState, useEffect, useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  TableSortLabel,
  IconButton,
  Collapse,
  Box,
  Typography,
  useTheme,
  Alert,
  Button
} from '@mui/material';
import WarningIcon from '@mui/icons-material/Warning';
import BarChartIcon from '@mui/icons-material/BarChart';
import { format } from 'date-fns';
import { API_BASE_URL } from '../config';

interface DataTableProps {
  date: string;
  type: 'impressions_stats' | 'bad_impressions';
  partnerId?: string;
}

interface SortConfig {
  key: string;
  direction: 'asc' | 'desc';
}

interface TableData {
  [key: string]: string | number;
}

const DataTable: React.FC<DataTableProps> = ({ date, type, partnerId }) => {
  const [data, setData] = useState<TableData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortConfig, setSortConfig] = useState<SortConfig | null>(null);
  const [open, setOpen] = useState(true);
  const theme = useTheme();

  const handleSort = (header: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === header && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key: header, direction });
  };

  const sortedData = useMemo(() => {
    if (!data || !sortConfig) return data;

    return [...data].sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];

      // Handle percentage values
      if (sortConfig.key.toLowerCase().includes('percentage')) {
        const aNum = typeof aValue === 'string' 
          ? parseFloat(aValue.replace('%', '').trim())
          : typeof aValue === 'number' ? aValue : NaN;
        const bNum = typeof bValue === 'string'
          ? parseFloat(bValue.replace('%', '').trim())
          : typeof bValue === 'number' ? bValue : NaN;
        
        // Handle NaN values - always put them at the end
        if (isNaN(aNum) && isNaN(bNum)) return 0;
        if (isNaN(aNum)) return 1;
        if (isNaN(bNum)) return -1;
        
        // Sort numbers
        return sortConfig.direction === 'asc' 
          ? aNum - bNum
          : bNum - aNum;
      }

      // Handle numeric values
      const aNum = typeof aValue === 'number' ? aValue : parseFloat(String(aValue));
      const bNum = typeof bValue === 'number' ? bValue : parseFloat(String(bValue));
      
      // Handle NaN values - always put them at the end
      if (isNaN(aNum) && isNaN(bNum)) return 0;
      if (isNaN(aNum)) return 1;
      if (isNaN(bNum)) return -1;
      
      // If both values are valid numbers, sort them
      if (!isNaN(aNum) && !isNaN(bNum)) {
        return sortConfig.direction === 'asc' 
          ? aNum - bNum
          : bNum - aNum;
      }

      // Handle string values
      const aStr = String(aValue || '').toLowerCase();
      const bStr = String(bValue || '').toLowerCase();
      
      // Handle empty strings and null values - put them at the end
      if (!aStr && !bStr) return 0;
      if (!aStr) return 1;
      if (!bStr) return -1;
      
      return sortConfig.direction === 'asc'
        ? aStr.localeCompare(bStr)
        : bStr.localeCompare(aStr);
    });
  }, [data, sortConfig]);

  // Process and combine the data
  const processData = (impressionsData: any[], badImpressionsData: any[]) => {
    if (type === 'impressions_stats') {
      return impressionsData.map(row => ({
        partner_id: row.partner_id || row.partnerId || row['partner id'],
        impressions_count: row.impressions_count,
        bad_impressions_count: row.bad_impressions_count,
        bad_from_total_in_percentage: row.bad_from_total_in_percentage,
        violation_count: row.violation_count
      }));
    } else {
      return badImpressionsData.map(row => ({
        partner_id: row.partnerId,
        violation: row.violation,
        violation_count: row.violation_count
      }));
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('Fetching data from:', `${API_BASE_URL}/api/impressions-count/${date}`);
      const impressionsResponse = await fetch(`${API_BASE_URL}/api/impressions-count/${date}`);
      if (!impressionsResponse.ok) {
        throw new Error(`Failed to fetch impressions data: ${impressionsResponse.status} ${impressionsResponse.statusText}`);
      }
      const impressionsData = await impressionsResponse.json();

      console.log('Fetching data from:', `${API_BASE_URL}/api/bad-impressions/${date}`);
      const badImpressionsResponse = await fetch(`${API_BASE_URL}/api/bad-impressions/${date}`);
      if (!badImpressionsResponse.ok) {
        throw new Error(`Failed to fetch bad impressions data: ${badImpressionsResponse.status} ${badImpressionsResponse.statusText}`);
      }
      const badImpressionsData = await badImpressionsResponse.json();

      // Process and combine the data
      const processedData = processData(impressionsData, badImpressionsData);
      setData(processedData);
    } catch (error) {
      console.error('Error fetching data:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch data. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [date, type, partnerId]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={3}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 2 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button 
          variant="contained" 
          onClick={fetchData}
          sx={{ 
            bgcolor: '#574B60',
            '&:hover': {
              bgcolor: '#3F334D',
            }
          }}
        >
          Retry
        </Button>
      </Box>
    );
  }

  if (!data.length) {
    return (
      <Box p={3}>
        <Typography>No data available for the selected date.</Typography>
      </Box>
    );
  }

  const getTitle = () => {
    switch (type) {
      case 'bad_impressions':
        return 'Bad Impressions Report';
      case 'impressions_stats':
        return 'Impressions Stats Report';
      default:
        return '';
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'bad_impressions':
        return <WarningIcon sx={{ color: 'error.main', fontSize: 28 }} />;
      case 'impressions_stats':
        return <BarChartIcon sx={{ color: 'success.main', fontSize: 28 }} />;
      default:
        return null;
    }
  };

  const getThemeColors = () => {
    switch (type) {
      case 'bad_impressions':
        return {
          main: '#d32f2f', // Red
          light: '#ef5350',
          dark: '#c62828',
          hover: '#ffebee',
          selected: '#ffcdd2'
        };
      case 'impressions_stats':
        return {
          main: '#2e7d32', // Green
          light: '#4caf50',
          dark: '#1b5e20',
          hover: '#e8f5e9',
          selected: '#c8e6c9'
        };
      default:
        return {
          main: '#1976d2',
          light: '#42a5f5',
          dark: '#1565c0',
          hover: '#e3f2fd',
          selected: '#bbdefb'
        };
    }
  };

  const colors = getThemeColors();

  const getColorForValue = (value: number, type: string) => {
    if (type === 'impressions_stats') {
      if (value >= 90) return '#2E7D32'; // Dark green
      if (value >= 80) return '#388E3C'; // Medium dark green
      if (value >= 70) return '#558B2F'; // Olive green
      if (value >= 60) return '#7CB342'; // Light olive
      return '#9E9D24'; // Dark yellow-green
    } else {
      if (value >= 90) return '#C62828'; // Dark red
      if (value >= 80) return '#D32F2F'; // Medium dark red
      if (value >= 70) return '#E53935'; // Medium red
      if (value >= 60) return '#EF5350'; // Light red
      return '#FF8A80'; // Very light red
    }
  };

  return (
    <Paper elevation={3} sx={{ p: 2 }}>
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        mb: 2,
        borderBottom: `1px solid ${theme.palette.divider}`,
        pb: 2
      }}>
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 1,
          flexGrow: 1 
        }}>
          {getIcon()}
          <Typography variant="h6" sx={{ 
            color: colors.main,
            fontWeight: 600
          }}>
            {getTitle()}
          </Typography>
        </Box>
        <IconButton onClick={() => setOpen(!open)}>
          {open ? '−' : '+'}
        </IconButton>
      </Box>
      <Collapse in={open}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                {Object.keys(data[0]).map((header) => (
                  <TableCell
                    key={header}
                    sx={{
                      fontWeight: 'bold',
                      bgcolor: '#f5f5f5',
                      borderColor: colors.dark
                    }}
                  >
                    <TableSortLabel
                      active={sortConfig?.key === header}
                      direction={sortConfig?.key === header ? sortConfig.direction : 'asc'}
                      onClick={() => handleSort(header)}
                      sx={{
                        color: 'black',
                        '&.MuiTableSortLabel-root': { color: 'black' },
                        '&.MuiTableSortLabel-root:hover': { color: 'black' },
                        '&.Mui-active': { color: 'black' },
                        '& .MuiTableSortLabel-icon': { color: 'black !important' }
                      }}
                    >
                      {header}
                    </TableSortLabel>
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {sortedData.map((row, rowIndex) => (
                <TableRow
                  key={rowIndex}
                  sx={{
                    '&:nth-of-type(odd)': { bgcolor: colors.hover },
                    '&:hover': { bgcolor: colors.selected }
                  }}
                >
                  {Object.entries(row).map(([key, value], cellIndex) => (
                    <TableCell 
                      key={key}
                      align={typeof value === 'number' ? 'right' : 'left'}
                      sx={key.toLowerCase().includes('percentage') ? {
                        color: getColorForValue(parseFloat(String(value)), type),
                        fontWeight: 'medium',
                        fontSize: '0.9rem'
                      } : {}}
                    >
                      {typeof value === 'number' ? value.toLocaleString() : String(value)}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Collapse>
    </Paper>
  );
};

export default DataTable; 
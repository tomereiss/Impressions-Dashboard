import React, { useState, useEffect, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Box, CircularProgress, Typography } from '@mui/material';
import { API_BASE_URL } from '../config';

interface BadFromTotalGraphProps {
  partnerId: string;
}

interface DataPoint {
  date: string;
  percentage: number;
}

// Custom hook for data fetching
const usePartnerStats = (partnerId: string) => {
  const [data, setData] = useState<DataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!partnerId) {
        setData([]);
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        // First get available dates
        const datesResponse = await fetch(`${API_BASE_URL}/api/available-dates`);
        if (!datesResponse.ok) {
          throw new Error('Failed to fetch available dates');
        }
        const dates = await datesResponse.json();

        // Then fetch data for each date
        const dataPoints: DataPoint[] = [];
        for (const date of dates) {
          const response = await fetch(`${API_BASE_URL}/api/impressions-count/${date}`);
          if (response.ok) {
            const impressionsData = await response.json();
            const partnerData = impressionsData.find((row: any) => 
              String(row.partner_id || row.partnerId || row['partner id']).trim() === String(partnerId).trim()
            );
            
            if (partnerData) {
              const percentage = parseFloat(partnerData.bad_from_total_in_percentage) || 0;
              
              // Format date as DD/MM/YY
              const formattedDate = `${date.substring(0, 2)}/${date.substring(2, 4)}/${date.substring(4, 6)}`;
              
              dataPoints.push({
                date: formattedDate,
                percentage: percentage
              });
            }
          }
        }

        // Sort data by date
        dataPoints.sort((a, b) => {
          const [dayA, monthA, yearA] = a.date.split('/');
          const [dayB, monthB, yearB] = b.date.split('/');
          const dateA = new Date(2000 + parseInt(yearA), parseInt(monthA) - 1, parseInt(dayA));
          const dateB = new Date(2000 + parseInt(yearB), parseInt(monthB) - 1, parseInt(dayB));
          return dateA.getTime() - dateB.getTime();
        });

        console.log('Final data points for partner', partnerId, ':', dataPoints);
        setData(dataPoints);
      } catch (err) {
        console.error('Error fetching partner stats:', err);
        setError('Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [partnerId]);

  return { data, loading, error };
};

const BadFromTotalGraph: React.FC<BadFromTotalGraphProps> = React.memo(({ partnerId }) => {
  const { data, loading, error } = usePartnerStats(partnerId);

  // Memoize the chart component to prevent unnecessary re-renders
  const chartComponent = useMemo(() => {
    if (loading) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
          <CircularProgress />
        </Box>
      );
    }

    if (error) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
          <Typography color="error">{error}</Typography>
        </Box>
      );
    }

    if (data.length === 0) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
          <Typography color="text.secondary">No data available</Typography>
        </Box>
      );
    }

    return (
      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E0E0E0" />
          <XAxis 
            dataKey="date" 
            stroke="#3F334D"
            tick={{ fill: '#3F334D' }}
          />
          <YAxis 
            domain={[0, 100]} 
            tickFormatter={v => `${v}%`} 
            stroke="#3F334D"
            tick={{ fill: '#3F334D' }}
          />
          <Tooltip 
            formatter={(value: number) => [`${value}%`, 'Bad Impressions']}
            contentStyle={{
              backgroundColor: '#FFFFFF',
              border: '1px solid #E0E0E0',
              borderRadius: '4px',
              color: '#3F334D'
            }}
          />
          <Line 
            type="monotone" 
            dataKey="percentage" 
            stroke="#574B60" 
            strokeWidth={2}
            dot={{ fill: '#574B60', strokeWidth: 2 }}
            activeDot={{ r: 6, fill: '#3F334D' }}
          />
        </LineChart>
      </ResponsiveContainer>
    );
  }, [data, loading, error]);

  return chartComponent;
});

BadFromTotalGraph.displayName = 'BadFromTotalGraph';

export default BadFromTotalGraph; 
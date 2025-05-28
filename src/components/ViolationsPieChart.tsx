import React, { useMemo } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend
} from 'recharts';
import { Box, Typography } from '@mui/material';

interface ViolationData {
  date: string;
  totalBadImpressions: number;
  violations: {
    type: string;
    count: number;
  }[];
}

interface ViolationsPieChartProps {
  partnerId: string;
  violationData: ViolationData[];
}

const COLORS = ['#574B60', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEEAD', '#D4A5A5', '#3498DB', '#2E86C1'];

const ViolationsPieChart: React.FC<ViolationsPieChartProps> = React.memo(({ partnerId, violationData }) => {
  // Memoize the data processing
  const pieData = useMemo(() => {
    // Aggregate violations across all dates
    const aggregatedViolations = violationData.reduce((acc, data) => {
      data.violations.forEach(violation => {
        const existingViolation = acc.find(v => v.type === violation.type);
        if (existingViolation) {
          existingViolation.count += violation.count;
        } else {
          acc.push({ ...violation });
        }
      });
      return acc;
    }, [] as { type: string; count: number }[]);

    // Sort violations by count in descending order
    const sortedViolations = [...aggregatedViolations].sort((a, b) => b.count - a.count);

    // Format the data for the pie chart
    const result = sortedViolations.map(violation => ({
      name: violation.type,
      value: violation.count
    }));

    console.log('Final pie chart data for partner', partnerId, ':', result);
    return result;
  }, [violationData, partnerId]);

  if (pieData.length === 0) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100%' 
      }}>
        <Typography variant="h6" color="text.secondary">
          No violation data available
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ height: '100%', width: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ flex: 1, minHeight: '350px', width: '100%', position: 'relative' }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              outerRadius={120}
              fill="#8884d8"
              paddingAngle={5}
              dataKey="value"
              label={({ percent }) => `${(percent * 100).toFixed(1)}%`}
              labelLine={false}
            >
              {pieData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip 
              formatter={(value: number) => value.toLocaleString()}
              contentStyle={{
                backgroundColor: '#FFFFFF',
                border: '1px solid #E0E0E0',
                borderRadius: '4px',
                color: '#3F334D'
              }}
            />
            <Legend
              layout="horizontal"
              align="center"
              verticalAlign="bottom"
              formatter={(value) => value}
              wrapperStyle={{
                paddingTop: '20px',
                width: '100%',
                display: 'flex',
                justifyContent: 'center',
                flexWrap: 'wrap',
                gap: '10px'
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </Box>
    </Box>
  );
});

ViolationsPieChart.displayName = 'ViolationsPieChart';

export default ViolationsPieChart;
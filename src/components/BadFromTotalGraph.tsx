import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface BadFromTotalGraphProps {
  partnerId: string;
}

interface DataPoint {
  date: string;
  percentage: number;
}

const BadFromTotalGraph: React.FC<BadFromTotalGraphProps> = ({ partnerId }) => {
  const [data, setData] = useState<DataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!partnerId) return;
      
      try {
        setLoading(true);
        // First get available dates
        const datesResponse = await fetch('http://localhost:3001/api/available-dates');
        if (!datesResponse.ok) {
          throw new Error('Failed to fetch available dates');
        }
        const dates = await datesResponse.json();

        // Then fetch data for each date
        const dataPoints: DataPoint[] = [];
        for (const date of dates) {
          const response = await fetch(`http://localhost:3001/api/impressions-count/${date}`);
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

              // Debug log for each data point
              console.log(`Date: ${formattedDate}`);
              console.log(`Bad from Total Percentage: ${percentage}%`);
              console.log('------------------------');
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

        console.log('Final sorted data points:', dataPoints);
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

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>{error}</div>;
  }

  if (data.length === 0) {
    return <div>No data available</div>;
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
};

export default BadFromTotalGraph; 
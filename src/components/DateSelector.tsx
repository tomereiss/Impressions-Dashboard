import React, { useState, useEffect } from 'react';
import { FormControl, InputLabel, Select, MenuItem, SelectChangeEvent } from '@mui/material';

interface DateSelectorProps {
  onDateChange: (date: string | null) => void;
}

const DateSelector: React.FC<DateSelectorProps> = ({ onDateChange }) => {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [availableDates, setAvailableDates] = useState<string[]>([]);

  // Format date for display (DDMMYY -> DD/MM/YY)
  const formatDateForDisplay = (date: string) => {
    const day = date.substring(0, 2);
    const month = date.substring(2, 4);
    const year = date.substring(4, 6);
    return `${day}/${month}/${year}`;
  };

  const fetchAvailableDates = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/available-dates');
      if (!response.ok) {
        throw new Error('Failed to fetch available dates');
      }
      const dates = await response.json();
      
      // Only set dates that exist in both directories
      if (Array.isArray(dates) && dates.length > 0) {
        setAvailableDates(dates);
        // Set the most recent date as default
        setSelectedDate(dates[0]);
        onDateChange(dates[0]);
      }
    } catch (error) {
      console.error('Error fetching available dates:', error);
    }
  };

  useEffect(() => {
    fetchAvailableDates();
  }, []);

  const handleDateChange = (event: SelectChangeEvent<string>) => {
    const newDate = event.target.value;
    setSelectedDate(newDate);
    onDateChange(newDate);
  };

  return (
    <FormControl fullWidth>
      <InputLabel>Select Date</InputLabel>
      <Select
        value={selectedDate || ''}
        onChange={handleDateChange}
        label="Select Date"
      >
        {availableDates.map((date) => (
          <MenuItem key={date} value={date}>
            {formatDateForDisplay(date)}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};

export default DateSelector; 
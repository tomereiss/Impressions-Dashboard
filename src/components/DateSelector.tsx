import React, { useState, useEffect } from 'react';
import { Box, FormControl, InputLabel, Select, MenuItem, SelectChangeEvent } from '@mui/material';
import { API_BASE_URL } from '../config';

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
      const response = await fetch(`${API_BASE_URL}/api/available-dates`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const dates = await response.json();
      setAvailableDates(dates);
      if (dates.length > 0 && !selectedDate) {
        setSelectedDate(dates[0]);
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
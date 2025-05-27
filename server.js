const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { parse } = require('csv-parse/sync');

const app = express();
const PORT = process.env.PORT || 3001;

// Enable CORS for all routes
app.use(cors());

// Serve static files from the React app in production
if (process.env.NODE_ENV === 'production') {
  // Serve static files from the React app
  app.use(express.static(path.join(__dirname, 'build')));

  // Handle React routing, return all requests to React app
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'build', 'index.html'));
  });
}

// Helper function to read CSV file
const readCSVFile = (filePath) => {
  try {
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    return parse(fileContent, {
      columns: true,
      skip_empty_lines: true
    });
  } catch (error) {
    console.error(`Error reading CSV file ${filePath}:`, error);
    return [];
  }
};

// Get available dates
app.get('/api/available-dates', (req, res) => {
  try {
    const dataDir = process.env.NODE_ENV === 'production' 
      ? path.join(__dirname, 'build', 'data')
      : path.join(__dirname, 'data');
    
    const files = fs.readdirSync(dataDir);
    const dates = files
      .filter(file => file.endsWith('.csv'))
      .map(file => file.replace('.csv', ''))
      .sort();
    
    res.json(dates);
  } catch (error) {
    console.error('Error getting available dates:', error);
    res.status(500).json({ error: 'Failed to get available dates' });
  }
});

// Get impressions count data for a specific date
app.get('/api/impressions-count/:date', (req, res) => {
  try {
    const { date } = req.params;
    const dataDir = process.env.NODE_ENV === 'production' 
      ? path.join(__dirname, 'build', 'data')
      : path.join(__dirname, 'data');
    
    const filePath = path.join(dataDir, `${date}.csv`);
    const data = readCSVFile(filePath);
    res.json(data);
  } catch (error) {
    console.error(`Error getting impressions count for date ${req.params.date}:`, error);
    res.status(500).json({ error: 'Failed to get impressions count data' });
  }
});

// Get bad impressions data for a specific date
app.get('/api/bad-impressions/:date', (req, res) => {
  try {
    const { date } = req.params;
    const dataDir = process.env.NODE_ENV === 'production' 
      ? path.join(__dirname, 'build', 'data')
      : path.join(__dirname, 'data');
    
    const filePath = path.join(dataDir, `${date}.csv`);
    const data = readCSVFile(filePath);
    res.json(data);
  } catch (error) {
    console.error(`Error getting bad impressions for date ${req.params.date}:`, error);
    res.status(500).json({ error: 'Failed to get bad impressions data' });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Data directory: ${process.env.NODE_ENV === 'production' 
    ? path.join(__dirname, 'build', 'data')
    : path.join(__dirname, 'data')}`);
}); 
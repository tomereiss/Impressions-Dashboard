const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { parse } = require('csv-parse/sync');

const app = express();
const PORT = process.env.PORT || 3001;

// Enable CORS for all routes
app.use(cors());

// Determine data directory based on environment
const getDataDir = () => {
  const isDev = process.env.NODE_ENV !== 'production';
  return isDev 
    ? path.join(__dirname, 'src', 'data')
    : path.join(__dirname, 'build', 'data');
};

// Serve static files from the React app
app.use(express.static(path.join(__dirname, 'build')));

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
    const dataDir = getDataDir();
    const impressionsDir = path.join(dataDir, 'impressions-count');
    const badDir = path.join(dataDir, 'bad-impressions');
    const impressionsDates = new Set();
    const badDates = new Set();
    const dateRegex = /_(\d{6})(?:_report)?\.csv$/;

    if (fs.existsSync(impressionsDir)) {
      fs.readdirSync(impressionsDir).forEach(file => {
        if (file.endsWith('.csv')) {
          const match = file.match(dateRegex);
          if (match) impressionsDates.add(match[1]);
        }
      });
    }
    if (fs.existsSync(badDir)) {
      fs.readdirSync(badDir).forEach(file => {
        if (file.endsWith('.csv')) {
          const match = file.match(dateRegex);
          if (match) badDates.add(match[1]);
        }
      });
    }
    // Only include dates that have both files
    const availableDates = Array.from(impressionsDates).filter(date => badDates.has(date)).sort().reverse();
    res.json(availableDates);
  } catch (error) {
    console.error('Error getting available dates:', error);
    res.status(500).json({ error: 'Failed to get available dates' });
  }
});

// Get impressions count data for a specific date
app.get('/api/impressions-count/:date', (req, res) => {
  try {
    const { date } = req.params;
    console.log(`[${new Date().toISOString()}] Received request for impressions count, date: ${date}`);
    console.log(`[${new Date().toISOString()}] Request headers:`, req.headers);
    
    const dataDir = path.join(getDataDir(), 'impressions-count');
    console.log(`[${new Date().toISOString()}] Looking in directory: ${dataDir}`);
    
    const files = fs.readdirSync(dataDir);
    console.log(`[${new Date().toISOString()}] Found ${files.length} files in directory`);
    
    // Look for files with either format: _date_report.csv or _date.csv
    const matchingFile = files.find(file => file.match(new RegExp(`_${date}(_report)?\\.csv$`)));
    if (!matchingFile) {
      console.log(`[${new Date().toISOString()}] No matching file found for date: ${date}`);
      return res.status(404).json({ error: 'File not found' });
    }
    
    const filePath = path.join(dataDir, matchingFile);
    console.log(`[${new Date().toISOString()}] Reading file: ${filePath}`);
    
    const data = readCSVFile(filePath);
    console.log(`[${new Date().toISOString()}] Successfully read ${data.length} records`);
    
    // Return the data exactly as it is in the CSV
    res.json(data);
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Error getting impressions count for date ${req.params.date}:`, error);
    res.status(500).json({ error: 'Failed to get impressions count data' });
  }
});

// Get bad impressions data for a specific date
app.get('/api/bad-impressions/:date', (req, res) => {
  try {
    const { date } = req.params;
    const dataDir = path.join(getDataDir(), 'bad-impressions');
    const files = fs.readdirSync(dataDir);
    
    // Look for files with either format: _date_report.csv or _date.csv
    const matchingFile = files.find(file => 
      file.includes(`_${date}_report.csv`) || file.includes(`_${date}.csv`)
    );
    
    if (!matchingFile) {
      console.log('File not found for date:', date);
      return res.status(404).json({ error: 'File not found' });
    }
    
    const filePath = path.join(dataDir, matchingFile);
    console.log('Reading bad impressions from:', filePath);
    
    const data = readCSVFile(filePath);
    console.log(`Found ${data.length} records for date ${date}`);
    res.json(data);
  } catch (error) {
    console.error(`Error getting bad impressions for date ${req.params.date}:`, error);
    res.status(500).json({ error: 'Failed to get bad impressions data' });
  }
});

// Handle React routing, return all requests to React app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Data directory: ${getDataDir()}`);
}); 
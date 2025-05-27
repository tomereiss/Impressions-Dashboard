const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { parse } = require('csv-parse/sync');

const app = express();
const PORT = process.env.PORT || 3001;

// Enable CORS for all routes
app.use(cors());

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
    const dataDir = path.join(__dirname, 'build', 'data');
    console.log('Reading from data directory:', dataDir);
    
    if (!fs.existsSync(dataDir)) {
      console.log('Data directory does not exist, creating it...');
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    const files = fs.readdirSync(dataDir);
    console.log('Found files:', files);
    
    const dates = files
      .filter(file => file.endsWith('.csv'))
      .map(file => file.replace('.csv', ''))
      .sort();
    
    console.log('Available dates:', dates);
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
    const dataDir = path.join(__dirname, 'build', 'data');
    const filePath = path.join(dataDir, `${date}.csv`);
    
    console.log('Reading impressions count from:', filePath);
    
    if (!fs.existsSync(filePath)) {
      console.log('File not found:', filePath);
      return res.status(404).json({ error: 'File not found' });
    }
    
    const data = readCSVFile(filePath);
    console.log(`Found ${data.length} records for date ${date}`);
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
    const dataDir = path.join(__dirname, 'build', 'data');
    const filePath = path.join(dataDir, `${date}.csv`);
    
    console.log('Reading bad impressions from:', filePath);
    
    if (!fs.existsSync(filePath)) {
      console.log('File not found:', filePath);
      return res.status(404).json({ error: 'File not found' });
    }
    
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

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Data directory: ${path.join(__dirname, 'build', 'data')}`);
}); 
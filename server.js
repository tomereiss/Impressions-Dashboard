const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { parse } = require('csv-parse/sync');
const app = express();
const port = process.env.PORT || 3001;

// Enable CORS for all routes
app.use(cors());
app.use(express.json());

// Serve static files from the React build directory
app.use(express.static(path.join(__dirname, 'build')));

// Helper function to get data directory path
const getDataDir = () => {
  // In production (Heroku), use the build directory
  if (process.env.NODE_ENV === 'production') {
    return path.join(__dirname, 'build', 'data');
  }
  // In development, use the src directory
  return path.join(__dirname, 'src', 'data');
};

// API Routes
app.get('/api/available-dates', (req, res) => {
  try {
    const dataDir = getDataDir();
    const badImpressionsDir = path.join(dataDir, 'bad-impressions');
    const impressionsCountDir = path.join(dataDir, 'impressions-count');

    console.log('Reading from directories:');
    console.log('Bad impressions:', badImpressionsDir);
    console.log('Impressions count:', impressionsCountDir);

    // Read files from both directories
    const badImpressionsFiles = fs.readdirSync(badImpressionsDir)
      .filter(file => file.endsWith('.csv'))
      .map(file => file.replace('bad_impressions_', '').replace('.csv', ''));

    const impressionsCountFiles = fs.readdirSync(impressionsCountDir)
      .filter(file => file.endsWith('.csv'))
      .map(file => file.replace('impressions_count_', '').replace('_report.csv', ''));

    // Find common dates
    const commonDates = badImpressionsFiles.filter(date => impressionsCountFiles.includes(date));
    console.log('Available dates:', commonDates);

    res.json(commonDates);
  } catch (error) {
    console.error('Error getting available dates:', error);
    res.status(500).json({ error: 'Failed to get available dates' });
  }
});

// Endpoint to get bad impressions data
app.get('/api/bad-impressions/:date', (req, res) => {
  try {
    const date = req.params.date;
    const filePath = path.join(getDataDir(), 'bad-impressions', `bad_impressions_${date}.csv`);
    
    console.log('Reading bad impressions from:', filePath);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found' });
    }

    const data = readCSVFile(filePath);
    res.json(data);
  } catch (error) {
    console.error('Error reading bad impressions file:', error);
    res.status(500).json({ error: 'Failed to read bad impressions data' });
  }
});

// Endpoint to get impressions count data
app.get('/api/impressions-count/:date', (req, res) => {
  try {
    const date = req.params.date;
    const filePath = path.join(getDataDir(), 'impressions-count', `impressions_count_${date}_report.csv`);
    
    console.log('Reading impressions count from:', filePath);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found' });
    }

    const data = readCSVFile(filePath);
    res.json(data);
  } catch (error) {
    console.error('Error reading impressions count file:', error);
    res.status(500).json({ error: 'Failed to read impressions count data' });
  }
});

// Helper function to read CSV file
const readCSVFile = (filePath) => {
  const fileContent = fs.readFileSync(filePath, 'utf-8');
  const records = parse(fileContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true
  });
  return records;
};

// The "catchall" handler: for any request that doesn't
// match one above, send back React's index.html file.
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
  console.log(`You can access the server at:`);
  console.log(`- Local: http://localhost:${port}`);
  console.log(`- Heroku: https://your-app-name.herokuapp.com`);
  console.log('Environment:', process.env.NODE_ENV || 'development');
  console.log('Data directory:', getDataDir());
}); 
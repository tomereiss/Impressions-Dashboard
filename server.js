const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const csv = require('csv-parser');
const app = express();
const port = process.env.PORT || 3001;

// Enable CORS for all routes
app.use(cors());
app.use(express.json());

// Serve static files from the React build directory
app.use(express.static(path.join(__dirname, 'build')));

// API Routes
app.get('/api/available-dates', (req, res) => {
  const badImpressionsDir = path.join(__dirname, 'src', 'data', 'bad-impressions');
  const impressionsCountDir = path.join(__dirname, 'src', 'data', 'impressions-count');

  console.log('Bad impressions files directory:', badImpressionsDir);
  console.log('Impressions count files directory:', impressionsCountDir);

  // Check if directories exist
  if (!fs.existsSync(badImpressionsDir)) {
    console.log('Directory does not exist:', badImpressionsDir);
    return res.status(500).json({ error: 'Bad impressions directory not found' });
  }
  if (!fs.existsSync(impressionsCountDir)) {
    console.log('Directory does not exist:', impressionsCountDir);
    return res.status(500).json({ error: 'Impressions count directory not found' });
  }

  console.log('Directory exists:', badImpressionsDir);
  console.log('Directory exists:', impressionsCountDir);

  // Read files from both directories
  const badImpressionsFiles = fs.readdirSync(badImpressionsDir)
    .filter(file => file.endsWith('.csv'))
    .map(file => file.replace('bad_impressions_', '').replace('.csv', ''));

  const impressionsCountFiles = fs.readdirSync(impressionsCountDir)
    .filter(file => file.endsWith('.csv'))
    .map(file => file.replace('impressions_count_', '').replace('_report.csv', ''));

  console.log('Files in', badImpressionsDir + ':', fs.readdirSync(badImpressionsDir));
  console.log('Files in', impressionsCountDir + ':', fs.readdirSync(impressionsCountDir));

  // Find common dates
  const commonDates = badImpressionsFiles.filter(date => impressionsCountFiles.includes(date));
  console.log('Available dates:', commonDates);

  res.json(commonDates);
});

// Endpoint to get bad impressions data
app.get('/api/bad-impressions/:date', (req, res) => {
  try {
    const date = req.params.date; // Already in DDMMYY format
    const filePath = path.join(__dirname, 'src', 'data', 'bad-impressions', `bad_impressions_${date}.csv`);
    
    if (!fs.existsSync(filePath)) {
      console.error(`File not found: ${filePath}`);
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
    const date = req.params.date; // Already in DDMMYY format
    const filePath = path.join(__dirname, 'src', 'data', 'impressions-count', `impressions_count_${date}_report.csv`);
    
    if (!fs.existsSync(filePath)) {
      console.error(`File not found: ${filePath}`);
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
  const records = csv.parse(fileContent, {
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

app.listen(port, '0.0.0.0', () => {
  console.log(`Server is running!`);
  console.log(`You can access the server at:`);
  console.log(`- Local: http://localhost:${port}`);
  console.log(`- Network: http://${process.env.HOST || '0.0.0.0'}:${port}`);
  console.log('\nData directories:');
  console.log(`- Bad impressions: ${path.join(__dirname, 'src', 'data', 'bad-impressions')}`);
  console.log(`- Impressions count: ${path.join(__dirname, 'src', 'data', 'impressions-count')}`);
}); 
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

// API Routes
app.get('/api/available-dates', (req, res) => {
  // Look for data in both possible locations
  const possiblePaths = [
    path.join(__dirname, 'src', 'data'),
    path.join(__dirname, 'build', 'data')
  ];

  let badImpressionsDir = null;
  let impressionsCountDir = null;

  // Find the correct paths
  for (const basePath of possiblePaths) {
    const badPath = path.join(basePath, 'bad-impressions');
    const countPath = path.join(basePath, 'impressions-count');
    
    if (fs.existsSync(badPath) && fs.existsSync(countPath)) {
      badImpressionsDir = badPath;
      impressionsCountDir = countPath;
      break;
    }
  }

  if (!badImpressionsDir || !impressionsCountDir) {
    console.error('Data directories not found in any location');
    return res.status(500).json({ error: 'Data directories not found' });
  }

  try {
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
    console.error('Error reading directories:', error);
    res.status(500).json({ error: 'Failed to read data directories' });
  }
});

// Endpoint to get bad impressions data
app.get('/api/bad-impressions/:date', (req, res) => {
  try {
    const date = req.params.date;
    const possiblePaths = [
      path.join(__dirname, 'src', 'data', 'bad-impressions'),
      path.join(__dirname, 'build', 'data', 'bad-impressions')
    ];

    let filePath = null;
    for (const basePath of possiblePaths) {
      const path = path.join(basePath, `bad_impressions_${date}.csv`);
      if (fs.existsSync(path)) {
        filePath = path;
        break;
      }
    }

    if (!filePath) {
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
    const possiblePaths = [
      path.join(__dirname, 'src', 'data', 'impressions-count'),
      path.join(__dirname, 'build', 'data', 'impressions-count')
    ];

    let filePath = null;
    for (const basePath of possiblePaths) {
      const path = path.join(basePath, `impressions_count_${date}_report.csv`);
      if (fs.existsSync(path)) {
        filePath = path;
        break;
      }
    }

    if (!filePath) {
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
}); 
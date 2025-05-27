const fs = require('fs-extra');
const path = require('path');

// Source and destination directories
const srcDataDir = path.join(__dirname, 'src', 'data');
const buildDataDir = path.join(__dirname, 'build', 'data');

// Ensure the build/data directory exists
fs.ensureDirSync(buildDataDir);

// Copy the data directory
fs.copySync(srcDataDir, buildDataDir, {
  filter: (src) => {
    // Only copy CSV files
    return src.endsWith('.csv');
  }
});

console.log('Data files copied successfully to build directory!'); 
const fs = require('fs');
const path = require('path');

// Source and destination directories
const sourceDir = path.join(__dirname, 'data');
const destDir = path.join(__dirname, 'build', 'data');

// Create source directory if it doesn't exist
if (!fs.existsSync(sourceDir)) {
  console.log('Creating source data directory...');
  fs.mkdirSync(sourceDir, { recursive: true });
}

// Create destination directory if it doesn't exist
if (!fs.existsSync(destDir)) {
  console.log('Creating destination data directory...');
  fs.mkdirSync(destDir, { recursive: true });
}

// Copy all CSV files from source to destination
try {
  console.log('Checking for CSV files in:', sourceDir);
  const files = fs.readdirSync(sourceDir);
  
  if (files.length === 0) {
    console.log('No CSV files found in source directory.');
    process.exit(0);
  }

  let copiedCount = 0;
  files.forEach(file => {
    if (file.endsWith('.csv')) {
      const sourcePath = path.join(sourceDir, file);
      const destPath = path.join(destDir, file);
      fs.copyFileSync(sourcePath, destPath);
      console.log(`Copied ${file} to build directory`);
      copiedCount++;
    }
  });

  if (copiedCount === 0) {
    console.log('No CSV files were copied. Please ensure you have .csv files in the data directory.');
  } else {
    console.log(`Successfully copied ${copiedCount} CSV files to build directory!`);
  }
} catch (error) {
  console.error('Error copying data files:', error);
  // Don't exit with error code to allow build to continue
  console.log('Continuing with build process...');
} 
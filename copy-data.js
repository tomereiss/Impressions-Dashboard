const fs = require('fs');
const path = require('path');

// Source and destination directories
const sourceDir = path.join(__dirname, 'src', 'data');
const destDir = path.join(__dirname, 'build', 'data');

console.log('Starting data file copy process...');
console.log('Source directory:', sourceDir);
console.log('Destination directory:', destDir);

// Create destination directory if it doesn't exist
if (!fs.existsSync(destDir)) {
  console.log('Creating destination data directory...');
  fs.mkdirSync(destDir, { recursive: true });
}

// Function to copy CSV files from a directory
const copyCSVFiles = (sourcePath, destPath) => {
  const files = fs.readdirSync(sourcePath);
  let copiedCount = 0;

  files.forEach(file => {
    if (file.endsWith('.csv')) {
      const sourceFilePath = path.join(sourcePath, file);
      const destFilePath = path.join(destPath, file);
      
      // Create a copy of the file with the same name
      fs.copyFileSync(sourceFilePath, destFilePath);
      console.log(`Copied ${file} to ${destPath}`);
      copiedCount++;
    }
  });

  return copiedCount;
};

// Copy all CSV files from source to destination
try {
  console.log('Checking for CSV files in:', sourceDir);
  const subdirs = fs.readdirSync(sourceDir);
  
  if (subdirs.length === 0) {
    console.log('No subdirectories found in source directory.');
    process.exit(1);
  }

  let totalCopied = 0;
  subdirs.forEach(subdir => {
    const subdirPath = path.join(sourceDir, subdir);
    if (fs.statSync(subdirPath).isDirectory()) {
      console.log(`Processing directory: ${subdir}`);
      // Create the corresponding subdirectory in the destination
      const destSubdirPath = path.join(destDir, subdir);
      if (!fs.existsSync(destSubdirPath)) {
        fs.mkdirSync(destSubdirPath, { recursive: true });
      }
      const copied = copyCSVFiles(subdirPath, destSubdirPath);
      totalCopied += copied;
    }
  });

  if (totalCopied === 0) {
    console.log('No CSV files were copied. Please ensure you have .csv files in the src/data subdirectories.');
    process.exit(1);
  } else {
    console.log(`Successfully copied ${totalCopied} CSV files to build directory!`);
  }
} catch (error) {
  console.error('Error copying data files:', error);
  process.exit(1);
} 
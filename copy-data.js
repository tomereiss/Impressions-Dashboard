const fs = require('fs');
const path = require('path');

// Source and destination directories
const sourceDir = path.join(__dirname, 'data');
const destDir = path.join(__dirname, 'build', 'data');

// Create destination directory if it doesn't exist
if (!fs.existsSync(destDir)) {
  fs.mkdirSync(destDir, { recursive: true });
}

// Copy all CSV files from source to destination
try {
  const files = fs.readdirSync(sourceDir);
  files.forEach(file => {
    if (file.endsWith('.csv')) {
      const sourcePath = path.join(sourceDir, file);
      const destPath = path.join(destDir, file);
      fs.copyFileSync(sourcePath, destPath);
      console.log(`Copied ${file} to build directory`);
    }
  });
  console.log('Data files copied successfully!');
} catch (error) {
  console.error('Error copying data files:', error);
  process.exit(1);
} 
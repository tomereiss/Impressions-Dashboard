const AWS = require('aws-sdk');
const fs = require('fs');
const path = require('path');

// Configure AWS
AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION || 'us-east-1'
});

const s3 = new AWS.S3();
const BUCKET_NAME = process.env.AWS_BUCKET_NAME;

// Function to upload a file to S3
const uploadFile = async (filePath, key) => {
  const fileContent = fs.readFileSync(filePath);
  const params = {
    Bucket: BUCKET_NAME,
    Key: key,
    Body: fileContent
  };

  try {
    await s3.upload(params).promise();
    console.log(`Successfully uploaded ${key}`);
  } catch (error) {
    console.error(`Error uploading ${key}:`, error);
  }
};

// Upload all CSV files
const uploadAllFiles = async () => {
  const badImpressionsDir = path.join(__dirname, 'src', 'data', 'bad-impressions');
  const impressionsCountDir = path.join(__dirname, 'src', 'data', 'impressions-count');

  // Upload bad impressions files
  const badImpressionsFiles = fs.readdirSync(badImpressionsDir)
    .filter(file => file.endsWith('.csv'));

  for (const file of badImpressionsFiles) {
    const filePath = path.join(badImpressionsDir, file);
    const key = `bad-impressions/${file}`;
    await uploadFile(filePath, key);
  }

  // Upload impressions count files
  const impressionsCountFiles = fs.readdirSync(impressionsCountDir)
    .filter(file => file.endsWith('.csv'));

  for (const file of impressionsCountFiles) {
    const filePath = path.join(impressionsCountDir, file);
    const key = `impressions-count/${file}`;
    await uploadFile(filePath, key);
  }
};

// Run the upload
uploadAllFiles().then(() => {
  console.log('Upload complete!');
}).catch(error => {
  console.error('Upload failed:', error);
}); 
const fs = require('fs');
const path = require('path');
const csv = require('csv-parse/sync');

// BAD IMPRESSIONS
const badImpressionsPath = path.join(__dirname, 'src', 'data', 'bad-impressions', 'bad_impressions_230525.csv');
const badImpressionsContent = fs.readFileSync(badImpressionsPath, 'utf-8');
const badImpressionsRecords = csv.parse(badImpressionsContent, {
  columns: true,
  skip_empty_lines: true,
  trim: true
});

const badPartnerRecords = badImpressionsRecords.filter(record => parseInt(record.partnerId) === 15047);

console.log('--- BAD IMPRESSIONS ---');
if (badPartnerRecords.length > 0) {
  console.log(`Found ${badPartnerRecords.length} records for partnerId 15047:`);
  badPartnerRecords.forEach(r => {
    console.log(`Violation: ${r.violation}, Count: ${r.violation_count}`);
  });
} else {
  console.log('No records found for partnerId 15047');
}

// IMPRESSIONS COUNT
const impressionsCountDir = path.join(__dirname, 'src', 'data', 'impressions-count');
const files = fs.readdirSync(impressionsCountDir);

console.log('bad_from_total_in_percentage for partnerId 15047:');

files.forEach(file => {
  const match = file.match(/impressions_count_(\d{6})_report\.csv/);
  if (match) {
    const date = match[1];
    const filePath = path.join(impressionsCountDir, file);
    const content = fs.readFileSync(filePath, 'utf-8');
    const records = csv.parse(content, {
      columns: true,
      skip_empty_lines: true,
      trim: true
    });
    const partnerRecord = records.find(record => parseInt(record.partnerId) === 15047);
    if (partnerRecord) {
      console.log(`${date}: ${partnerRecord.bad_from_total_in_percentage}`);
    } else {
      console.log(`${date}: No data for partnerId 15047`);
    }
  }
}); 
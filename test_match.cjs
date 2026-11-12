const fs = require('fs');

const csvText = fs.readFileSync('sheets_data.csv', 'utf8');
const mapping = require('./drive_mapping.json');

const lines = csvText.split(/\r?\n/);

// Custom CSV Parser
function parseLine(line) {
  const row = [];
  let current = "";
  let inQuotes = false;
  for (let j = 0; j < line.length; j++) {
    const char = line[j];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      row.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  row.push(current.trim());
  return row;
}

const mapKeys = Object.keys(mapping);
console.log(`Checking ${mapKeys.length} map keys against ${lines.length} rows...`);

let matches = 0;
for (const key of mapKeys) {
  // Try to find if key is a substring of any line in the CSV
  let found = false;
  for (let i = 1; i < lines.length; i++) {
    if (lines[i].includes(key)) {
      found = true;
      console.log(`Matched! Key: "${key}" found in row ${i}`);
      matches++;
      break;
    }
  }
}

console.log(`Total keys found in CSV: ${matches} / ${mapKeys.length}`);

const fs = require('fs');

const html = fs.readFileSync('drive_folder.html', 'utf8');

// Find all occurrences of data-tooltip="... .jpg ... "
// Google Drive tooltips for images look like data-tooltip="filename.jpg Image" or data-tooltip="filename.jpg"
const tooltipRegex = /data-tooltip="([^"]+\.(?:jpg|png|jpeg|gif)(?:\s+Image)?)"/gi;
const mapping = {};
let match;
let count = 0;

while ((match = tooltipRegex.exec(html)) !== null) {
  const fullTooltip = match[1];
  const filename = fullTooltip.replace(/\s+Image$/i, '').trim();
  const index = match.index;
  
  // Now find the closest Google Drive ID in a window of 800 characters around this match
  const start = Math.max(0, index - 400);
  const end = Math.min(html.length, index + 400);
  const windowText = html.slice(start, end);
  
  // Drive IDs are typically 33 characters, alphanumeric with - and _, often starting with 1
  // Let's search for "1[a-zA-Z0-9_-]{32}" or "data-id=\"([a-zA-Z0-9_-]{28,40})\""
  const idMatch = windowText.match(/data-id="([a-zA-Z0-9_-]{28,45})"/i) || windowText.match(/1[a-zA-Z0-9_-]{32}/);
  if (idMatch) {
    const driveId = idMatch[1] || idMatch[0];
    if (!mapping[filename]) {
      mapping[filename] = driveId;
      count++;
    }
  } else {
    // Fallback: look for any 33-char ID starting with 1 in the window
    const fallbackMatch = windowText.match(/1[a-zA-Z0-9_-]{32}/);
    if (fallbackMatch) {
      const driveId = fallbackMatch[0];
      if (!mapping[filename]) {
        mapping[filename] = driveId;
        count++;
      }
    }
  }
}

console.log(`Highly accurate parser mapped ${Object.keys(mapping).length} files.`);
console.log(`Sample mapped keys:`, Object.keys(mapping).slice(0, 15));

// Save mapping
fs.writeFileSync('drive_mapping.json', JSON.stringify(mapping, null, 2));
console.log('Saved mapping to drive_mapping.json');

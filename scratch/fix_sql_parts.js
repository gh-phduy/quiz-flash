const fs = require('fs');
const path = require('path');

const files = [
  'oxford_3000_a1_part1.sql',
  'oxford_3000_a1_part2.sql',
  'oxford_3000_a1_part3.sql',
  'oxford_3000_a1_part4.sql'
];

files.forEach(fileName => {
  const filePath = path.join(__dirname, '..', fileName);
  if (!fs.existsSync(filePath)) return;

  let content = fs.readFileSync(filePath, 'utf8');

  // Fix lines where 'A1' was missing
  // Pattern matching tuples with 7 elements instead of 8
  // Example: (set_a1_id, 'baby', 'n.', 'em bé', '/ˈbeɪbi/', '/ˈbeɪbi/', 51)
  // Replaced with: (set_a1_id, 'baby', 'n.', 'A1', 'em bé', '/ˈbeɪbi/', '/ˈbeɪbi/', 51)

  const lines = content.split('\n');
  const fixedLines = lines.map(line => {
    const trimmed = line.trim();
    if (trimmed.startsWith('(set_a1_id,')) {
      // Check count of commas not inside quotes (or split values)
      // If there are 6 commas separating 7 values, insert 'A1' after part_of_speech
      // A tuple looks like: (set_a1_id, 'term', 'pos', 'def', 'us', 'uk', index)
      // vs correct: (set_a1_id, 'term', 'pos', 'A1', 'def', 'us', 'uk', index)

      // Let's parse with regex:
      // Group 1: (set_a1_id, 'term', 'pos'
      // Group 2: remaining
      const match7 = line.match(/^(\s*\(set_a1_id,\s*'[^']+',\s*'[^']*'),\s*('[^']+',\s*'[^']*',\s*'[^']*',\s*\d+\)[\s,]*)$/);
      if (match7) {
        return `${match7[1]}, 'A1', ${match7[2]}`;
      }
    }
    return line;
  });

  fs.writeFileSync(filePath, fixedLines.join('\n'), 'utf8');
  console.log(`Successfully fixed ${fileName}`);
});

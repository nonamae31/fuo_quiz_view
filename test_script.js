const AdmZip = require('adm-zip');
const path = require('path');

const zipPath = path.resolve('test_bug.zip');
const examFolder = 'MLN111 - SP 2025 - Block 5 - 1';
const questionNumber = 230;
const commentText = 'NEW COMMENT FROM SCRIPT';

const zip = new AdmZip(zipPath);

let targetEntryName = null;
let existingEntry = null;

for (const entry of zip.getEntries()) {
  if (entry.isDirectory) continue;
  
  const pathParts = entry.entryName.split('/');
  if (pathParts.length < 2) continue;
  
  const entryExamFolder = pathParts[0];
  const fileName = pathParts[pathParts.length - 1];
  
  if (entryExamFolder === examFolder && fileName.startsWith(`${questionNumber}_`) && fileName.endsWith('_comments.txt')) {
    targetEntryName = entry.entryName;
    existingEntry = entry;
    break;
  }
}

if (!targetEntryName) {
  targetEntryName = `${examFolder}/${questionNumber}_comments.txt`;
}

let existingContent = '';

if (existingEntry) {
  existingContent = existingEntry.getData().toString('utf8');
  if (!existingContent.endsWith('\n')) existingContent += '\n';
  existingContent += commentText;
  
  zip.deleteFile(targetEntryName);
  zip.addFile(targetEntryName, Buffer.from(existingContent, 'utf8'));
} else {
  existingContent = commentText;
  zip.addFile(targetEntryName, Buffer.from(existingContent, 'utf8'));
}

zip.writeZip(zipPath);
console.log('Done writing');

const fs = require('fs');
const path = require('path');

const directoryPath = path.join(__dirname, 'api/src');

// Function to list all files in a directory
const listFiles = (dirPath) => {
  fs.readdir(dirPath, (err, files) => {
    if (err) {
      return console.log('Unable to scan directory: ' + err);
    }
    files.forEach((file) => {
      console.log(file);
    });
  });
};

listFiles(directoryPath);
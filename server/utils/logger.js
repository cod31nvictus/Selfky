const fs = require('fs');
const path = require('path');

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Simple logger utility
const logger = {
  info: (message, data = null) => {
    const timestamp = new Date().toISOString();
    const logMessage = `[INFO] ${timestamp}: ${message}`;
    console.log(logMessage);
    if (data) {
      console.log(data);
    }
    
    // Write to file
    const logEntry = `${logMessage}\n`;
    fs.appendFileSync(path.join(logsDir, 'app.log'), logEntry);
  },
  
  error: (message, error = null) => {
    const timestamp = new Date().toISOString();
    const logMessage = `[ERROR] ${timestamp}: ${message}`;
    console.error(logMessage);
    if (error) {
      console.error(error);
    }
    
    // Write to file
    const logEntry = `${logMessage}\n${error ? error.stack || error + '\n' : ''}`;
    fs.appendFileSync(path.join(logsDir, 'error.log'), logEntry);
  },
  
  warn: (message, data = null) => {
    const timestamp = new Date().toISOString();
    const logMessage = `[WARN] ${timestamp}: ${message}`;
    console.warn(logMessage);
    if (data) {
      console.warn(data);
    }
    
    // Write to file
    const logEntry = `${logMessage}\n`;
    fs.appendFileSync(path.join(logsDir, 'app.log'), logEntry);
  },
  
  debug: (message, data = null) => {
    if (process.env.NODE_ENV === 'development') {
      const timestamp = new Date().toISOString();
      const logMessage = `[DEBUG] ${timestamp}: ${message}`;
      console.log(logMessage);
      if (data) {
        console.log(data);
      }
      
      // Write to file
      const logEntry = `${logMessage}\n`;
      fs.appendFileSync(path.join(logsDir, 'debug.log'), logEntry);
    }
  }
};

module.exports = logger; 
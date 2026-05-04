const winston = require('winston');
const { v4: uuidv4 } = require('uuid');

const jsonFormatter = winston.format.printf(({ level, message, timestamp, requestId, ...metadata }) => {
  let msg = `[${timestamp}] [${level.toUpperCase()}]`;
  if (requestId) msg += ` [ID:${requestId}]`;
  msg += `: ${message}`;
  if (Object.keys(metadata).length > 0) {
    msg += ` ${JSON.stringify(metadata)}`;
  }
  return msg;
});

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }), // Important for capturing error details
    winston.format.metadata({ fillExcept: ['message', 'level', 'timestamp', 'requestId'] }),
    jsonFormatter
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'server.log' })
  ]
});

// Helper to create a child logger with a Request ID
function createRequestLogger(requestId = uuidv4()) {
  return logger.child({ requestId });
}

module.exports = {
  logger,
  createRequestLogger
};

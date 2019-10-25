const log4js = require('log4js');
const path = require('path');

log4js.configure({
  appenders: {
    error: {
      type: 'file',
      filename: path.resolve(__dirname, '../logs/error.log')
    }
  },
  categories: {
    default: {
      appenders: ['error'],
      level: 'error'
    }
  }
});

const logger = log4js.getLogger('error');

export default logger;
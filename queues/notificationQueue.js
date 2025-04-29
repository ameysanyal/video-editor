const Queue = require('bull');
const notificationQueue = new Queue('notification', process.env.REDIS_URL);
module.exports = notificationQueue;

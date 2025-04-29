const Queue = require('bull');
const redis = require('../config/redis.js');

const queue = new Queue('videoQueue', process.env.REDIS_URL);

module.exports = queue;

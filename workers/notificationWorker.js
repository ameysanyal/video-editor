const notificationQueue = require('../queues/notificationQueue');

notificationQueue.process('sendNotification', async (job, done) => {
  try {
    const { id} = job.data;
    console.log(`Your video ${id} has been rendered successfully!`);

    done();
  } catch (err) {
    console.error(err);
    done(err);
  }
});

const queue = require('../queues/queue.js');
const videoModel= require('../models/video.model.js');
const ffmpeg = require('fluent-ffmpeg');
const path = require('path');
const notificationQueue = require('../queues/notificationQueue');

queue.process('render', async (job, done) => {
  try {
    const { id } = job.data;
    const video = await videoModel.findByPk(id);
    console.log('in renderjob', video)
    const finalPath = `rendered/final_${Date.now()}.mp4`;

    ffmpeg(video.editedPath || video.originalPath)
      .output(finalPath)
      .on('end', async () => {
        video.finalPath = finalPath;
        video.status = 'rendered';
        await video.save();
       
         // ✅ After successful render, queue a notification
         await notificationQueue.add('sendNotification', { id: video.id });

        done();
        
      })
      .on('error', (err) => {
        console.error(err);
        done(new Error('Rendering failed'));
      })
      .run();
  } catch (err) {
    console.error(err);
    done(err);
  }
});

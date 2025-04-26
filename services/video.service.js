const { Video } = require('../models/video.model.js');
const ffmpeg = require('fluent-ffmpeg');
const path = require('path');

class VideoService {
  /**
   * @param {object} file - The file object from the upload.
   * @returns {Promise<Video>} - The created video record.
   */
  async upload(file) {
    const video = await Video.create({
      name: file.filename,
      size: file.size,
      originalPath: file.path,
    });
    return video;
  }

  /**
    * Trims the video based on the provided start and end times.
    *
    * @param {number} id - The ID of the video to trim.
    * @param {string} startTime - The start time for trimming.
    * @param {string} endTime - The end time for trimming.
    * @returns {Promise<Video>} - The updated video record with the trimmed path.
    */
  async trim(id, startTime, endTime) {
    const video = await Video.findByPk(id);
    const trimmedPath = `uploads/trimmed_${Date.now()}.mp4`;

    return new Promise((resolve, reject) => {
      ffmpeg(video.originalPath)
        .setStartTime(startTime)
        .setDuration(endTime - startTime)
        .output(trimmedPath)
        .on('end', async () => {
          video.trimmedPath = trimmedPath;
          await video.save();
          resolve(video);
        })
        .on('error', reject)
        .run();
    });
  }

    /**
     * Adds subtitles to the video.
     *
     * @param {number} id - The ID of the video.
     * @param {string} text - The subtitle text.
     * @param {string} startTime - The start time for the subtitle.
     * @param {string} endTime - The end time for the subtitle.
     * @returns {Promise<Video>} - The updated video record with the subtitled path.
     */
  async addSubtitles(id, text, startTime, endTime) {
    const video = await Video.findByPk(id);
    const outputPath = `uploads/subtitled_${Date.now()}.mp4`;

    return new Promise((resolve, reject) => {
      ffmpeg(video.trimmedPath || video.originalPath)
        .videoFilter({
          filter: 'drawtext',
          options: {
            fontfile: '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', // Ensure this path is correct
            text,
            fontsize: 24,
            fontcolor: 'white',
            x: '(w-text_w)/2',
            y: '(h-text_h)/2',
            enable: `between(t,${startTime},${endTime})`,
          },
        })
        .output(outputPath)
        .on('end', async () => {
          video.trimmedPath = outputPath;
          await video.save();
          resolve(video);
        })
        .on('error', reject)
        .run();
    });
  }

  /**
   * Renders the video.
   *
   * @param {number} id - The ID of the video to render.
   * @returns {Promise<Video>} - The updated video record with the final path.
   */
  async renderVideo(id) {
    const video = await Video.findByPk(id);
    const finalPath = `rendered/final_${Date.now()}.mp4`;

    return new Promise((resolve, reject) => {
      ffmpeg(video.trimmedPath || video.originalPath)
        .output(finalPath)
        .on('end', async () => {
          video.finalPath = finalPath;
          video.status = 'rendered';
          await video.save();
          resolve(video);
        })
        .on('error', reject)
        .run();
    });
  }

  /**
    * Downloads the video.
    *
    * @param {number} id - The ID of the video to download.
    * @returns {string} - The path to the downloaded video.
    */
  async download(id) {
    const video = await Video.findByPk(id);
    if (!video.finalPath) {
      throw new Error('Final video not rendered yet');
    }
    return path.resolve(video.finalPath);
  }
}

module.exports = VideoService;

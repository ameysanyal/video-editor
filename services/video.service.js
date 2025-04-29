const videoModel = require("../models/video.model.js");
const ffmpeg = require("fluent-ffmpeg");
const path = require("path");
const ffmpegPath = require("@ffmpeg-installer/ffmpeg").path;
ffmpeg.setFfmpegPath(ffmpegPath);
const fs = require("fs");

class VideoService {
  /**
   * @param {object} file - The file object from the upload.
   * @returns {Promise<Video>} - The created video record.
   */
  async upload(file) {
    const video = await videoModel.create({
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
    const video = await videoModel.findByPk(id);
    if (!video) {
      throw new Error("Video not found.");
    }
    const editedPath = `uploads/trimmed_${Date.now()}.mp4`;
    // ffmpeg -setDuration option expects the duration to be in seconds
    // as a floating-point number or in HH:MM:SS.milliseconds string format.
    return new Promise((resolve, reject) => {
      ffmpeg(video.originalPath)
        .setStartTime(startTime)
        .setDuration(endTime - startTime)
        .output(editedPath)
        .on("end", async () => {
          video.editedPath = editedPath;
          await video.save();
          resolve(video);
        })
        .on("error", reject)
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

  // cli cmd for adding text on video
  // ffmpeg -i "C:\Users\amzic\Downloads\Pip.mp4" -y -filter:v "drawtext=fontfile='C\:/Users/amzic/Downloads/Open_Sans/OpenSans.ttf':text='Hello Dog, lets go':fontsize=24:fontcolor=white:x=(w-text_w)/2:y=(h-text_h)/2:enable='between(t,10,25)'" "C:\Users\amzic\Downloads\output.mp4"

  async addSubtitles(videoId, text, startTime, endTime) {
    try {
      const video = await videoModel.findByPk(videoId);
      if (!video) {
        throw new Error("Video not found");
      }

      const outputPath = path.join(
        __dirname,
        "..",
        "uploads",
        `subtitled_${Date.now()}.mp4`
      );

      const escapedText = text
        .replace(/\\/g, "\\\\")
        .replace(/:/g, "\\:")
        .replace(/'/g, "\\'")
        .replace(/"/g, '\\"')
        .replace(/%/g, "\\%")
        .replace(/\[/g, "\\[")
        .replace(/\]/g, "\\]");

      return new Promise((resolve, reject) => {
        const options = {
          fontsize: 30,
          fontcolor: "white",
          x: "(w-tw)/2", // Center horizontally
          y: "h-th-10", // Center vertically
          shadowcolor: "black",
          shadowx: 2,
          shadowy: 2,
          enable: `between(t,${startTime},${endTime})`,
        };

        let filter = `drawtext=fontfile=${options.fontfile}:text='${escapedText}':fontsize=${options.fontsize}:fontcolor=${options.fontcolor}:x=${options.x}:y=${options.y}:shadowcolor=${options.shadowcolor}:shadowx=${options.shadowx}:shadowy=${options.shadowy}`;

        if (options.enable) {
          filter += `:enable='${options.enable}'`;
        }

        ffmpeg(video.editedPath || video.originalPath)
          .videoFilters(filter)
          .on("start", (commandLine) => {
            console.log("Spawned FFmpeg with command:", commandLine);
          })
          .on("progress", (progress) => {
            console.log(
              "Processing:",
              progress.percent ? progress.percent.toFixed(2) : 0,
              "% done"
            );
          })
          .on("end", async () => {
            console.log("Finished processing");
            video.editedPath = outputPath;
            await video.save();
            resolve(video);
          })
          .on("error", (err) => {
            console.error("Error occurred:", err.message);
            reject(new Error(`FFmpeg failed to add subtitles: ${err.message}`));
          })
          .save(outputPath);
      });
    } catch (error) {
      console.error("Service error adding subtitles:", error);
      throw error;
    }
  }

  /**
   * Renders the video.
   *
   * @param {number} id - The ID of the video to render.
   * @returns {Promise<Video>} - The updated video record with the final path.
   */
  // async renderVideo(id) {
  //   const video = await videoModel.findByPk(id);
  //   const finalPath = `rendered/final_${Date.now()}.mp4`;

  //   return new Promise((resolve, reject) => {
  //     ffmpeg(video.editedPath || video.originalPath)
  //       .output(finalPath)
  //       .on('end', async () => {
  //         video.finalPath = finalPath;
  //         video.status = 'rendered';
  //         await video.save();
  //         resolve(video);
  //       })
  //       .on('error', reject)
  //       .run();
  //   });
  // }

  /**
   * Downloads the video.
   *
   * @param {number} id - The ID of the video to download.
   * @returns {string} - The path to the downloaded video.
   */
  async download(id) {
    const video = await videoModel.findByPk(id);
    if (!video.finalPath) {
      throw new Error("Final video not rendered yet");
    }
    return path.resolve(video.finalPath);
  }
}

module.exports = VideoService;

const VideoService = require("../services/video.service.js");
const videoService = new VideoService();
const { asyncHandler } = require("../utils/asyncHandler.js");
const queue = require("../queues/queue.js");

const VideoController = {
  uploadVideo: asyncHandler(async (req, res) => {
    console.log(req.file);
    if (!req.file) {
      const error = new Error("Please upload a video file.");
      error.statusCode = 400;
      throw error;
    }
    const video = await videoService.upload(req.file);
    res.status(201).json(video);
  }),

  trimVideo: asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { startTime, endTime } = req.body;

    if (!id || startTime === undefined || endTime === undefined) {
      const error = new Error("Missing video ID, startTime, or endTime.");
      error.statusCode = 400;
      throw error;
    }

    if (endTime <= startTime) {
      const error = new Error("End time must be greater than start time.");
      error.statusCode = 400;
      throw error;
    }

    try {
      const trimmed = await videoService.trim(id, startTime, endTime);
      res.json(trimmed);
    } catch (error) {
      console.error("Error in videoService.trim:", error);
      const serviceError = new Error("Failed to trim the video.");
      serviceError.statusCode = 500; // Or another appropriate status code
      throw serviceError;
    }
  }),

  addSubtitles: asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { text, startTime, endTime } = req.body;

    console.log("id", id);
    console.log(req.body);

    if (!id || !text || startTime === undefined || endTime === undefined) {
      const error = new Error(
        "Missing video ID, subtitle text, startTime, or endTime."
      );
      error.statusCode = 400;
      throw error;
    }

    if (endTime <= startTime) {
      const error = new Error(
        "Subtitle end time must be greater than start time."
      );
      error.statusCode = 400;
      throw error;
    }

    try {
      const subtitle = await videoService.addSubtitles(
        id,
        text,
        startTime,
        endTime
      );
      res.json(subtitle);
    } catch (error) {
      console.error("Error in videoService.addSubtitles:", error);
      const serviceError = new Error("Failed to add subtitles to the video.");
      serviceError.statusCode = 500;
      throw serviceError;
    }
  }),

  renderVideo: asyncHandler(async (req, res) => {
    const { id } = req.params;

    if (!id) {
      const error = new Error("Missing video ID for rendering.");
      error.statusCode = 400;
      throw error;
    }

    await queue.add("render", { id }); // << Directly adding job to queue
    res.status(200).json({ message: "Render job submitted successfully." });
  }),

  downloadVideo: asyncHandler(async (req, res) => {
    const { id } = req.params;

    if (!id) {
      const error = new Error("Missing video ID for download.");
      error.statusCode = 400;
      throw error;
    }

    try {
      const filePath = await videoService.download(id);
      if (!filePath) {
        const notFoundError = new Error("Video file not found for download.");
        notFoundError.statusCode = 404;
        throw notFoundError;
      }
      res.download(filePath);
    } catch (error) {
      console.error("Error in videoService.download:", error);
      let errorMessage = "Failed to download the video.";
      let statusCode = 500;
      if (error.statusCode === 404) {
        errorMessage = error.message; // Use the specific "not found" message
        statusCode = 404;
      }
      const downloadError = new Error(errorMessage);
      downloadError.statusCode = statusCode;
      throw downloadError;
    }
  }),
};
module.exports = VideoController;

// the outer asyncHandler handles the general case of promise rejections within the controller,
// while the inner try...catch around the service call provides a way to intercept errors from the service layer,
// log them, and potentially transform them into more informative and API-appropriate error responses.

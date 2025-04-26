const VideoService = require('../services/video.service.js');
const videoService = new VideoService()

const VideoController = {
    uploadVideo: async (req, res) => {
        try {
          const video = await videoService.upload(req.file);
          res.status(201).json(video);
        } catch (error) {
          console.error(error);
          res.status(500).json({ error: 'Upload failed' });
        }
      },

      trimVideo : async (req, res) => {
        try {
          const trimmed = await videoService.trim(req.params.id, req.body.startTime, req.body.endTime);
          res.json(trimmed);
        } catch (error) {
          console.error(error);
          res.status(500).json({ error: 'Trimming failed' });
        }
      },
       
      addSubtitles : async (req, res) => {
        try {
          const subtitle = await videoService.addSubtitles(req.params.id, req.body.text, req.body.startTime, req.body.endTime);
          res.json(subtitle);
        } catch (error) {
          console.error(error);
          res.status(500).json({ error: 'Adding subtitles failed' });
        }
      },
    
      renderVideo : async (req, res) => {
        try {
          const result = await videoService.renderVideo(req.params.id);
          res.json({ message: 'Rendered successfully', result });
        } catch (error) {
          console.error(error);
          res.status(500).json({ error: 'Render failed' });
        }
      }, 
      downloadVideo : async (req, res) => {
        try {
          const filePath = await videoService.download(req.params.id);
          res.download(filePath);
        } catch (error) {
          console.error(error);
          res.status(500).json({ error: 'Download failed' });
        }
      }

}
module.exports = VideoController;

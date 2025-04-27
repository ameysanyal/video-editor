const express = require('express');
const router = express.Router();
const upload = require('../middlewares/fileuploader.middleware.js');
const videoController = require('../controllers/video.controller.js');

// Upload
router.post('/upload', upload.single('video'), videoController.uploadVideo);

// Trim
router.post('/:id/trim', videoController.trimVideo);

// Add Subtitles
router.post('/:id/subtitles', videoController.addSubtitles);

// Render
router.post('/:id/render', videoController.renderVideo);

// Download
router.get('/:id/download', videoController.downloadVideo);

module.exports = router;




// :id comes before the action because it points to which resource you're acting on.
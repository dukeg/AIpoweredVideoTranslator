const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs-extra');
const { v4: uuidv4 } = require('uuid');
const { burnSubtitles } = require('../utils/ffmpeg');

// POST /api/render — burn custom SRT onto existing uploaded video
router.post('/', async (req, res) => {
  try {
    const { videoId, srt, options = {} } = req.body;
    if (!videoId || !srt) return res.status(400).json({ error: 'videoId and srt required' });

    const uploads = path.join(__dirname, '../../public/uploads');
    const outputs = path.join(__dirname, '../../public/outputs');
    const temp = path.join(__dirname, '../../public/temp');

    // Find the video file
    const files = await fs.readdir(uploads);
    const videoFile = files.find(f => f.startsWith(videoId));
    if (!videoFile) return res.status(404).json({ error: 'Video not found' });

    const videoPath = path.join(uploads, videoFile);
    const srtPath = path.join(temp, `${videoId}_custom.srt`);
    const outId = uuidv4();
    const outputPath = path.join(outputs, `${outId}_rendered.mp4`);

    await fs.writeFile(srtPath, srt, 'utf8');
    await burnSubtitles(videoPath, srtPath, outputPath, options);
    await fs.remove(srtPath);

    const stats = await fs.stat(outputPath);
    res.json({
      outputUrl: `/outputs/${outId}_rendered.mp4`,
      size: stats.size
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

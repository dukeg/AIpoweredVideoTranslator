const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs-extra');
const { v4: uuidv4 } = require('uuid');
const { extractAudio, getVideoInfo, burnSubtitles, generateThumbnail } = require('../utils/ffmpeg');
const { transcribeAudio, segmentsToSRT } = require('../utils/whisper');
const { translateSegmentsChunked } = require('../utils/claude');
const { createJob, updateJob, JOB_STATUS } = require('../utils/jobs');

const UPLOADS_DIR = path.join(__dirname, '../../public/uploads');
const OUTPUTS_DIR = path.join(__dirname, '../../public/outputs');
const TEMP_DIR = path.join(__dirname, '../../public/temp');

/**
 * POST /api/transcribe
 * Upload video + start full translation pipeline
 */
router.post('/', async (req, res) => {
  if (!req.files?.video) {
    return res.status(400).json({ error: 'No video file uploaded' });
  }

  const { targetLang = 'en', sourceLang = 'auto', subtitleStyle = 'burned' } = req.body;
  const jobId = uuidv4();
  const job = createJob(jobId, { targetLang, sourceLang, subtitleStyle });

  // Respond immediately with job ID
  res.json({ jobId, message: 'Translation job started' });

  // Run pipeline asynchronously
  runPipeline(jobId, req.files.video, { targetLang, sourceLang, subtitleStyle }).catch(err => {
    console.error(`Job ${jobId} failed:`, err);
    updateJob(jobId, { status: JOB_STATUS.FAILED, message: err.message, progress: 0 });
  });
});

async function runPipeline(jobId, videoFile, options) {
  const { targetLang, sourceLang, subtitleStyle } = options;
  const ext = path.extname(videoFile.name).toLowerCase() || '.mp4';
  const baseName = `${jobId}`;
  const videoPath = path.join(UPLOADS_DIR, `${baseName}${ext}`);
  const audioPath = path.join(TEMP_DIR, `${baseName}.mp3`);
  const srtOrigPath = path.join(TEMP_DIR, `${baseName}_orig.srt`);
  const srtTranslPath = path.join(TEMP_DIR, `${baseName}_transl.srt`);
  const outputPath = path.join(OUTPUTS_DIR, `${baseName}_translated.mp4`);
  const thumbPath = path.join(OUTPUTS_DIR, `${baseName}_thumb.jpg`);

  try {
    // Step 1: Save video
    updateJob(jobId, { status: JOB_STATUS.UPLOADING, progress: 5, message: 'Saving video...' });
    await videoFile.mv(videoPath);

    // Get video info
    const videoInfo = await getVideoInfo(videoPath);
    updateJob(jobId, { data: { videoInfo } });

    // Generate thumbnail
    generateThumbnail(videoPath, thumbPath, Math.min(2, videoInfo.duration * 0.1)).catch(() => {});

    // Step 2: Extract audio
    updateJob(jobId, { status: JOB_STATUS.EXTRACTING_AUDIO, progress: 15, message: 'Extracting audio track...' });
    await extractAudio(videoPath, audioPath);

    // Step 3: Transcribe with Whisper
    updateJob(jobId, { status: JOB_STATUS.TRANSCRIBING, progress: 30, message: 'Transcribing speech with Whisper AI...' });
    const transcription = await transcribeAudio(audioPath, sourceLang === 'auto' ? null : sourceLang);

    if (!transcription.segments || transcription.segments.length === 0) {
      throw new Error('No speech detected in video. Please ensure the video has clear audio.');
    }

    // Save original SRT
    const originalSRT = segmentsToSRT(transcription.segments);
    await fs.writeFile(srtOrigPath, originalSRT, 'utf8');

    updateJob(jobId, {
      data: {
        detectedLanguage: transcription.language,
        segmentCount: transcription.segments.length,
        originalSRT
      }
    });

    // Step 4: Translate with Claude
    updateJob(jobId, {
      status: JOB_STATUS.TRANSLATING,
      progress: 55,
      message: `Translating ${transcription.segments.length} subtitle segments with Claude AI...`
    });

    const translatedSegments = await translateSegmentsChunked(
      transcription.segments,
      targetLang,
      transcription.language
    );

    const translatedSRT = segmentsToSRT(translatedSegments);
    await fs.writeFile(srtTranslPath, translatedSRT, 'utf8');

    updateJob(jobId, { data: { translatedSRT } });

    // Step 5: Render video with subtitles
    updateJob(jobId, { status: JOB_STATUS.RENDERING, progress: 70, message: 'Rendering video with subtitles...' });
    await burnSubtitles(videoPath, srtTranslPath, outputPath, {
      fontSize: 22,
      position: 'bottom'
    });

    // Step 6: Complete
    const outputStats = await fs.stat(outputPath);
    updateJob(jobId, {
      status: JOB_STATUS.COMPLETE,
      progress: 100,
      message: 'Translation complete!',
      data: {
        outputUrl: `/outputs/${baseName}_translated.mp4`,
        thumbnailUrl: `/outputs/${baseName}_thumb.jpg`,
        originalSRTUrl: `/outputs/${baseName}_orig.srt`,
        translatedSRTUrl: `/outputs/${baseName}_transl.srt`,
        outputSize: outputStats.size,
        detectedLanguage: transcription.language,
        segmentCount: transcription.segments.length
      }
    });

    // Save SRT files to outputs for download
    await fs.copy(srtOrigPath, path.join(OUTPUTS_DIR, `${baseName}_orig.srt`));
    await fs.copy(srtTranslPath, path.join(OUTPUTS_DIR, `${baseName}_transl.srt`));

    // Cleanup temp files
    await Promise.allSettled([
      fs.remove(audioPath),
      fs.remove(srtOrigPath),
      fs.remove(srtTranslPath)
    ]);

  } catch (err) {
    // Cleanup on failure
    await Promise.allSettled([
      fs.remove(videoPath),
      fs.remove(audioPath),
      fs.remove(srtOrigPath),
      fs.remove(srtTranslPath)
    ]);
    throw err;
  }
}

module.exports = router;

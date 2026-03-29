const ffmpeg = require('fluent-ffmpeg');
const path = require('path');
const fs = require('fs-extra');

/**
 * Extract audio from video file as MP3
 */
function extractAudio(videoPath, outputPath) {
  return new Promise((resolve, reject) => {
    ffmpeg(videoPath)
      .noVideo()
      .audioCodec('libmp3lame')
      .audioBitrate('128k')
      .audioFrequency(16000)
      .audioChannels(1)
      .output(outputPath)
      .on('end', () => resolve(outputPath))
      .on('error', reject)
      .run();
  });
}

/**
 * Get video metadata (duration, dimensions, fps, etc.)
 */
function getVideoInfo(videoPath) {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(videoPath, (err, metadata) => {
      if (err) return reject(err);
      const videoStream = metadata.streams.find(s => s.codec_type === 'video');
      const audioStream = metadata.streams.find(s => s.codec_type === 'audio');
      resolve({
        duration: metadata.format.duration,
        size: metadata.format.size,
        bitrate: metadata.format.bit_rate,
        width: videoStream?.width,
        height: videoStream?.height,
        fps: eval(videoStream?.r_frame_rate) || 25,
        videoCodec: videoStream?.codec_name,
        audioCodec: audioStream?.codec_name,
        hasAudio: !!audioStream
      });
    });
  });
}

/**
 * Burn SRT subtitles into video (hardcoded)
 */
function burnSubtitles(videoPath, srtPath, outputPath, options = {}) {
  const {
    fontSize = 22,
    fontColor = 'white',
    outlineColor = 'black',
    outlineWidth = 2,
    position = 'bottom', // 'bottom' | 'top'
    fontName = 'DejaVu Sans'
  } = options;

  const alignment = position === 'top' ? 6 : 2;
  const subtitleFilter = `subtitles='${srtPath.replace(/\\/g, '/').replace(/:/g, '\\:')}':force_style='FontName=${fontName},FontSize=${fontSize},PrimaryColour=&H00FFFFFF,OutlineColour=&H00000000,Outline=${outlineWidth},Alignment=${alignment},MarginV=30'`;

  return new Promise((resolve, reject) => {
    ffmpeg(videoPath)
      .videoFilters(subtitleFilter)
      .audioCodec('copy')
      .output(outputPath)
      .outputOptions(['-preset fast', '-crf 23'])
      .on('progress', progress => {
        process.stdout.write(`\r  Rendering: ${Math.round(progress.percent || 0)}%`);
      })
      .on('end', () => {
        process.stdout.write('\n');
        resolve(outputPath);
      })
      .on('error', reject)
      .run();
  });
}

/**
 * Generate soft subtitle video (separate subtitle track, not burned in)
 */
function addSoftSubtitles(videoPath, srtPath, outputPath) {
  return new Promise((resolve, reject) => {
    ffmpeg(videoPath)
      .input(srtPath)
      .outputOptions([
        '-c:v copy',
        '-c:a copy',
        '-c:s mov_text',
        '-metadata:s:s:0 language=eng'
      ])
      .output(outputPath)
      .on('end', () => resolve(outputPath))
      .on('error', reject)
      .run();
  });
}

/**
 * Convert video to web-friendly MP4
 */
function convertToMp4(inputPath, outputPath) {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .videoCodec('libx264')
      .audioCodec('aac')
      .outputOptions(['-preset fast', '-crf 23', '-movflags +faststart'])
      .output(outputPath)
      .on('end', () => resolve(outputPath))
      .on('error', reject)
      .run();
  });
}

/**
 * Generate video thumbnail
 */
function generateThumbnail(videoPath, outputPath, timeSeconds = 2) {
  return new Promise((resolve, reject) => {
    ffmpeg(videoPath)
      .seekInput(timeSeconds)
      .frames(1)
      .output(outputPath)
      .on('end', () => resolve(outputPath))
      .on('error', reject)
      .run();
  });
}

module.exports = {
  extractAudio,
  getVideoInfo,
  burnSubtitles,
  addSoftSubtitles,
  convertToMp4,
  generateThumbnail
};

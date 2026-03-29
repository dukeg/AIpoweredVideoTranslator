const OpenAI = require('openai');
const fs = require('fs');
const path = require('path');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/**
 * Transcribe audio file using OpenAI Whisper
 * Returns array of segments with timestamps
 */
async function transcribeAudio(audioPath, language = null) {
  const audioStream = fs.createReadStream(audioPath);

  const params = {
    file: audioStream,
    model: 'whisper-1',
    response_format: 'verbose_json',
    timestamp_granularities: ['segment'],
  };

  if (language && language !== 'auto') {
    params.language = language;
  }

  const response = await openai.audio.transcriptions.create(params);

  return {
    text: response.text,
    language: response.language,
    duration: response.duration,
    segments: response.segments?.map(seg => ({
      id: seg.id,
      start: seg.start,
      end: seg.end,
      text: seg.text.trim()
    })) || []
  };
}

/**
 * Convert transcription segments to SRT subtitle format
 */
function segmentsToSRT(segments) {
  return segments.map((seg, i) => {
    const startTime = secondsToSRTTime(seg.start);
    const endTime = secondsToSRTTime(seg.end);
    return `${i + 1}\n${startTime} --> ${endTime}\n${seg.text}\n`;
  }).join('\n');
}

/**
 * Convert SRT string to segments array
 */
function srtToSegments(srtContent) {
  const blocks = srtContent.trim().split(/\n\n+/);
  return blocks.map(block => {
    const lines = block.split('\n');
    if (lines.length < 3) return null;
    const timecode = lines[1];
    const [start, end] = timecode.split(' --> ').map(srtTimeToSeconds);
    const text = lines.slice(2).join(' ');
    return { id: parseInt(lines[0]) - 1, start, end, text };
  }).filter(Boolean);
}

function secondsToSRTTime(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const ms = Math.round((seconds % 1) * 1000);
  return `${pad(h)}:${pad(m)}:${pad(s)},${pad(ms, 3)}`;
}

function srtTimeToSeconds(timeStr) {
  const [hms, ms] = timeStr.split(',');
  const [h, m, s] = hms.split(':').map(Number);
  return h * 3600 + m * 60 + s + parseInt(ms) / 1000;
}

function pad(n, len = 2) {
  return String(n).padStart(len, '0');
}

module.exports = { transcribeAudio, segmentsToSRT, srtToSegments };

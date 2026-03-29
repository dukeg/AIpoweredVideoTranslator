const express = require('express');
const router = express.Router();
const { translateSegmentsChunked, detectLanguage, LANGUAGE_NAMES } = require('../utils/claude');
const { srtToSegments, segmentsToSRT } = require('../utils/whisper');

// POST /api/translate/srt — translate an existing SRT file
router.post('/srt', async (req, res) => {
  try {
    const { srt, targetLang, sourceLang } = req.body;
    if (!srt || !targetLang) return res.status(400).json({ error: 'srt and targetLang required' });

    const segments = srtToSegments(srt);
    const translated = await translateSegmentsChunked(segments, targetLang, sourceLang);
    const translatedSRT = segmentsToSRT(translated);

    res.json({ srt: translatedSRT, segments: translated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/translate/languages — list supported languages
router.get('/languages', (req, res) => {
  res.json(LANGUAGE_NAMES);
});

// POST /api/translate/detect — detect language
router.post('/detect', async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: 'text required' });
    const lang = await detectLanguage(text);
    res.json({ language: lang, name: LANGUAGE_NAMES[lang] || lang });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

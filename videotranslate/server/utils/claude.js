const Anthropic = require('@anthropic-ai/sdk');

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const LANGUAGE_NAMES = {
  en: 'English', es: 'Spanish', fr: 'French', de: 'German',
  it: 'Italian', pt: 'Portuguese', ru: 'Russian', ja: 'Japanese',
  ko: 'Korean', zh: 'Chinese (Simplified)', 'zh-tw': 'Chinese (Traditional)',
  ar: 'Arabic', hi: 'Hindi', tr: 'Turkish', nl: 'Dutch',
  pl: 'Polish', sv: 'Swedish', da: 'Danish', no: 'Norwegian',
  fi: 'Finnish', el: 'Greek', he: 'Hebrew', th: 'Thai',
  vi: 'Vietnamese', id: 'Indonesian', ms: 'Malay', uk: 'Ukrainian',
  cs: 'Czech', hu: 'Hungarian', ro: 'Romanian', bn: 'Bengali',
  ta: 'Tamil', ur: 'Urdu', fa: 'Persian', sw: 'Swahili'
};

/**
 * Translate subtitle segments preserving timing
 * Batches segments for efficiency
 */
async function translateSegments(segments, targetLang, sourceLang = null) {
  const targetName = LANGUAGE_NAMES[targetLang] || targetLang;
  const sourceName = sourceLang ? (LANGUAGE_NAMES[sourceLang] || sourceLang) : 'the detected language';

  // Build JSON payload of segments to translate
  const segmentPayload = segments.map(s => ({ id: s.id, text: s.text }));

  const systemPrompt = `You are a professional subtitle translator specializing in natural, contextually accurate translations.
Translate subtitles from ${sourceName} to ${targetName}.

CRITICAL RULES:
- Preserve the meaning, tone, and emotion of the original
- Keep translations concise — subtitles must be readable quickly  
- Maintain proper ${targetName} grammar and natural phrasing
- Do NOT add extra words or explanations
- Return ONLY a JSON array with objects: [{"id": number, "text": "translated text"}]
- Preserve the exact same number of entries as input
- Keep proper nouns, names, and brand names unchanged unless there is a standard ${targetName} equivalent`;

  const userPrompt = `Translate these subtitle segments to ${targetName}:\n${JSON.stringify(segmentPayload)}`;

  const response = await client.messages.create({
    model: 'claude-opus-4-6',
    max_tokens: 4096,
    system: systemPrompt,
    messages: [{ role: 'user', content: userPrompt }]
  });

  const raw = response.content[0].text.trim();
  
  // Extract JSON from response
  const jsonMatch = raw.match(/\[[\s\S]*\]/);
  if (!jsonMatch) throw new Error('Translation response did not contain valid JSON array');
  
  const translated = JSON.parse(jsonMatch[0]);

  // Merge translations back with original timing
  return segments.map(seg => {
    const t = translated.find(t => t.id === seg.id);
    return {
      ...seg,
      text: t ? t.text : seg.text,
      originalText: seg.text
    };
  });
}

/**
 * Translate in chunks for long videos (>100 segments)
 */
async function translateSegmentsChunked(segments, targetLang, sourceLang = null, chunkSize = 60) {
  if (segments.length <= chunkSize) {
    return translateSegments(segments, targetLang, sourceLang);
  }

  const results = [];
  for (let i = 0; i < segments.length; i += chunkSize) {
    const chunk = segments.slice(i, i + chunkSize);
    const translated = await translateSegments(chunk, targetLang, sourceLang);
    results.push(...translated);
    // Small delay between chunks to avoid rate limiting
    if (i + chunkSize < segments.length) {
      await new Promise(r => setTimeout(r, 500));
    }
  }
  return results;
}

/**
 * Detect language of text using Claude
 */
async function detectLanguage(text) {
  const response = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 100,
    messages: [{
      role: 'user',
      content: `Detect the language of this text and respond with ONLY the ISO 639-1 language code (e.g., "en", "es", "fr"):\n\n"${text.substring(0, 500)}"`
    }]
  });
  return response.content[0].text.trim().toLowerCase().replace(/[^a-z-]/g, '');
}

module.exports = { translateSegments, translateSegmentsChunked, detectLanguage, LANGUAGE_NAMES };

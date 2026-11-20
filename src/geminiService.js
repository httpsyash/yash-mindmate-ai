/**
 * MindMate AI - Gemini AI Chat Service
 * Integrates Google Gemini API for context-aware empathetic dialogue & emotion analysis
 */

const https = require('https');

const GEMINI_MODELS = [
  'gemini-3.5-flash-lite',
  'gemini-flash-lite-latest',
  'gemini-3.1-flash-lite',
  'gemini-3.1-flash-lite-preview'
];

/**
 * Call Gemini API with structured JSON output and single retry on 503
 */
async function callGeminiApi(apiKey, model, systemPrompt, contents, retries = 1) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const requestBody = JSON.stringify({
    system_instruction: {
      parts: [{ text: systemPrompt }]
    },
    generationConfig: {
      responseMimeType: 'application/json',
      temperature: 0.7,
      maxOutputTokens: 1024
    },
    contents: contents
  });

  const doRequest = () => new Promise((resolve, reject) => {
    const req = https.request(
      url,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(requestBody)
        },
        timeout: 12000 // 12s timeout
      },
      (res) => {
        let responseData = '';
        res.on('data', (chunk) => { responseData += chunk; });
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            try {
              const parsed = JSON.parse(responseData);
              const textContent = parsed.candidates?.[0]?.content?.parts?.[0]?.text;
              if (textContent) {
                const structured = JSON.parse(textContent);
                resolve({ success: true, data: structured, model });
              } else {
                reject(new Error('Empty content received from Gemini'));
              }
            } catch (err) {
              reject(new Error(`Failed to parse Gemini response: ${err.message}`));
            }
          } else {
            const err = new Error(`Gemini API error (Status ${res.statusCode}): ${responseData}`);
            err.statusCode = res.statusCode;
            reject(err);
          }
        });
      }
    );

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Gemini API request timed out'));
    });

    req.on('error', (err) => {
      reject(err);
    });

    req.write(requestBody);
    req.end();
  });

  try {
    return await doRequest();
  } catch (err) {
    if (retries > 0 && err.statusCode === 503) {
      // Small pause for transient 503 demand spikes
      await new Promise(r => setTimeout(r, 600));
      return await callGeminiApi(apiKey, model, systemPrompt, contents, retries - 1);
    }
    throw err;
  }
}

/**
 * Generate Companion Response using Gemini with automatic fallback chain
 */
async function generateGeminiCompanionResponse(userText, history = [], studentProfile = {}) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured');
  }

  const systemPrompt = `You are MindMate AI, an intelligent, empathetic, and supportive personal wellness and academic productivity companion for ${studentProfile.name || 'Yash Kumar'} (Roll No: ${studentProfile.rollNo || '2400521520071'}), studying ${studentProfile.branch || 'Computer Science & Engineering (Artificial Intelligence)'} at ${studentProfile.institution || 'Institute of Engineering and Technology (IET), Lucknow'}.

Core Guidelines:
1. Tone: Warm, validating, practical, and encouraging. Never sound like a robotic generic assistant.
2. Academic Context: Understand engineering challenges (Algorithms, OS, AI/ML, coding fatigue, exam pressure). Offer actionable study tips (e.g. active recall, breaking complex topics into 45-minute sprints).
3. Emotional Insight: Accurately identify feelings (stress, exhaustion, calm, motivation, sadness).
4. Crisis Safety: If the user hints at self-harm, hopelessness, or severe depression, prioritize safety above all: express deep empathy and provide the 24/7 National Tele-MANAS helpline (14416 / 1800-891-4416) and KIRAN (1800-599-0019). Set isCrisis: true.

Output Schema:
You MUST respond with a single valid JSON object strictly matching:
{
  "reply": "(string: your compassionate, supportive, and actionable response, clean markdown formatted, 2-3 paragraphs max)",
  "emotion": "(string: one of 'stressed', 'calm', 'motivated', 'exhausted', 'sad', 'neutral', 'crisis', 'study_query')",
  "confidence": (number: between 0.70 and 1.00),
  "suggestions": ["(string: 3 brief actionable prompt chips for the user, max 5 words each)"],
  "isCrisis": (boolean: true if distress/crisis, false otherwise)
}`;

  // Build multi-turn context (last 6 messages)
  const recentHistory = history.slice(-6);
  const contents = [];

  for (const msg of recentHistory) {
    if (msg.sender === 'user') {
      contents.push({
        role: 'user',
        parts: [{ text: msg.text }]
      });
    } else if (msg.sender === 'ai') {
      contents.push({
        role: 'model',
        parts: [{ text: msg.text }]
      });
    }
  }

  // Append current message
  contents.push({
    role: 'user',
    parts: [{ text: userText }]
  });

  // Try models in cascade
  let lastError = null;
  for (const model of GEMINI_MODELS) {
    try {
      const result = await callGeminiApi(apiKey, model, systemPrompt, contents);
      if (result.success && result.data) {
        return {
          ...result.data,
          source: 'gemini',
          model: result.model
        };
      }
    } catch (err) {
      console.warn(`[GeminiService] Error with model ${model}:`, err.message);
      lastError = err;
    }
  }

  throw lastError || new Error('All Gemini models failed');
}

module.exports = {
  generateGeminiCompanionResponse
};

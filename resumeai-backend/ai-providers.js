/**
 * ai-providers.js — ResumeAI
 * Providers: Gemini (primary) + Groq (fallback)
 * No Claude/Anthropic dependency.
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');
const Groq = require('groq-sdk');
const { logger } = require('./logger');

// ── Initialise clients ────────────────────────────────────────
const gemini = process.env.GEMINI_API_KEY
  ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
  : null;

const groq = process.env.GROQ_API_KEY
  ? new Groq({ apiKey: process.env.GROQ_API_KEY })
  : null;

// ── Log available providers on startup ───────────────────────
const available = [];
if (gemini) available.push('gemini');
if (groq)   available.push('groq');
console.log(`\n✦ AI Providers available: ${available.join(', ') || 'NONE — set API keys in .env'}`);

// ─────────────────────────────────────────────────────────────
//  GEMINI
//  Primary provider — best writing quality of the two
//  Model: gemini-1.5-flash (free tier: 15 req/min, 1M tokens/min)
//  Upgrade to gemini-1.5-pro for even better quality
// ─────────────────────────────────────────────────────────────
async function callGemini(systemPrompt, userPrompt) {
  if (!gemini) throw new Error('Gemini not configured — add GEMINI_API_KEY to .env');

  const model = gemini.getGenerativeModel({
    model: 'gemini-1.5-flash',        // or 'gemini-1.5-pro' for higher quality
    systemInstruction: systemPrompt,
    generationConfig: {
      responseMimeType: 'application/json',  // forces JSON output — critical
      temperature:      0.2,                 // low = consistent, structured output
      maxOutputTokens:  8192,
    },
  });

  const result = await model.generateContent(userPrompt);
  const text   = result.response.text();
  return parseJsonSafe(text, 'gemini');
}

// ─────────────────────────────────────────────────────────────
//  GROQ
//  Fallback provider — fastest, free tier
//  Model: llama-3.1-70b-versatile
// ─────────────────────────────────────────────────────────────
async function callGroq(systemPrompt, userPrompt) {
  if (!groq) throw new Error('Groq not configured — add GROQ_API_KEY to .env');

  const completion = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user',   content: userPrompt   },
    ],
    response_format: { type: 'json_object' },  // forces JSON output
    max_tokens:  4096,
    temperature: 0.2,
  });

  return parseJsonSafe(completion.choices[0].message.content, 'groq');
}

// ─────────────────────────────────────────────────────────────
//  SMART FALLBACK CHAIN
//  Tries Gemini first (better quality), falls back to Groq
//  provider param: 'auto' | 'gemini' | 'groq'
// ─────────────────────────────────────────────────────────────
async function callAI(systemPrompt, userPrompt, provider = 'auto', requestId = '') {
  const chains = {
    auto:   ['gemini', 'groq'],   // gemini first, groq fallback
    gemini: ['gemini', 'groq'],   // prefer gemini, fall back to groq
    groq:   ['groq', 'gemini'],   // prefer groq, fall back to gemini
  };

  const chain  = chains[provider] || chains.auto;
  const errors = [];

  for (const p of chain) {
    if (p === 'gemini' && !gemini) continue;
    if (p === 'groq'   && !groq)   continue;

    try {
      logger.info(`Attempting call with ${p}...`, { metadata: {} });

      const result = p === 'gemini'
        ? await callGemini(systemPrompt, userPrompt)
        : await callGroq(systemPrompt, userPrompt);

      result._provider = p;
      return result;

    } catch (err) {
      logger.error(`${p} failed`, {
        metadata: {
          message:    err.message,
          status:     err.status,
          statusText: err.statusText,
        }
      });
      errors.push(`${p}: ${err.message}`);
    }
  }

  throw new Error(`All AI providers failed:\n${errors.join('\n')}`);
}

// ─────────────────────────────────────────────────────────────
//  JSON PARSER
//  Handles all edge cases from AI responses
// ─────────────────────────────────────────────────────────────
function parseJsonSafe(text, providerName = 'unknown') {
  if (!text || !text.trim()) {
    throw new Error(`Empty response from ${providerName}`);
  }

  // Strip markdown code fences if present
  let cleaned = text
    .replace(/^```json\s*/im, '')
    .replace(/^```\s*/im,     '')
    .replace(/```\s*$/im,     '')
    .trim();

  // Find the outermost JSON object
  const start = cleaned.indexOf('{');
  const end   = cleaned.lastIndexOf('}');

  if (start === -1 || end === -1) {
    throw new Error(`No JSON object in ${providerName} response. Got: ${text.slice(0, 200)}`);
  }

  cleaned = cleaned.substring(start, end + 1);

  try {
    return JSON.parse(cleaned);
  } catch (e) {
    // Try fixing common JSON issues before giving up
    const fixed = cleaned
      .replace(/,(\s*[}\]])/g, '$1')   // trailing commas
      .replace(/\t/g, ' ');            // literal tabs

    try {
      return JSON.parse(fixed);
    } catch {
      throw new Error(`JSON parse failed for ${providerName}: ${e.message}`);
    }
  }
}

// ── Exports ───────────────────────────────────────────────────
function getAvailableProviders() {
  const providers = [];
  if (gemini) providers.push('gemini');
  if (groq)   providers.push('groq');
  return providers;
}

module.exports = {
  callAI,
  callGemini,
  callGroq,
  getAvailableProviders,
};
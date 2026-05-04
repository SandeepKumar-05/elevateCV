/**
 * resume-builder.js — ResumeAI
 * Three-stage pipeline: Extraction → Elaboration → Validation
 * Providers: Gemini (all 3 stages) + Groq (stages 1-2 only, skip validation)
 */

const promptEngine = require('./prompt-engine');
const aiProviders  = require('./ai-providers');
const { ResumeSchema } = require('./schemas');
const { logger } = require('./logger');

async function buildResumeData(params) {
  const {
    userPrompt,
    pages     = 1,
    provider  = 'auto',
    linkedin,
    github,
    email,
    portfolio,
    requestId = 'internal',
  } = params;

  const reqLogger    = logger.child({ requestId });
  const bulletCount  = pages === 1 ? 3 : pages === 2 ? 4 : 5;
  const projectCount = pages === 1 ? 2 : pages === 2 ? 4 : 6;

  // ─── STAGE 1: EXTRACTION ──────────────────────────────────
  reqLogger.info('Stage 1: Extracting facts from prompt...');
  const extractionPrompt = promptEngine.buildExtractionPrompt(userPrompt);
  const extractedData    = await aiProviders.callAI(
    extractionPrompt.systemPrompt,
    extractionPrompt.prompt,
    provider,
    requestId
  );

  const usedProvider = extractedData._provider || provider;
  delete extractedData._provider;

  // Merge explicitly provided links — always override AI extraction
  if (!extractedData.contact) extractedData.contact = {};
  if (linkedin)  extractedData.contact.linkedin  = linkedin;
  if (github)    extractedData.contact.github    = github;
  if (email)     extractedData.contact.email     = email;
  if (portfolio) extractedData.contact.portfolio = portfolio;

  // ─── STAGE 2: ELABORATION ─────────────────────────────────
  reqLogger.info('Stage 2: Elaborating content professionally...');
  const elaborationPrompt = promptEngine.buildElaborationPrompt(extractedData, pages);
  const elaboratedData    = await aiProviders.callAI(
    elaborationPrompt.systemPrompt,
    elaborationPrompt.prompt,
    provider,
    requestId
  );
  delete elaboratedData._provider;

  // ─── STAGE 3: VALIDATION ──────────────────────────────────
  // Run for Gemini — skip for Groq (Groq output is less reliable for validation)
  let validatedData;
  if (usedProvider === 'groq') {
    reqLogger.info('Stage 3: Skipped for Groq — validation runs with Gemini only');
    validatedData = elaboratedData;
  } else {
    reqLogger.info('Stage 3: Running quality validation with Gemini...');
    try {
      const validationPrompt = promptEngine.buildValidationPrompt(elaboratedData);
      validatedData = await aiProviders.callAI(
        validationPrompt.systemPrompt,
        validationPrompt.prompt,
        provider,
        requestId
      );
      delete validatedData._provider;
    } catch (err) {
      reqLogger.warn(`Stage 3 failed (${err.message}) — using elaborated data as fallback`);
      validatedData = elaboratedData;
    }
  }

  // ─── POST-PROCESSING ──────────────────────────────────────
  reqLogger.info('Post-processing: Normalizing and validating schema...');
  const normalizedData = postProcess(validatedData, bulletCount, projectCount);

  // ─── ZOD SCHEMA VALIDATION ────────────────────────────────
  const validationResult = ResumeSchema.safeParse(normalizedData);

  if (!validationResult.success) {
    const errors = validationResult.error.errors.map(
      e => `${e.path.join('.')}: ${e.message}`
    );
    reqLogger.error('Schema validation failed:\n' + errors.join('\n'));

    const repairedData = repairSchema(normalizedData, validationResult.error.errors);
    const retryResult  = ResumeSchema.safeParse(repairedData);

    if (retryResult.success) {
      reqLogger.info('Schema repair succeeded.');
      retryResult.data._provider = usedProvider;
      return retryResult.data;
    }

    reqLogger.warn('Schema repair failed — using normalizedData for PDF generation');
    normalizedData._provider = usedProvider;
    return normalizedData;
  }

  validationResult.data._provider = usedProvider;
  return validationResult.data;
}

// ─────────────────────────────────────────────────────────────
//  POST-PROCESS
// ─────────────────────────────────────────────────────────────
function postProcess(data, bulletCount, projectCount) {
  const cleaned = JSON.parse(JSON.stringify(data || {}));

  // ── CONTACT ──────────────────────────────────────────────
  cleaned.contact = cleaned.contact || {};
  const URL_FIELDS = ['linkedin', 'github', 'portfolio', 'twitter', 'stackoverflow'];
  ['name', 'email', 'phone', 'location', ...URL_FIELDS].forEach(key => {
    let val = String(cleaned.contact[key] || '').trim();
    if (URL_FIELDS.includes(key) && val) {
      if (!val.startsWith('http')) val = 'https://' + val;
      try { new URL(val); } catch { val = ''; }
    }
    cleaned.contact[key] = val;
  });

  // ── SUMMARY ───────────────────────────────────────────────
  cleaned.summary = String(cleaned.summary || '').trim();

  // ── EXPERIENCE ───────────────────────────────────────────
  cleaned.experience = coerceToArray(cleaned.experience)
    .map(exp => ({
      company:         String(exp.company         || '').trim(),
      role:            String(exp.role            || '').trim(),
      start:           String(exp.start           || '').trim(),
      end:             String(exp.end             || '').trim(),
      location:        String(exp.location        || '').trim(),
      employment_type: String(exp.employment_type || '').trim(),
      bullets:         coerceBullets(exp.bullets).slice(0, bulletCount),
    }))
    .filter(exp => exp.company && exp.role);

  // ── PROJECTS ─────────────────────────────────────────────
  cleaned.projects = coerceToArray(cleaned.projects)
    .map(proj => ({
      name:    String(proj.name || '').trim(),
      tech:    String(proj.tech || '').trim(),
      url:     sanitiseUrl(proj.url),
      bullets: coerceBullets(proj.bullets),
    }))
    .filter(proj => proj.name)
    .slice(0, projectCount);

  // ── SKILLS ───────────────────────────────────────────────
  const SKILL_CATEGORIES = ['Languages', 'Frameworks', 'Tools', 'Databases', 'Cloud'];
  if (
    typeof cleaned.skills !== 'object' ||
    cleaned.skills === null ||
    Array.isArray(cleaned.skills)
  ) {
    const flat = Array.isArray(cleaned.skills)
      ? cleaned.skills.map(s => String(s).trim()).filter(Boolean)
      : [];
    cleaned.skills = {
      Languages:  flat.slice(0, 4),
      Frameworks: flat.slice(4, 8),
      Tools:      flat.slice(8, 12),
      Databases:  flat.slice(12, 15),
      Cloud:      flat.slice(15),
    };
  } else {
    SKILL_CATEGORIES.forEach(cat => {
      cleaned.skills[cat] = coerceToStringArray(cleaned.skills[cat]);
    });
    Object.keys(cleaned.skills)
      .filter(k => !SKILL_CATEGORIES.includes(k))
      .forEach(key => {
        cleaned.skills['Tools'] = [
          ...(cleaned.skills['Tools'] || []),
          ...coerceToStringArray(cleaned.skills[key]),
        ];
        delete cleaned.skills[key];
      });
  }

  // ── EDUCATION ────────────────────────────────────────────
  cleaned.education = coerceToArray(cleaned.education)
    .map(edu => ({
      institution:  String(edu.institution  || '').trim(),
      degree:       String(edu.degree       || '').trim(),
      field:        String(edu.field        || '').trim(),
      year:         String(edu.year         || '').trim(),
      gpa:          String(edu.gpa          || '').trim(),
      achievements: String(edu.achievements || '').trim(),
    }))
    .filter(edu => edu.institution);

  // ── CERTIFICATIONS ───────────────────────────────────────
  cleaned.certifications = coerceToArray(cleaned.certifications)
    .map(c => {
      if (!c) return null;
      if (typeof c === 'string') return c.trim() ? { name: c.trim(), issuer: '', year: '' } : null;
      return {
        name:   String(c.name   || '').trim(),
        issuer: String(c.issuer || '').trim(),
        year:   String(c.year   || '').trim(),
      };
    })
    .filter(c => c && c.name);

  // ── AWARDS ───────────────────────────────────────────────
  cleaned.awards = coerceToArray(cleaned.awards)
    .map(a => {
      if (!a) return null;
      if (typeof a === 'string') return a.trim() ? { title: a.trim(), issuer: '', year: '', description: '' } : null;
      return {
        title:       String(a.title       || '').trim(),
        issuer:      String(a.issuer      || '').trim(),
        year:        String(a.year        || '').trim(),
        description: String(a.description || '').trim(),
      };
    })
    .filter(a => a && a.title);

  // ── PUBLICATIONS ─────────────────────────────────────────
  cleaned.publications = coerceToArray(cleaned.publications)
    .map(p => {
      if (!p) return null;
      if (typeof p === 'string') return p.trim() ? { title: p.trim(), venue: '', year: '', url: '' } : null;
      return {
        title: String(p.title || '').trim(),
        venue: String(p.venue || p.journal_or_conference || '').trim(),
        year:  String(p.year  || '').trim(),
        url:   sanitiseUrl(p.url),
        doi:   String(p.doi   || '').trim(),
      };
    })
    .filter(p => p && p.title);

  // ── VOLUNTEER ─────────────────────────────────────────────
  cleaned.volunteer = coerceToArray(cleaned.volunteer)
    .map(v => {
      if (!v) return null;
      return {
        organisation: String(v.organisation || v.organization || '').trim(),
        role:         String(v.role         || '').trim(),
        duration:     String(v.duration     || '').trim(),
        impact:       String(v.impact       || '').trim(),
      };
    })
    .filter(v => v && v.organisation);

  // ── OPEN SOURCE ──────────────────────────────────────────
  cleaned.open_source = coerceToArray(cleaned.open_source)
    .map(o => {
      if (!o) return null;
      return {
        project:      String(o.project      || '').trim(),
        contribution: String(o.contribution || '').trim(),
        url:          sanitiseUrl(o.url),
      };
    })
    .filter(o => o && o.project);

  // ── LANGUAGES & HOBBIES ──────────────────────────────────
  cleaned.languages = coerceToStringArray(cleaned.languages);
  cleaned.hobbies   = String(cleaned.hobbies || '').trim();

  // ── ATS SCORE (preserve if present) ──────────────────────
  cleaned.ats_score     = data.ats_score     || 0;
  cleaned.ats_reasoning = data.ats_reasoning || 'General Quality Estimation';

  return cleaned;
}

// ─────────────────────────────────────────────────────────────
//  SCHEMA REPAIR
// ─────────────────────────────────────────────────────────────
function repairSchema(data, zodErrors) {
  const repaired = JSON.parse(JSON.stringify(data));
  zodErrors.forEach(err => {
    const path = err.path;
    if (
      err.message.includes('expected array') ||
      err.message.includes('received string')
    ) {
      let obj = repaired;
      for (let i = 0; i < path.length - 1; i++) { obj = obj?.[path[i]]; if (!obj) return; }
      const k = path[path.length - 1];
      if (typeof obj?.[k] === 'string') {
        obj[k] = obj[k].split(',').map(s => s.trim()).filter(Boolean);
      }
    }
    if (err.message.includes('Invalid url') || err.message.includes('invalid_string')) {
      let obj = repaired;
      for (let i = 0; i < path.length - 1; i++) { obj = obj?.[path[i]]; if (!obj) return; }
      const k = path[path.length - 1];
      if (obj) obj[k] = '';
    }
  });
  return repaired;
}

// ─────────────────────────────────────────────────────────────
//  HELPERS
// ─────────────────────────────────────────────────────────────
function coerceToArray(val) {
  if (Array.isArray(val))     return val;
  if (!val)                    return [];
  if (typeof val === 'string') return val.trim() ? [val] : [];
  if (typeof val === 'object') return Object.values(val);
  return [];
}

function coerceToStringArray(val) {
  if (Array.isArray(val)) return val.map(s => String(s || '').trim()).filter(Boolean);
  if (typeof val === 'string' && val.trim()) return val.split(',').map(s => s.trim()).filter(Boolean);
  return [];
}

function coerceBullets(bullets) {
  if (Array.isArray(bullets)) {
    return bullets.map(b => String(b || '').trim().replace(/^[-*•]\s*/, '')).filter(Boolean);
  }
  if (typeof bullets === 'string' && bullets.trim()) {
    return bullets.split(/\n|\\n/).map(b => b.trim().replace(/^[-*•]\s*/, '')).filter(Boolean);
  }
  return [];
}

function sanitiseUrl(url) {
  if (!url) return '';
  let val = String(url).trim();
  if (!val) return '';
  if (!val.startsWith('http')) val = 'https://' + val;
  try { new URL(val); return val; } catch { return ''; }
}

module.exports = { 
  buildResumeData,
  postProcess,
  repairSchema
};
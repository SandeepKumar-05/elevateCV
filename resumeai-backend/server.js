process.on('uncaughtException', (err) => {
  console.error('CRITICAL: Uncaught Exception:', err.message);
  console.error(err.stack);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('CRITICAL: Unhandled Rejection at:', promise, 'reason:', reason);
});

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const pdfParse = require('pdf-parse');

const { logger, createRequestLogger } = require('./logger');
const aiProviders = require('./ai-providers');
const resumeBuilder = require('./resume-builder');
const htmlTemplates = require('./html-templates');
const pdfGenerator = require('./pdf-generator');
const promptEngine = require('./prompt-engine');

// Multer for memory storage
const upload = multer({ storage: multer.memoryStorage() });

const app = express();
const PORT = process.env.PORT || 3002;

// 1. Startup Health Checks
function startupCheck() {
  logger.info('✦ Running startup health checks...');
  
  // Check API keys
  const keys = ['GROQ_API_KEY', 'GEMINI_API_KEY'];
  const missing = keys.filter(k => !process.env[k]);
  if (missing.length === keys.length) {
    logger.error('CRITICAL: No AI API keys found. Server will not be able to generate resumes.');
  } else {
    logger.info(`✦ API Keys found: ${keys.filter(k => process.env[k]).map(k => k.split('_')[0]).join(', ')}`);
  }

  // Check templates directory
  const templatesDir = path.join(__dirname, 'templates');
  if (!fs.existsSync(templatesDir)) {
    logger.error(`CRITICAL: Templates directory missing at ${templatesDir}`);
    process.exit(1);
  }
}

startupCheck();

// 2. Middleware
app.use(helmet({
  contentSecurityPolicy: false, // Disabled for Puppeteer/Local rendering flexibility
}));
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Rate limiter
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50, // Increased for smoother dev/demo experience
  message: { error: 'Service busy, please try again in a moment', code: 'RATE_LIMIT_EXCEEDED' }
});
app.use('/api/', limiter);

const { v4: uuidv4 } = require('uuid');

// Request initialization middleware
app.use((req, res, next) => {
  const requestId = uuidv4();
  const reqLogger = createRequestLogger(requestId);
  
  req.logger = reqLogger;
  req.requestId = requestId;
  
  reqLogger.info(`${req.method} ${req.path} - Started`, { ip: req.ip });
  next();
});

// 3. Load templates
const TEMPLATES = {};
function loadTemplates() {
  const templatesDir = path.join(__dirname, 'templates');
  const files = ['jake.html', 'moderncv.html', 'altacv.html', 'deedy.html'];
  
  files.forEach(file => {
    const filePath = path.join(templatesDir, file);
    const key = file.replace('.html', '');
    try {
      if (fs.existsSync(filePath)) {
        TEMPLATES[key] = fs.readFileSync(filePath, 'utf8');
        logger.info(`✦ Loaded template: ${key}`);
      } else {
        logger.warn(`⚠ Missing template file: ${file}`);
      }
    } catch (e) {
      logger.error(`Failed to load template ${file}: ${e.message}`);
    }
  });
}
loadTemplates();

/**
 * ROUTE 1: POST /api/generate
 */
app.post('/api/generate', async (req, res) => {
  const { prompt, template = 'jake', pages = 1, provider = 'auto', linkedin, github, email, portfolio } = req.body;
  const startTime = Date.now();
  const reqLogger = req.logger;

  // Validation
  if (!prompt || typeof prompt !== 'string' || prompt.length < 30) {
    return res.status(400).json({ error: 'Please provide more detail (min 30 chars)', code: 'PROMPT_TOO_SHORT' });
  }

  const validatedPages = [1, 2, 3].includes(Number(pages)) ? Number(pages) : 1;
  const validatedTemplate = TEMPLATES[template] ? template : 'jake';

  reqLogger.info('Starting generation pipeline', { template: validatedTemplate, pages: validatedPages, provider });
  try {
    const resumeData = await resumeBuilder.buildResumeData({
      userPrompt: prompt,
      pages: validatedPages,
      provider: provider,
      linkedin,
      github,
      email,
      portfolio
    });

    const templateHtml = TEMPLATES[validatedTemplate];
    const filledHtml = htmlTemplates.buildHtml(templateHtml, resumeData, validatedPages);
    const pdfBuffer = await pdfGenerator.generatePdf(filledHtml, req.requestId);

    const duration = Date.now() - startTime;
    const filename = `${(resumeData.contact?.name || 'resume').replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()}_resume.pdf`;

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': pdfBuffer.length,
      'X-Request-Id': req.requestId,
      'X-Generation-Time': duration,
      'X-ATS-Score': resumeData.ats_score || 0,
      'X-ATS-Reason': resumeData.ats_reasoning || 'General Quality Estimation'
    });

    res.send(pdfBuffer);
  } catch (error) {
    const statusCode = error.message.includes('quota') || error.message.includes('exhausted') ? 503 : 
                    error.message.includes('not found') ? 404 : 500;
    
    reqLogger.error('Generation failed:', { error: error.message, stack: error.stack });
    
    res.status(statusCode).json({ 
      error: error.message || 'Internal server error', 
      code: statusCode === 503 ? 'AI_SERVICE_UNAVAILABLE' : 'INTERNAL_ERROR',
      requestId: req.requestId
    });
  }
});

/**
 * ROUTE 2: POST /api/optimize
 */
app.post('/api/optimize', async (req, res) => {
  const { resumeText, jobDescription, provider = 'auto' } = req.body;
  
  if (!jobDescription || !resumeText) {
    return res.status(400).json({ error: 'Missing resume data or job description' });
  }

  try {
    const optimizationPrompt = promptEngine.buildOptimizePrompt(resumeText, jobDescription);
    const aiResponse = await aiProviders.callAI('gemini', optimizationPrompt.systemPrompt, optimizationPrompt.prompt);
    
    // Extract JSON from AI response
    let result;
    try {
      const match = aiResponse.match(/\{[\s\S]*\}/);
      result = JSON.parse(match ? match[0] : aiResponse);
    } catch (e) {
      req.logger.error('Failed to parse optimization response', { aiResponse });
      throw new Error('AI returned malformed optimization data');
    }

    res.json(result);
  } catch (error) {
    req.logger.error('Optimization error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * ROUTE 3: POST /api/compile-latex (Renamed for compatibility, actually handles HTML -> PDF)
 */
app.post('/api/compile-latex', async (req, res) => {
  const { html, code } = req.body;
  const content = html || code; // Support both names
  if (!content) return res.status(400).json({ error: 'HTML/Code is required' });

  try {
    const pdfBuffer = await pdfGenerator.generatePdf(content, req.requestId);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename="resume.pdf"',
      'Content-Length': pdfBuffer.length
    });
    res.send(pdfBuffer);
  } catch (error) {
    req.logger.error('Compilation error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * ROUTE 4: POST /api/extract-pdf
 * Extracts text from an uploaded PDF.
 */
app.post('/api/extract-pdf', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'File is required' });

  try {
    const data = await pdfParse(req.file.buffer);
    res.json({ text: data.text });
  } catch (error) {
    req.logger.error('Extraction error:', error.message);
    res.status(500).json({ error: 'Failed to extract text from PDF' });
  }
});

/**
 * ROUTE 5: POST /api/edit-resume
 * Surgical patch: preserve all existing data, apply ONLY the requested change.
 * Phase 1: Parse resume text → structured JSON (via extraction pipeline)
 * Phase 2: Apply user's instruction as a surgical patch on top of that JSON
 */
app.post('/api/edit-resume', upload.single('file'), async (req, res) => {
  const { prompt, resumeText, template = 'jake' } = req.body;
  let rawText = resumeText;

  // Use uploaded file if provided
  if (req.file) {
    try {
      const data = await pdfParse(req.file.buffer);
      rawText = data.text;
    } catch (e) {
      return res.status(400).json({ error: 'Could not read uploaded PDF' });
    }
  }

  if (!rawText || !prompt) {
    return res.status(400).json({ error: 'Both resume data and edit instruction are required' });
  }

  try {
    // ── PHASE 1: Extract structured JSON from raw text ────────
    req.logger.info('Edit Phase 1: Extracting structured data from resume text...');
    const extractionPrompt = promptEngine.buildExtractionPrompt(rawText);
    const extractedData = await aiProviders.callAI(
      extractionPrompt.systemPrompt,
      extractionPrompt.prompt,
      'auto',
      req.requestId
    );
    delete extractedData._provider;

    // Quick elaboration pass so we have clean structured JSON
    const elaborationPrompt = promptEngine.buildElaborationPrompt(extractedData, 1);
    let structuredData = await aiProviders.callAI(
      elaborationPrompt.systemPrompt,
      elaborationPrompt.prompt,
      'auto',
      req.requestId
    );
    delete structuredData._provider;

    // ── PHASE 2: Surgical patch — apply ONLY the requested change ─
    req.logger.info('Edit Phase 2: Applying surgical patch per user instruction...');
    const editPrompt = promptEngine.buildEditPrompt(structuredData, prompt);
    const patchedData = await aiProviders.callAI(
      editPrompt.systemPrompt,
      editPrompt.prompt,
      'auto',
      req.requestId
    );
    delete patchedData._provider;

    // ── Validate and normalize schema ─────────────────────────
    const normalized = resumeBuilder.postProcess(patchedData, 3, 2);
    const { ResumeSchema } = require('./schemas');
    const validation = ResumeSchema.safeParse(normalized);
    let finalData = normalized;
    if (!validation.success) {
      finalData = resumeBuilder.repairSchema(normalized, validation.error.errors);
    }

    // ── Render template + generate PDF ───────────────────────
    const templateHtml = TEMPLATES[template] || TEMPLATES['jake'];
    const filledHtml = htmlTemplates.buildHtml(templateHtml, finalData, 1);
    const pdfBuffer = await pdfGenerator.generatePdf(filledHtml, req.requestId);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename="edited_resume.pdf"',
      'Content-Length': pdfBuffer.length,
      'X-Request-Id': req.requestId,
      'X-ATS-Score': finalData.ats_score || 0,
      'X-ATS-Reason': finalData.ats_reasoning || 'Edited resume',
    });
    res.send(pdfBuffer);

  } catch (error) {
    req.logger.error('Edit error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * ROUTE 6: GET /api/health
 */
app.get('/api/health', (req, res) => {
  const providers = aiProviders.getAvailableProviders();
  res.json({
    status: 'ok',
    version: '3.2.0-dynamic',
    timestamp: new Date().toISOString(),
    providers,
    templates_loaded: Object.keys(TEMPLATES),
    puppeteer: true
  });
});

// 4. Global Error Handler (must be last)
app.use((err, req, res, next) => {
  const reqLogger = req.logger || logger;
  const requestId = req.requestId || 'unknown';
  
  reqLogger.error('Unhandled Error:', { 
    message: err.message, 
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
    requestId 
  });

  const statusCode = err.status || 500;
  res.status(statusCode).json({
    error: err.message || 'Internal server error',
    code: err.code || 'INTERNAL_ERROR',
    requestId
  });
});

// Startup
app.listen(PORT, () => {
  logger.info(`\n✦ ResumeAI Backend v3.1.0 ("Strong") listening on http://localhost:${PORT}`);
  logger.info(`✦ Environment: ${process.env.NODE_ENV || 'development'}\n`);
});

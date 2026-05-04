const puppeteer = require('puppeteer');
const { logger } = require('./logger');

let browser = null;
let browserPromise = null;

async function getBrowser() {
  if (browser && browser.connected) return browser;
  
  if (browserPromise) return browserPromise;

  logger.info('✦ Launching Puppeteer browser singleton...');
  browserPromise = puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu']
  }).then(b => {
    browser = b;
    browser.on('disconnected', () => {
      logger.warn('⚠ Puppeteer browser disconnected. Cleaning up...');
      browser = null;
      browserPromise = null;
    });
    return browser;
  }).catch(err => {
    logger.error('Failed to launch browser:', err);
    browserPromise = null;
    throw err;
  });

  return browserPromise;
}

/**
 * Uses Puppeteer to generate high-quality PDFs from HTML strings.
 */
async function generatePdf(html, requestId = 'internal') {
  const reqLogger = logger.child({ requestId });
  let page = null;
  
  try {
    const browserInstance = await getBrowser();
    page = await browserInstance.newPage();
    
    // Set viewport to A4 size
    await page.setViewport({ width: 794, height: 1123, deviceScaleFactor: 2 });

    reqLogger.info('Generating PDF from HTML...');
    
    // Set content and wait until network is idle
    await page.setContent(html, { 
      waitUntil: 'networkidle0',
      timeout: 30000 
    });

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      preferCSSPageSize: false,
      displayHeaderFooter: false,
      margin: { top: '0in', bottom: '0in', left: '0in', right: '0in' }
    });

    reqLogger.info(`PDF generated successfully - Size: ${Math.round(pdfBuffer.length / 1024)}KB`);
    return pdfBuffer;
  } catch (error) {
    reqLogger.error('PDF Generation Error:', error.message);
    throw error;
  } finally {
    if (page) {
      await page.close().catch(e => reqLogger.error('Failed to close page:', e.message));
    }
  }
}

module.exports = {
  generatePdf
};

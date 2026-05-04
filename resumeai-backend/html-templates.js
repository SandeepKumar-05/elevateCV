/**
 * html-templates.js — ResumeAI v4.1
 * Matches jake-final.html placeholder tokens exactly.
 * All optional sections rendered conditionally — empty = no header shown.
 */

function buildHtml(templateString, data, pages) {
  const c = data.contact || {};

  // ── CONTACT LINE ─────────────────────────────────────────
  const links = [];
  if (c.phone)         links.push(`<span>${esc(c.phone)}</span>`);
  if (c.email)         links.push(`<a href="mailto:${esc(c.email)}">${esc(c.email)}</a>`);
  if (c.linkedin)      links.push(`<a href="${esc(c.linkedin)}" target="_blank">LinkedIn</a>`);
  if (c.github)        links.push(`<a href="${esc(c.github)}" target="_blank">GitHub</a>`);
  if (c.portfolio)     links.push(`<a href="${esc(c.portfolio)}" target="_blank">Portfolio</a>`);
  if (c.stackoverflow) links.push(`<a href="${esc(c.stackoverflow)}" target="_blank">Stack Overflow</a>`);
  if (c.twitter)       links.push(`<a href="${esc(c.twitter)}" target="_blank">Twitter</a>`);

  const contactHtml = links.join('<span class="sep"> | </span>');

  // ── EXPERIENCE ───────────────────────────────────────────
  const experienceHtml = (data.experience || [])
    .filter(job => job.company || job.role)
    .map(job => `
<div class="entry">
  <div class="entry-header">
    <div class="entry-left">
      <div class="entry-title">${esc(job.role || '')}</div>
      <div class="entry-sub">
        ${esc(job.company || '')}${job.location ? ` — ${esc(job.location)}` : ''}${job.employment_type ? ` <span class="emp-type">· ${esc(job.employment_type)}</span>` : ''}
      </div>
    </div>
    <div class="entry-right">${esc(job.start || '')}${job.end ? ` – ${esc(job.end)}` : ''}</div>
  </div>
  <ul class="bullets">
    ${(job.bullets || []).filter(Boolean).map(b => `<li>${esc(b)}</li>`).join('\n    ')}
  </ul>
</div>`).join('\n');

  // ── PROJECTS ─────────────────────────────────────────────
  const projectsHtml = (data.projects || [])
    .filter(p => p.name)
    .map(p => `
<div class="entry">
  <div class="entry-header">
    <div class="entry-left">
      <div class="entry-title">
        ${p.url ? `<a href="${esc(p.url)}" target="_blank">${esc(p.name)}</a>` : esc(p.name)}
        ${p.tech ? ` <span class="tech-stack">| ${esc(p.tech)}</span>` : ''}
      </div>
    </div>
  </div>
  <ul class="bullets">
    ${(p.bullets || []).filter(Boolean).map(b => `<li>${esc(b)}</li>`).join('\n    ')}
  </ul>
</div>`).join('\n');

  // ── SKILLS ───────────────────────────────────────────────
  const SKILL_ORDER = ['Languages', 'Frameworks', 'Tools', 'Databases', 'Cloud'];
  const skillsHtml = SKILL_ORDER
    .filter(cat => (data.skills?.[cat] || []).filter(Boolean).length > 0)
    .map(cat => `
<div class="skill-row">
  <span class="skill-cat">${esc(cat)}:</span>
  <span class="skill-vals">${(data.skills[cat] || []).filter(Boolean).map(esc).join(', ')}</span>
</div>`).join('\n');

  // ── EDUCATION ────────────────────────────────────────────
  const educationHtml = (data.education || [])
    .filter(e => e.institution)
    .map(e => `
<div class="entry">
  <div class="entry-header">
    <div class="entry-left">
      <div class="entry-title">${esc(e.institution || '')}</div>
      <div class="entry-sub">
        ${esc(e.degree || '')}${e.field ? ` in ${esc(e.field)}` : ''}${e.gpa ? ` — GPA: ${esc(e.gpa)}` : ''}
      </div>
      ${e.achievements ? `<div class="entry-achievement">${esc(e.achievements)}</div>` : ''}
    </div>
    <div class="entry-right">${esc(e.year || '')}</div>
  </div>
</div>`).join('\n');

  // ── CERTIFICATIONS (conditional) ─────────────────────────
  const certs = (data.certifications || []).filter(c => c && (typeof c === 'string' ? c.trim() : c.name));
  const certsSection = certs.length > 0 ? `
<div class="section-header">Certifications</div>
<ul class="cert-list">
  ${certs.map(c => {
    if (typeof c === 'string') return `<li>${esc(c)}</li>`;
    const issuer = c.issuer ? ` — ${esc(c.issuer)}` : '';
    const year   = c.year   ? ` (${esc(c.year)})`   : '';
    return `<li>${esc(c.name || '')}${issuer}${year}</li>`;
  }).join('\n  ')}
</ul>` : '';

  // ── PUBLICATIONS (conditional) ───────────────────────────
  const pubs = (data.publications || []).filter(p => p?.title);
  const publicationsSection = pubs.length > 0 ? `
<div class="section-header">Publications</div>
<ul class="pub-list">
  ${pubs.map(p => {
    const venue = p.venue ? ` — <em>${esc(p.venue)}</em>` : '';
    const year  = p.year  ? ` (${esc(p.year)})`  : '';
    const doi   = p.doi   ? ` DOI: ${esc(p.doi)}` : '';
    const link  = p.url   ? ` <a href="${esc(p.url)}" target="_blank">[link]</a>` : '';
    return `<li>${esc(p.title || '')}${venue}${year}${doi}${link}</li>`;
  }).join('\n  ')}
</ul>` : '';

  // ── AWARDS (conditional) ─────────────────────────────────
  const awards = (data.awards || []).filter(a => a && (typeof a === 'string' ? a.trim() : a.title));
  const awardsSection = awards.length > 0 ? `
<div class="section-header">Awards &amp; Achievements</div>
${awards.map(a => {
  if (typeof a === 'string') return `<div class="award-entry"><div class="award-title">${esc(a)}</div></div>`;
  return `
<div class="award-entry">
  <div class="award-header">
    <div class="award-title">${esc(a.title || '')}</div>
    <div class="award-meta">${[a.issuer, a.year].filter(Boolean).map(esc).join(' · ')}</div>
  </div>
  ${a.description ? `<div class="award-desc">${esc(a.description)}</div>` : ''}
</div>`;
}).join('\n')}` : '';

  // ── VOLUNTEER (conditional) ──────────────────────────────
  const vol = (data.volunteer || []).filter(v => v?.organisation);
  const volunteerSection = vol.length > 0 ? `
<div class="section-header">Volunteer Work</div>
${vol.map(v => `
<div class="entry vol-entry">
  <div class="entry-header">
    <div class="entry-left">
      <div class="entry-title">${esc(v.role || '')}</div>
      <div class="entry-sub">${esc(v.organisation || '')}</div>
    </div>
    <div class="entry-right">${esc(v.duration || '')}</div>
  </div>
  ${v.impact ? `<ul class="bullets"><li>${esc(v.impact)}</li></ul>` : ''}
</div>`).join('\n')}` : '';

  // ── OPEN SOURCE (conditional) ────────────────────────────
  const os = (data.open_source || []).filter(o => o?.project);
  const openSourceSection = os.length > 0 ? `
<div class="section-header">Open Source</div>
<ul class="os-list">
  ${os.map(o => {
    const nameHtml = o.url
      ? `<a href="${esc(o.url)}" target="_blank">${esc(o.project)}</a>`
      : esc(o.project);
    return `<li>${nameHtml}${o.contribution ? ` — ${esc(o.contribution)}` : ''}</li>`;
  }).join('\n  ')}
</ul>` : '';

  // ── LANGUAGES (conditional) ──────────────────────────────
  const langs = (data.languages || []).filter(Boolean);
  const languagesSection = langs.length > 0 ? `
<div class="section-header">Languages</div>
<div class="lang-text">${langs.map(esc).join(', ')}</div>` : '';

  // ── PAGE HEIGHT ──────────────────────────────────────────
  const pageHeight = { 1: '279mm', 2: '558mm', 3: '837mm' }[pages] || '279mm';

  // ── INJECT ALL PLACEHOLDERS ──────────────────────────────
  return templateString
    .replace(/\{\{NAME\}\}/g,              esc(c.name || 'Your Name'))
    .replace(/\{\{CONTACT\}\}/g,           contactHtml)
    .replace(/\{\{SUMMARY\}\}/g,           esc(data.summary || ''))
    .replace(/\{\{EXPERIENCE\}\}/g,        experienceHtml)
    .replace(/\{\{PROJECTS\}\}/g,          projectsHtml)
    .replace(/\{\{SKILLS\}\}/g,            skillsHtml)
    .replace(/\{\{EDUCATION\}\}/g,         educationHtml)
    .replace(/\{\{CERTS_SECTION\}\}/g,     certsSection)
    .replace(/\{\{PUBLICATIONS_SECTION\}\}/g, publicationsSection)
    .replace(/\{\{AWARDS_SECTION\}\}/g,    awardsSection)
    .replace(/\{\{VOLUNTEER_SECTION\}\}/g, volunteerSection)
    .replace(/\{\{OPEN_SOURCE_SECTION\}\}/g, openSourceSection)
    .replace(/\{\{LANGUAGES_SECTION\}\}/g, languagesSection)
    .replace(/\{\{PAGE_HEIGHT\}\}/g,       pageHeight);
}

// ── HTML escape ───────────────────────────────────────────────
function esc(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g,  '&amp;')
    .replace(/</g,  '&lt;')
    .replace(/>/g,  '&gt;')
    .replace(/"/g,  '&quot;')
    .replace(/'/g,  '&#39;');
}

module.exports = { buildHtml };
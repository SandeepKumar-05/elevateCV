/**
 * schemas.js — Zod validation schemas for ResumeAI v3.2
 * Updated to include all new resume sections:
 * awards, volunteer, publications, open_source, employment_type, etc.
 */

const { z } = require('zod');

// ── Helper: coerce string or array to array ───────────────────
const stringOrArray = z.union([
  z.array(z.string()),
  z.string().transform(s => s.split(',').map(x => x.trim()).filter(Boolean)),
]).default([]);

// ── Safe URL: accepts empty string, validates if non-empty ────
const safeUrl = z.string()
  .transform(val => {
    if (!val || val.trim() === '') return '';
    const trimmed = val.trim();
    if (!trimmed.startsWith('http')) return 'https://' + trimmed;
    return trimmed;
  })
  .refine(val => {
    if (!val) return true;
    try { new URL(val); return true; } catch { return false; }
  }, { message: 'Invalid URL' })
  .default('');

// ── Contact schema ────────────────────────────────────────────
const ContactSchema = z.object({
  name:          z.string().default(''),
  email:         z.string().default(''),
  phone:         z.string().default(''),
  location:      z.string().default(''),
  linkedin:      safeUrl,
  github:        safeUrl,
  portfolio:     safeUrl,
  twitter:       safeUrl,
  stackoverflow: safeUrl,
}).passthrough();

// ── Experience entry ──────────────────────────────────────────
const ExperienceSchema = z.object({
  company:         z.string().default(''),
  role:            z.string().default(''),
  start:           z.string().default(''),
  end:             z.string().default(''),
  location:        z.string().default(''),
  employment_type: z.string().default(''),
  bullets:         stringOrArray,
});

// ── Project entry ─────────────────────────────────────────────
const ProjectSchema = z.object({
  name:    z.string().default(''),
  tech:    z.string().default(''),
  url:     safeUrl,
  bullets: stringOrArray,
});

// ── Skills object ─────────────────────────────────────────────
const SkillsSchema = z.object({
  Languages:  stringOrArray,
  Frameworks: stringOrArray,
  Tools:      stringOrArray,
  Databases:  stringOrArray,
  Cloud:      stringOrArray,
}).passthrough(); // allow extra categories without crashing

// ── Education entry ───────────────────────────────────────────
const EducationSchema = z.object({
  institution:  z.string().default(''),
  degree:       z.string().default(''),
  field:        z.string().default(''),
  year:         z.string().default(''),
  gpa:          z.string().default(''),
  achievements: z.string().default(''),
});

// ── Certification entry ───────────────────────────────────────
const CertificationSchema = z.union([
  z.object({
    name:   z.string().default(''),
    issuer: z.string().default(''),
    year:   z.string().default(''),
  }),
  // Handle case where AI returns plain string
  z.string().transform(s => ({ name: s, issuer: '', year: '' })),
]);

// ── Award entry ───────────────────────────────────────────────
const AwardSchema = z.union([
  z.object({
    title:       z.string().default(''),
    issuer:      z.string().default(''),
    year:        z.string().default(''),
    description: z.string().default(''),
  }),
  z.string().transform(s => ({ title: s, issuer: '', year: '', description: '' })),
]);

// ── Volunteer entry ───────────────────────────────────────────
const VolunteerSchema = z.object({
  organisation: z.string().default(''),
  role:         z.string().default(''),
  duration:     z.string().default(''),
  impact:       z.string().default(''),
});

// ── Publication entry ─────────────────────────────────────────
const PublicationSchema = z.object({
  title:  z.string().default(''),
  venue:  z.string().default(''),
  year:   z.string().default(''),
  url:    safeUrl,
});

// ── Open source entry ─────────────────────────────────────────
const OpenSourceSchema = z.object({
  project:      z.string().default(''),
  contribution: z.string().default(''),
  url:          safeUrl,
});

// ── FULL RESUME SCHEMA ────────────────────────────────────────
const ResumeSchema = z.object({
  contact:       ContactSchema.default({}),
  summary:       z.string().default(''),
  experience:    z.array(ExperienceSchema).default([]),
  projects:      z.array(ProjectSchema).default([]),
  skills:        SkillsSchema.default({ Languages:[], Frameworks:[], Tools:[], Databases:[], Cloud:[] }),
  education:     z.array(EducationSchema).default([]),
  certifications:z.array(CertificationSchema).default([]),
  awards:        z.array(AwardSchema).default([]),
  volunteer:     z.array(VolunteerSchema).default([]),
  publications:  z.array(PublicationSchema).default([]),
  open_source:   z.array(OpenSourceSchema).default([]),
  languages:     stringOrArray,
  hobbies:       z.string().default(''),
}).passthrough(); // allow _provider and other internal fields

// ── Optimization result schema ────────────────────────────────
const OptimizationSchema = z.object({
  match_score:          z.union([z.number(), z.string()]).transform(Number).default(0),
  match_reasoning:      z.string().default(''),
  ats_keywords_present: stringOrArray,
  ats_keywords_missing: stringOrArray,
  semantic_matches:     stringOrArray,
  suggestions: z.array(z.object({
    priority:         z.string().default('medium'),
    section:          z.string().default(''),
    type:             z.string().default('rewrite'),
    original:         z.string().default(''),
    improved:         z.string().default(''),
    reason:           z.string().default(''),
    keyword_added:    z.string().default(''),
    estimated_impact: z.string().default(''),
  })).default([]),
  skills_to_add:    stringOrArray,
  title_alignment:  z.string().default(''),
  experience_gap:   z.string().default(''),
  overall_advice:   z.string().default(''),
});

module.exports = {
  ResumeSchema,
  OptimizationSchema,
  ContactSchema,
  ExperienceSchema,
  ProjectSchema,
  SkillsSchema,
};
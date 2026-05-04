import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useToast } from '../components/Toast'
import './Build.css'

const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '/api' : 'http://localhost:3002/api')

const TEMPLATES = [
  { id: 'jake',     name: "Jake's Resume", desc: 'Clean · Single column' },
  { id: 'moderncv', name: 'ModernCV',      desc: 'Two column · Bold'     },
  { id: 'altacv',   name: 'AltaCV',        desc: 'Sidebar · Modern'      },
  { id: 'deedy',    name: 'Deedy',         desc: 'Dense · FAANG style'   },
]

const PAGE_OPTIONS = [
  { val: 1, label: '1 Page',  sub: 'Fresher'  },
  { val: 2, label: '2 Pages', sub: '2–5 yrs'  },
  { val: 3, label: '3 Pages', sub: 'Senior'   },
]

const PROVIDERS = [
  { id: 'auto',   label: 'Auto',   quality: '★★★★★', note: 'Best available'    },
  { id: 'gemini', label: 'Gemini', quality: '★★★★★', note: 'Google · Fast'     },
  { id: 'groq',   label: 'Groq',   quality: '★★★☆☆', note: 'Llama · Free'     },
]

const STEPS = [
  'Analysing your prompt',
  'Extracting resume sections',
  'Elaborating professionally',
  'Injecting into template',
  'Puppeteer compiling PDF',
]

const STEP_DELAYS = [0, 1800, 3600, 5400, 7000]

const TIPS = [
  'Gemini gives the best professional writing',
  'Include numbers and percentages in your prompt',
  'Name every tool and technology you know',
  'Add LinkedIn URL for recruiter visibility',
  '1 page for under 3 years of experience',
]

export default function Build() {
  const toast    = useToast()
  const navigate = useNavigate()
  const timersRef = useRef([])

  // ── Form state ────────────────────────────────────────────
  const [prompt,    setPrompt]    = useState('')
  const [template,  setTemplate]  = useState('jake')
  const [pages,     setPages]     = useState(1)
  const [provider,  setProvider]  = useState('auto')
  const [links,     setLinks]     = useState({
    linkedin: '', github: '', email: '', portfolio: ''
  })

  // ── UI state ──────────────────────────────────────────────
  const [generating,    setGenerating]    = useState(false)
  const [currentStep,   setCurrentStep]   = useState(-1)
  const [doneSteps,     setDoneSteps]     = useState([])
  const [generated,     setGenerated]     = useState(false)
  const [pdfUrl,        setPdfUrl]        = useState(null)
  const [pdfFileName,   setPdfFileName]   = useState('resume.pdf')
  const [usedProvider,  setUsedProvider]  = useState('')
  const [atsScore,      setAtsScore]      = useState(0)
  const [atsReason,     setAtsReason]     = useState('')
  const [availProviders,setAvailProviders]= useState([])

  // ── Fetch available providers on mount ────────────────────
  useEffect(() => {
    fetch(`${API_URL}/health`)
      .then(r => r.json())
      .then(d => setAvailProviders(d.providers || []))
      .catch(() => {})
  }, [])

  // ── Clear all step timers ─────────────────────────────────
  function clearTimers() {
    timersRef.current.forEach(clearTimeout)
    timersRef.current = []
  }

  // ── Main generate handler ─────────────────────────────────
  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast('Please describe yourself first!', 'error')
      return
    }

    // Reset state
    clearTimers()
    setGenerating(true)
    setGenerated(false)
    setPdfUrl(null)
    setCurrentStep(0)
    setDoneSteps([])
    setUsedProvider('')
    setAtsScore(0)
    setAtsReason('')

    // ── Animate progress steps ──────────────────────────────
    STEP_DELAYS.forEach((delay, i) => {
      const t = setTimeout(() => {
        setCurrentStep(i)
        if (i > 0) setDoneSteps(prev => [...prev, i - 1])
      }, delay)
      timersRef.current.push(t)
    })

    // ── API call with abort controller ──────────────────────
    const controller = new AbortController()
    const timeoutId  = setTimeout(() => controller.abort(), 90000) // 90s timeout

    const startTime = Date.now()

    try {
      const res = await fetch(`${API_URL}/generate`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          template,
          pages,
          provider,
          linkedin:  links.linkedin,
          github:    links.github,
          email:     links.email,
          portfolio: links.portfolio,
        }),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!res.ok) {
        const errData = await res.json().catch(() => ({ error: 'Server error' }))
        throw new Error(errData.error || `HTTP ${res.status}`)
      }

      // ── Parse PDF blob ──────────────────────────────────
      const blob = await res.blob()

      // Extract filename from Content-Disposition header
      const disposition = res.headers.get('Content-Disposition') || ''
      const nameMatch   = /filename="([^"]*)"/.exec(disposition)
      const filename    = nameMatch?.[1] || 'resume.pdf'

      // Get which provider was used
      const providerUsed = res.headers.get('X-AI-Provider') || provider
      const score        = res.headers.get('X-ATS-Score') || 0
      const reason       = res.headers.get('X-ATS-Reason') || ''

      const url = URL.createObjectURL(blob)

      // ── Wait for minimum animation time ────────────────
      const minTime = STEP_DELAYS[STEP_DELAYS.length - 1] + 800
      const elapsed = Date.now() - startTime
      if (elapsed < minTime) {
        await new Promise(r => setTimeout(r, minTime - elapsed))
      }

      // ── Mark all steps done ─────────────────────────────
      clearTimers()
      setDoneSteps([0, 1, 2, 3, 4])
      setCurrentStep(-1)

      // ── Store results ───────────────────────────────────
      setPdfUrl(url)
      setPdfFileName(filename)
      setUsedProvider(providerUsed)
      setAtsScore(Number(score))
      setAtsReason(reason)
      window.__generatedPdfUrl      = url
      window.__generatedPdfFilename = filename

      setGenerated(true)
      setGenerating(false)
      toast(`Resume built with ${providerUsed.toUpperCase()} — Score: ${score}%`, 'success')

      // ── EXTRA: Prepare text for Optimization ─────────────
      try {
        const formData = new FormData()
        formData.append('file', blob, filename)
        const extractRes = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3002/api'}/extract-pdf`, {
          method: 'POST', body: formData
        })
        if (extractRes.ok) {
          const { text } = await extractRes.json()
          window.__generatedResumeText = text
        }
      } catch (e) {
        console.warn('Failed to pre-extract text for optimization', e)
      }
    } catch (err) {
      clearTimeout(timeoutId)
      clearTimers()
      console.error('Generation error:', err)
      setGenerating(false)
      setCurrentStep(-1)
      setDoneSteps([])

      if (err.name === 'AbortError') {
        toast('Request timed out — AI is taking too long. Try again.', 'error')
      } else if (err.message.includes('Failed to fetch') || err.message.includes('ERR_CONNECTION')) {
        toast('Cannot reach backend — run: cd backend && node server.js', 'error')
      } else {
        toast(err.message || 'Generation failed', 'error')
      }
    }
  }

  // ── PDF upload → extract text ─────────────────────────────
  const handleResumeUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    if (file.type !== 'application/pdf') {
      toast('Please upload a PDF file', 'error')
      return
    }

    toast('Extracting resume text...', 'info')
    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await fetch(`${API_URL}/extract-pdf`, {
        method: 'POST',
        body:   formData,
      })
      if (!res.ok) throw new Error('Extraction failed')
      const data = await res.json()
      if (data.text) {
        setPrompt(data.text)
        toast('Resume text extracted — review and edit if needed', 'success')
      } else {
        throw new Error('No text extracted')
      }
    } catch (err) {
      toast('Could not extract text — please type your details manually', 'error')
    }

    // Reset file input so same file can be re-uploaded
    e.target.value = ''
  }

  // ── Download PDF ──────────────────────────────────────────
  const downloadPdf = () => {
    if (!pdfUrl) { toast('No PDF ready — generate first', 'error'); return }
    const a      = document.createElement('a')
    a.href       = pdfUrl
    a.download   = pdfFileName
    a.click()
    toast('PDF downloaded!', 'success')
  }

  // ── Open PDF in new tab ───────────────────────────────────
  const openPdf = () => {
    if (!pdfUrl) { toast('No PDF ready — generate first', 'error'); return }
    window.open(pdfUrl, '_blank')
  }

  // ── Link field change helper ──────────────────────────────
  const setLink = (key, val) => setLinks(prev => ({ ...prev, [key]: val }))

  // ── Cleanup blob URL on unmount ───────────────────────────
  useEffect(() => {
    return () => {
      if (pdfUrl) URL.revokeObjectURL(pdfUrl)
      clearTimers()
    }
  }, [pdfUrl])

  return (
    <div className="build-page">

      {/* PAGE BANNER */}
      <div className="build-banner">
        <h1 className="banner-title bebas">BUILD RESUME</h1>
        <div className="banner-sub mono">Prompt → AI → Puppeteer → PDF</div>
      </div>

      <div className="build-layout">

        {/* ── LEFT COLUMN ── */}
        <div className="build-left">

          {/* 01 — PROMPT */}
          <div className="build-section">
            <div className="panel-header-row">
              <div className="panel-label mono">01 — DESCRIBE YOURSELF</div>
              <div className="upload-btn-wrap">
                <input
                  type="file"
                  id="resume-upload"
                  accept=".pdf"
                  onChange={handleResumeUpload}
                  style={{ display: 'none' }}
                />
                <button
                  className="btn-upload-small mono"
                  onClick={() => document.getElementById('resume-upload').click()}
                >
                  ↑ UPLOAD EXISTING RESUME
                </button>
              </div>
            </div>
            <textarea
              className="build-textarea sans"
              placeholder="e.g. I am Sandeep Kumar from Kerala. I completed B.Tech in Computer Science from ABC College in 2024 with 8.6 CGPA. I did an NLP internship at ICT Academy where I built a sign language converter using Python and TensorFlow achieving 90% accuracy. I also worked on web development projects using React and JavaScript. I published a paper at IEEE conference on Bidirectional Sign Language Conversion. Skills: Python, JavaScript, React, TensorFlow, C. Email: sandeep@gmail.com GitHub: github.com/sandeep"
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              data-gramm="false"
              data-gramm_editor="false"
              data-enable-grammarly="false"
              rows={8}
            />
            <div className="hint-text mono">
              → Include full name, college, CGPA, company names, technologies, and specific achievements with numbers
            </div>
          </div>

          {/* 02 — TEMPLATE */}
          <div className="build-section">
            <div className="panel-label mono">02 — ATS TEMPLATE</div>
            <div className="template-grid">
              {TEMPLATES.map(t => (
                <div
                  key={t.id}
                  className={`template-card ${template === t.id ? 'active' : ''}`}
                  onClick={() => setTemplate(t.id)}
                >
                  <div className="template-thumb">
                    <div className="thumb-lines">
                      {[65, 45, 100, 100, 80, 100, 60].map((w, i) => (
                        <div key={i} className="thumb-line" style={{ width: `${w}%` }} />
                      ))}
                    </div>
                  </div>
                  <div className="template-name mono">{t.name}</div>
                  <div className="template-meta sans">{t.desc}</div>
                  {template === t.id && <div className="template-check">✓</div>}
                </div>
              ))}
            </div>
          </div>

          {/* 03 — PAGES */}
          <div className="build-section">
            <div className="panel-label mono">03 — NUMBER OF PAGES</div>
            <div className="pages-selector">
              {PAGE_OPTIONS.map(o => (
                <button
                  key={o.val}
                  className={`page-btn mono ${pages === o.val ? 'active' : ''}`}
                  onClick={() => setPages(o.val)}
                >
                  {o.label}
                  <span className="page-btn-sub sans">{o.sub}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 04 — LINKS */}
          <div className="build-section">
            <div className="panel-label mono">04 — CLICKABLE LINKS (optional)</div>
            <div className="links-grid">
              {[
                { key: 'linkedin',  label: 'LinkedIn URL',  ph: 'linkedin.com/in/you' },
                { key: 'github',    label: 'GitHub URL',    ph: 'github.com/you'      },
                { key: 'email',     label: 'Email',         ph: 'you@email.com'       },
                { key: 'portfolio', label: 'Portfolio',     ph: 'yoursite.com'        },
              ].map(l => (
                <div key={l.key} className="link-field">
                  <div className="link-label mono">{l.label}</div>
                  <input
                    className="link-input sans"
                    value={links[l.key]}
                    placeholder={l.ph}
                    onChange={e => setLink(l.key, e.target.value)}
                    data-gramm="false"
                  />
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* ── RIGHT SIDEBAR ── */}
        <div className="build-sidebar">
          {/* GENERATE BUTTON */}
          <button
            className="btn-generate bebas"
            onClick={handleGenerate}
            disabled={generating}
          >
            <span className="btn-sweep" />
            <span className="btn-text">
              {generating ? 'GENERATING...' : 'GENERATE RESUME →'}
            </span>
          </button>

          {/* AI PROVIDER SELECTOR */}
          <div className="sidebar-panel">
            <div className="panel-label mono">AI PROVIDER</div>
            <div className="provider-grid">
              {PROVIDERS.map(p => {
                const isAvail = p.id === 'auto' || availProviders.includes(p.id)
                return (
                  <button
                    key={p.id}
                    className={`provider-btn ${provider === p.id ? 'active' : ''} ${!isAvail ? 'unavailable' : ''}`}
                    onClick={() => isAvail && setProvider(p.id)}
                    title={!isAvail ? `${p.id} not configured — add API key` : p.note}
                  >
                    <div className="provider-name mono">{p.label}</div>
                    <div className="provider-quality">{p.quality}</div>
                    <div className="provider-note sans">{p.note}</div>
                    {!isAvail && <div className="provider-unavail mono">NO KEY</div>}
                  </button>
                )
              })}
            </div>
          </div>

          {/* PROGRESS TRACKER */}
          {(generating || generated) && (
            <div className="sidebar-panel">
              <div className="panel-label mono">
                {generating ? 'BUILDING' : 'COMPLETED'}
                {usedProvider && !generating && (
                  <span className="provider-badge mono"> via {usedProvider.toUpperCase()}</span>
                )}
              </div>
              <div className="progress-list">
                {STEPS.map((s, i) => (
                  <div
                    key={s}
                    className={`step ${
                      doneSteps.includes(i) ? 'done'
                      : currentStep === i  ? 'active'
                      : ''
                    }`}
                  >
                    <div className="step-dot" />
                    <div className="step-label mono">{s}</div>
                    {doneSteps.includes(i) && <div className="step-check">✓</div>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* PDF PREVIEW + DOWNLOAD */}
          {generated && !generating && pdfUrl && (
            <>
              {/* ATS SCORE PANEL */}
              {atsScore > 0 && (
                <div className="sidebar-panel ats-score-panel fade-in">
                  <div className="panel-label mono">ATS QUALITY SCORE</div>
                  <div className="ats-score-row">
                    <div className="ats-score-num bebas">{atsScore}%</div>
                    <div className="ats-score-meter">
                      <div className="ats-meter-bar" style={{ width: `${atsScore}%` }} />
                    </div>
                  </div>
                  <div className="ats-reason sans">{atsReason}</div>
                </div>
              )}

              <div className="sidebar-panel">
                <div className="panel-label mono">
                  YOUR RESUME
                  {usedProvider && (
                    <span className="provider-badge mono"> · {usedProvider.toUpperCase()}</span>
                  )}
                </div>

                <div className="pdf-preview-frame">
                  <iframe
                    src={pdfUrl}
                    title="Resume Preview"
                    className="pdf-iframe"
                  />
                </div>

                <button className="dl-btn mono" onClick={downloadPdf}>
                  ↓ DOWNLOAD PDF
                </button>
                <button className="view-btn mono" onClick={openPdf}>
                  ↗ OPEN FULLSCREEN
                </button>
                <button
                  className="edit-nav-btn mono"
                  onClick={() => {
                    navigate('/edit')
                    toast('PDF loaded in editor', 'info')
                  }}
                >
                  → OPEN IN EDITOR
                </button>
              </div>
            </>
          )}

          {/* TIPS */}
          <div className="sidebar-panel">
            <div className="panel-label mono">TIPS</div>
            <ul className="tips-list mono">
              {TIPS.map((t, i) => (
                <li key={i}><span className="tip-arrow">→</span>{t}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
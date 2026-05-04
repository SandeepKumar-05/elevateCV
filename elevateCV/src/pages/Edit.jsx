import { useState } from 'react'
import { useToast } from '../components/Toast'
import './Edit.css'

const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '/api' : '/api')

const TEMPLATES = ['jake', 'moderncv', 'altacv', 'deedy']

const EDIT_EXAMPLES = [
  'Tailor my resume for a Senior React Developer role',
  'Add a new project: AI Chatbot using Python and OpenAI API',
  'Make my summary more professional and ATS-friendly',
  'Add Docker and Kubernetes to my skills',
  'Rewrite all bullet points with stronger action verbs and metrics',
  'Change my job title to Full Stack Engineer',
]

export default function Edit() {
  const toast = useToast()

  const [file,           setFile]           = useState(null)
  const [resumeText,     setResumeText]     = useState('')
  const [isExtracting,   setIsExtracting]   = useState(false)
  const [prompt,         setPrompt]         = useState('')
  const [isEditing,      setIsEditing]      = useState(false)
  const [resultPdfUrl,   setResultPdfUrl]   = useState(null)
  const [originalPdfUrl, setOriginalPdfUrl] = useState(null)
  const [template,       setTemplate]       = useState('jake')
  const [atsScore,       setAtsScore]       = useState(0)
  const [editCount,      setEditCount]      = useState(0)

  // ── Upload & extract PDF text ────────────────────────────────
  const handleFileChange = async (e) => {
    const f = e.target.files[0]
    if (!f) return
    if (f.type !== 'application/pdf') {
      toast('Please upload a PDF file', 'error')
      return
    }

    setFile(f)
    setOriginalPdfUrl(URL.createObjectURL(f))
    setResultPdfUrl(null)
    setAtsScore(0)

    setIsExtracting(true)
    const formData = new FormData()
    formData.append('file', f)

    try {
      const res = await fetch(`${API_URL}/extract-pdf`, { method: 'POST', body: formData })
      if (!res.ok) throw new Error('Extraction failed')
      const data = await res.json()
      setResumeText(data.text || '')
      toast('Resume loaded — now describe what to change below', 'success')
    } catch {
      toast('Could not extract text automatically — you can paste it manually', 'info')
    } finally {
      setIsExtracting(false)
    }
  }

  // ── Drop zone drag handlers ──────────────────────────────────
  const handleDrop = (e) => {
    e.preventDefault()
    const f = e.dataTransfer.files[0]
    if (f) handleFileChange({ target: { files: [f] } })
  }

  // ── Submit edit ──────────────────────────────────────────────
  const handleEdit = async () => {
    if (!resumeText.trim() && !file) {
      toast('Please upload a resume PDF or paste your resume text', 'error')
      return
    }
    if (!prompt.trim()) {
      toast('Please describe what you want to change', 'error')
      return
    }

    setIsEditing(true)

    try {
      const res = await fetch(`${API_URL}/edit-resume`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ resumeText, prompt, template }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Edit failed' }))
        throw new Error(err.error || 'Edit failed')
      }

      const blob = await res.blob()
      const url  = URL.createObjectURL(blob)
      setResultPdfUrl(url)
      setEditCount(c => c + 1)

      const score = Number(res.headers.get('X-ATS-Score') || 0)
      setAtsScore(score)

      toast(`Edit applied! ${score > 0 ? `ATS Score: ${score}%` : ''}`, 'success')
    } catch (err) {
      toast(err.message || 'Failed to edit resume', 'error')
    } finally {
      setIsEditing(false)
    }
  }

  const downloadResult = () => {
    if (!resultPdfUrl) return
    const a      = document.createElement('a')
    a.href       = resultPdfUrl
    a.download   = `edited_resume_v${editCount}.pdf`
    a.click()
    toast('Downloaded!', 'success')
  }

  const applyExample = (ex) => {
    setPrompt(ex)
    toast('Example loaded — click APPLY EDIT', 'info')
  }

  return (
    <div className="edit-page">
      <div className="edit-banner">
        <div>
          <h1 className="banner-title bebas">EDIT WITH AI</h1>
          <div className="banner-sub mono">Upload → Describe Change → Same Template → Updated PDF</div>
        </div>
        {editCount > 0 && (
          <div className="edit-counter mono">
            {editCount} edit{editCount > 1 ? 's' : ''} applied
            {atsScore > 0 && <span className="ats-badge"> · ATS {atsScore}%</span>}
          </div>
        )}
      </div>

      <div className="edit-layout">

        {/* ── LEFT: INPUTS ── */}
        <div className="edit-left">

          {/* 01 — UPLOAD */}
          <div className="edit-section">
            <div className="panel-label mono">01 — UPLOAD YOUR RESUME PDF</div>
            <div
              className={`drop-zone ${file ? 'has-file' : ''}`}
              onClick={() => document.getElementById('edit-file-in').click()}
              onDragOver={e => e.preventDefault()}
              onDrop={handleDrop}
            >
              <input
                type="file"
                id="edit-file-in"
                accept=".pdf"
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />
              <div className="drop-icon">{file ? '✓' : '↑'}</div>
              <div className="drop-text mono">
                {file ? file.name : 'DROP PDF HERE OR CLICK TO UPLOAD'}
              </div>
              {!file && <div className="drop-hint mono">Your resume stays intact — only requested changes apply</div>}
            </div>
            {isExtracting && <div className="extracting-indicator mono">READING RESUME...</div>}
          </div>

          {/* 02 — EXTRACTED TEXT (editable) */}
          <div className="edit-section">
            <div className="panel-label-row">
              <div className="panel-label mono">02 — RESUME CONTENT</div>
              <div className="panel-sublabel mono">{resumeText.length > 0 ? `${resumeText.length} chars extracted` : 'or paste manually'}</div>
            </div>
            <textarea
              className="edit-textarea-content mono"
              placeholder="Resume text will appear here after upload, or paste your resume text manually..."
              value={resumeText}
              onChange={e => setResumeText(e.target.value)}
              disabled={isExtracting}
            />
          </div>

          {/* 03 — EDIT INSTRUCTION */}
          <div className="edit-section">
            <div className="panel-label mono">03 — WHAT SHOULD CHANGE? (BE SPECIFIC)</div>
            <textarea
              className="edit-textarea mono"
              placeholder={`Describe exactly what to change. Examples:\n• Add a new project: AI chatbot using Python and GPT-4\n• Tailor my resume for a Senior Backend Engineer role\n• Rewrite bullet points with stronger action verbs\n• Update my summary to highlight ML experience`}
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
            />
            <div className="examples-row">
              {EDIT_EXAMPLES.slice(0, 3).map((ex, i) => (
                <button key={i} className="example-chip mono" onClick={() => applyExample(ex)}>
                  {ex}
                </button>
              ))}
            </div>
          </div>

          {/* 04 — TEMPLATE */}
          <div className="edit-section">
            <div className="panel-label mono">04 — OUTPUT TEMPLATE</div>
            <div className="edit-tpl-grid">
              {TEMPLATES.map(t => (
                <button
                  key={t}
                  className={`tpl-mini-btn mono ${template === t ? 'active' : ''}`}
                  onClick={() => setTemplate(t)}
                >
                  {t.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {/* ACTION */}
          <div className="edit-actions">
            <button
              className="btn-edit-run bebas"
              onClick={handleEdit}
              disabled={isEditing || isExtracting}
            >
              <span className="btn-sweep" />
              <span className="btn-text">
                {isEditing ? 'APPLYING EDIT...' : editCount > 0 ? '→ APPLY ANOTHER EDIT' : '→ APPLY EDIT'}
              </span>
            </button>
            {editCount > 0 && (
              <p className="edit-note mono">All previous data is preserved. Only your requested change was applied.</p>
            )}
          </div>
        </div>

        {/* ── RIGHT: PREVIEW PANEL ── */}
        <div className="edit-right">

          {/* No file yet */}
          {!file && !isEditing && (
            <div className="no-preview mono">
              ↑ UPLOAD A RESUME TO BEGIN
            </div>
          )}

          {/* Editing overlay */}
          {isEditing && (
            <div className="editing-overlay">
              <div className="spinner-dots">
                <div className="dot" />
                <div className="dot" />
                <div className="dot" />
              </div>
              <div className="glitch-text mono">APPLYING YOUR EDIT...</div>
              <div className="edit-overlay-note mono">Preserving all existing data · Only patching what you asked</div>
            </div>
          )}

          {/* Side-by-side: original + edited */}
          {!isEditing && (
            <div className="preview-split">

              {/* Original */}
              {originalPdfUrl && (
                <div className="preview-panel">
                  <div className="preview-lbl mono">ORIGINAL VERSION</div>
                  <iframe src={originalPdfUrl} title="Original PDF" className="pdf-frame" />
                </div>
              )}

              {/* Edited result */}
              {resultPdfUrl && (
                <div className="preview-panel">
                  <div className="preview-lbl mono accent">
                    EDITED v{editCount}
                    {atsScore > 0 && <span className="ats-inline"> · ATS {atsScore}%</span>}
                  </div>
                  <iframe src={resultPdfUrl} title="Edited PDF" className="pdf-frame" />
                  <button className="btn-dl-edit mono" onClick={downloadResult}>
                    ↓ DOWNLOAD EDITED PDF
                  </button>
                </div>
              )}

              {/* Waiting for first edit */}
              {originalPdfUrl && !resultPdfUrl && (
                <div className="preview-panel preview-waiting">
                  <div className="preview-lbl mono">EDITED VERSION</div>
                  <div className="waiting-hint mono">
                    ← Describe your change and click APPLY EDIT
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

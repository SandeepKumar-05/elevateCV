import { useState, useEffect } from 'react'
import { useToast } from '../components/Toast'
import './Optimize.css'

const MOCK_KEYWORDS = ['Docker', 'TypeScript', 'Agile', 'Redux', 'CI/CD']
const MOCK_SUGGESTIONS = [
  {
    section: 'Experience',
    original: 'Worked on React components and fixed bugs in the frontend.',
    improved: 'Engineered 15+ reusable React components, reducing bug count by 42% and cutting development time by 30% across 3 product teams.',
    reason: 'Added quantifiable metrics and active voice to demonstrate impact.',
  },
  {
    section: 'Summary',
    original: 'I am a developer with experience in web technologies.',
    improved: 'Results-driven Full Stack Developer with 2+ years of experience building high-performance web applications using React and Node.js, delivering 40% faster load times.',
    reason: 'Replaced generic statement with specific skills, experience level, and a key achievement.',
  },
  {
    section: 'Skills',
    original: 'JavaScript, React, Node',
    improved: 'JavaScript (ES6+), React 18, Redux Toolkit, Node.js, Docker, CI/CD (GitHub Actions)',
    reason: 'Added version numbers and missing keywords from the job description.',
  },
]

export default function Optimize() {
  const toast = useToast()
  const [jd, setJd] = useState('')
  const [analysing, setAnalysing] = useState(false)
  const [done, setDone] = useState(false)
  const [score, setScore] = useState(0)
  const [animScore, setAnimScore] = useState(0)
  const [suggestions, setSuggestions] = useState([])
  const [accepted, setAccepted] = useState([])
  const [dismissed, setDismissed] = useState([])

  useEffect(() => {
    if (window.__prefillJD) { setJd(window.__prefillJD); window.__prefillJD = null }
  }, [])

  const analyse = async () => {
    if (!jd.trim()) { toast('Please paste a job description first', 'error'); return }
    
    // Get existing resume text if available
    const resumeText = window.__generatedResumeText || "";

    setAnalysing(true)
    setDone(false)
    setAccepted([]); setDismissed([])
    
    try {
      const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '/api' : 'http://localhost:3002/api');
      const res = await fetch(`${API_URL}/optimize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jd, resumeText })
      });

      if (!res.ok) throw new Error('Optimization failed');
      const data = await res.json();
      
      const s = data.score || 0;
      setScore(s)
      setSuggestions(data.suggestions || [])
      
      // animate score
      let v = 0
      const step = s / 30
      const timer = setInterval(() => {
        v = Math.min(v + step, s)
        setAnimScore(Math.round(v))
        if (v >= s) clearInterval(timer)
      }, 40)
      
      setAnalysing(false)
      setDone(true)
      toast(`Analysis complete!`, 'success')
    } catch (err) {
      setAnalysing(false)
      toast(err.message, 'error')
    }
  }

  const scoreLabel = animScore >= 75 ? 'GREAT MATCH' : animScore >= 60 ? 'NEEDS IMPROVEMENT' : 'LOW MATCH'

  return (
    <div className="opt-page">
      <div className="opt-banner">
        <h1 className="banner-title bebas">OPTIMIZE RESUME</h1>
        <div className="banner-sub mono">JD Matches → Keyword Fixes → Score</div>
      </div>

      <div className="opt-layout">
        {/* LEFT COLUMN */}
        <div className="opt-left">
          
          <div className="opt-section">
            <div className="panel-label mono">01 — JOB DESCRIPTION</div>
            <textarea
              className="opt-textarea sans"
              placeholder={`Paste the full job description here…\n\nExample:\nWe are looking for a React Developer with 2+ years of experience...\n- Strong knowledge of TypeScript\n- Experience with Docker and CI/CD pipelines`}
              value={jd}
              onChange={e => setJd(e.target.value)}
              data-gramm="false"
              data-gramm_editor="false"
              data-enable-grammarly="false"
            />
            <button
              className="btn-opt-generate bebas"
              onClick={analyse}
              disabled={analysing}
            >
              <span className="btn-sweep"></span>
              <span className="btn-text">
                {analysing ? 'ANALYSING JD...' : 'ANALYZE & OPTIMIZE →'}
              </span>
            </button>
          </div>

          {done && (
            <div className="opt-section fade-in">
              <div className="panel-label mono">MISSING KEYWORDS</div>
              <p className="hint-text mono" style={{marginTop:0, marginBottom:16}}>Add these to beat ATS filters</p>
              <div className="kw-grid">
                {MOCK_KEYWORDS.map(k => (
                  <span key={k} className="kw-tag mono">{k}</span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN */}
        <div className="opt-right">
          
          {analysing && (
            <div className="empty-state fade-in">
              <div className="glitch-text mono">PROCESSING...</div>
              <p className="hint-text mono">Extracting semantic match and generating improvements.</p>
            </div>
          )}

          {!done && !analysing && (
            <div className="empty-state">
              <div className="empty-icon">⎔</div>
              <p className="hint-text mono">Paste a Job Description to begin analysis.</p>
            </div>
          )}

          {done && (
            <>
              <div className="opt-section score-section fade-in">
                <div className="panel-label mono">MATCH SCORE</div>
                <div className="score-box">
                  <div className="score-number bebas">{animScore}%</div>
                  <div className="score-label mono">{scoreLabel}</div>
                </div>
              </div>

              <div className="opt-section pt-0 fade-in">
                <div className="panel-label mono">AI SUGGESTIONS</div>
                <div className="sugg-list">
                  {suggestions.map((s, i) => (
                    !dismissed.includes(i) && (
                      <div key={i} className={`sugg-item ${accepted.includes(i) ? 'accepted' : ''}`}>
                        <div className="sugg-sec-tag mono">{s.section}</div>
                        
                        <div className="sugg-content">
                          <div className="sugg-row">
                            <span className="sugg-badge mono">Original</span>
                            <span className="sugg-text org sans">{s.original}</span>
                          </div>
                          <div className="sugg-row">
                            <span className="sugg-badge mono">Improved</span>
                            <span className="sugg-text imp sans">{s.improved}</span>
                          </div>
                        </div>
                        
                        <div className="sugg-reason mono">Reason: {s.reason}</div>
                        
                        {accepted.includes(i) ? (
                          <div className="sugg-accepted mono">✓ ACCEPTED</div>
                        ) : (
                          <div className="sugg-actions">
                            <button className="s-btn outline mono" onClick={() => setDismissed(d => [...d, i])}>✕ DISMISS</button>
                            <button className="s-btn solid mono" onClick={() => { setAccepted(a => [...a, i]); toast('Accepted') }}>✓ ACCEPT</button>
                          </div>
                        )}
                      </div>
                    )
                  ))}
                </div>
                
                <button
                  className="btn-opt-generate bebas"
                  style={{marginTop: 24}}
                  onClick={() => toast('Regenerating PDF...', 'success')}
                >
                  <span className="btn-sweep"></span>
                  <span className="btn-text">APPLY ALL & REGENERATE PDF</span>
                </button>
              </div>
            </>
          )}

        </div>
      </div>
    </div>
  )
}


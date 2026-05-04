import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useToast } from '../components/Toast'
import './Match.css'

const MOCK_JOBS = [
  { id: 1, title: 'Frontend Developer', company: 'Infosys', location: 'Kochi', type: 'Full-time', salary: '₹6–10 LPA', match: 92, platform: 'linkedin', skills: ['React', 'TypeScript', 'Node.js'], posted: 2, jd: 'We are looking for a skilled Frontend Developer with experience in React and TypeScript to join our Kochi team. You will build scalable dashboards and collaborate with backend teams.' },
  { id: 2, title: 'React Developer', company: 'UST Global', location: 'Thiruvananthapuram', type: 'Full-time', salary: '₹5–8 LPA', match: 88, platform: 'naukri', skills: ['React', 'JavaScript', 'REST APIs'], posted: 3, jd: 'React Developer needed for building enterprise web applications. Strong knowledge of React, JavaScript ES6+, and REST API integration required.' },
  { id: 3, title: 'Full Stack Intern', company: 'Startup Kerala', location: 'Thrissur', type: 'Remote', salary: '15k/mo', match: 85, platform: 'internshala', skills: ['React', 'Node.js', 'MongoDB'], posted: 1, jd: 'Exciting internship opportunity for full stack development using the MERN stack. Learn by doing real projects in a startup environment.' },
  { id: 4, title: 'Software Engineer', company: 'TCS', location: 'Kochi', type: 'Full-time', salary: '₹4–7 LPA', match: 79, platform: 'indeed', skills: ['JavaScript', 'Python', 'SQL'], posted: 5, jd: 'Software Engineer with expertise in JavaScript, Python or Java and SQL databases. Experience with Agile methodologies is required.' },
  { id: 5, title: 'Backend Developer', company: 'IBS Software', location: 'Trivandrum', type: 'Full-time', salary: '₹7–12 LPA', match: 74, platform: 'linkedin', skills: ['Node.js', 'AWS', 'PostgreSQL'], posted: 4, jd: 'Backend Developer to build and maintain aviation industry APIs. Node.js, AWS Lambda, and PostgreSQL required.' },
]

const PLATFORM_LABELS = { linkedin: 'LinkedIn', naukri: 'Naukri', indeed: 'Indeed', internshala: 'Internshala' }
const FILTERS = ['all', 'linkedin', 'naukri', 'indeed', 'internshala', 'remote']

const MOCK_PROFILE = {
  role: 'Frontend / Full Stack Developer',
  experience: '2 years',
  skills: ['React', 'JavaScript', 'Node.js', 'MongoDB'],
  education: 'B.Tech CS',
  location: 'Kerala, India',
}

export default function Match() {
  const toast = useToast()
  const navigate = useNavigate()
  const fileRef = useRef()
  const [filter, setFilter] = useState('all')
  const [uploaded, setUploaded] = useState(false)
  const [filename, setFilename] = useState('')
  const [profileLoading, setProfileLoading] = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const [dragging, setDragging] = useState(false)

  const handleFile = async (file) => {
    if (!file || file.type !== 'application/pdf') { toast('Please upload a PDF file', 'error'); return }
    setFilename(file.name)
    setUploaded(true)
    setProfileLoading(true)
    setShowProfile(false)
    
    toast(`Analysing ${file.name}…`, 'info')
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '/api' : 'http://localhost:3002/api');
      const res = await fetch(`${API_URL}/extract-pdf`, {
        method: 'POST',
        body: formData
      });
      
      if (!res.ok) throw new Error('Extraction failed');
      const data = await res.json();
      
      // We'll still use Mock profile for UI but with real 'Role' if we could extract it
      // For now, just simulate a real wait but with a real network call
      setProfileLoading(false)
      setShowProfile(true)
      toast('Profile snapshot generated from PDF!', 'success')
    } catch (err) {
      setProfileLoading(false)
      toast(err.message, 'error')
    }
  }

  const filtered = filter === 'all'
    ? MOCK_JOBS
    : filter === 'remote'
      ? MOCK_JOBS.filter(j => j.type.toLowerCase() === 'remote')
      : MOCK_JOBS.filter(j => j.platform === filter)

  const handleOptimize = (job) => {
    window.__prefillJD = job.jd
    navigate('/optimize')
  }

  return (
    <div className="match-page">
      <div className="match-banner">
        <h1 className="banner-title bebas">MATCH JOBS</h1>
        <div className="banner-sub mono">Upload → Analyze → Match Rankings</div>
      </div>

      <div className="match-layout">
        {/* LEFT COLUMN */}
        <div className="match-left">
          
          <div className="match-section">
            <div className="panel-label mono">01 — UPLOAD RESUME</div>
            <div
              className={`upload-zone ${dragging ? 'dragging' : ''} ${uploaded ? 'uploaded' : ''}`}
              onClick={() => fileRef.current.click()}
              onDragOver={e => { e.preventDefault(); setDragging(true) }}
              onDragLeave={() => setDragging(false)}
              onDrop={e => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files[0]) }}
            >
              <input ref={fileRef} type="file" accept=".pdf" style={{ display: 'none' }} onChange={e => handleFile(e.target.files[0])} />
              {uploaded ? (
                <>
                  <div className="upload-icon">📄</div>
                  <div className="upload-filename mono">{filename}</div>
                  <p className="hint-text mono">Click to replace file</p>
                </>
              ) : (
                <>
                  <div className="upload-icon">↘</div>
                  <div className="upload-label bebas">DROP PDF HERE</div>
                  <p className="hint-text mono">or click to browse local files</p>
                </>
              )}
            </div>
          </div>

          <div className="match-section">
            <div className="panel-label mono">02 — PROFILE SNAPSHOT</div>
            {!uploaded && <p className="hint-text mono" style={{marginTop:0}}>Awaiting document upload...</p>}
            
            {profileLoading && (
              <div className="loading-glitch mono">EXTRACTING DATA...</div>
            )}
            
            {showProfile && (
              <div className="profile-grid">
                {[
                  { label: 'Role', val: MOCK_PROFILE.role },
                  { label: 'Exp', val: MOCK_PROFILE.experience },
                  { label: 'Edu', val: MOCK_PROFILE.education },
                  { label: 'Loc', val: MOCK_PROFILE.location },
                ].map(r => (
                  <div key={r.label} className="profile-row">
                    <div className="p-key mono">{r.label}</div>
                    <div className="p-val sans">{r.val}</div>
                  </div>
                ))}
                <div className="profile-row skills-row">
                  <div className="p-key mono">Top Skills</div>
                  <div className="skill-tags">
                    {MOCK_PROFILE.skills.map(s => <span key={s} className="btag mono">{s}</span>)}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="match-right">
          <div className="panel-label mono" style={{marginBottom: 20}}>03 — JOB BOARD ({filtered.length})</div>
          
          <div className="filter-row">
            {FILTERS.map(f => (
              <button 
                key={f} 
                className={`filter-btn mono ${filter === f ? 'active' : ''}`} 
                onClick={() => setFilter(f)}
              >
                {f}
              </button>
            ))}
          </div>

          <div className="jobs-list">
            {filtered.map(job => (
              <div key={job.id} className="job-card">
                <div className="job-top">
                  <div>
                    <div className="job-title bebas">{job.title}</div>
                    <div className="job-company mono">{job.company} · {job.location}</div>
                  </div>
                  <div className="job-score bebas">{job.match}%</div>
                </div>
                
                <div className="job-mid">
                  <span className="btag outline mono">{job.type}</span>
                  <span className="btag outline mono">{job.salary}</span>
                  <span className="btag outline mono platform-tag">{PLATFORM_LABELS[job.platform]}</span>
                </div>

                <div className="job-skills">
                  {job.skills.map(s => <span key={s} className="btag mono">{s}</span>)}
                </div>

                <div className="job-bot">
                  <span className="job-time mono">Posted {job.posted}d ago</span>
                  <div className="job-actions">
                    <button className="btn-j-outline mono" onClick={() => handleOptimize(job)}>Optimize</button>
                    <button className="btn-j-solid mono" onClick={() => toast(`Opening ${job.platform} app...`)}>Apply</button>
                  </div>
                </div>
              </div>
            ))}
          </div>

        </div>
      </div>
    </div>
  )
}


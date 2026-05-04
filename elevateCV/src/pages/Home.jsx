import { useNavigate } from 'react-router-dom'
import ReviewSection from '../components/ReviewSection'
import Footer from '../components/Footer'
import './Home.css'


export default function Home() {
  const navigate = useNavigate()

  const features = [
    {
      num: '01',
      title: 'Build from Prompt',
      desc: 'Type anything about yourself. AI structures, elaborates, and compiles a professional ATS resume with clickable links.',
      to: '/build',
    },
    {
      num: '02',
      title: 'Smart Job Match',
      desc: 'Upload your resume. Get ranked jobs from LinkedIn, Naukri, Indeed and Internshala with a match score for each listing.',
      to: '/match',
    },
    {
      num: '03',
      title: 'JD Optimization',
      desc: 'Paste a job description. AI finds missing keywords, rewrites your bullet points, and shows before/after diffs.',
      to: '/optimize',
    },
    {
      num: '04',
      title: 'Edit With AI',
      desc: 'Upload an existing PDF and prompt the AI to rewrite or restyle it. Professional results in seconds.',
      to: '/edit',
    },
  ]

  const stats = [
    { value: '4', label: 'ATS Templates' },
    { value: '8+', label: 'Job Platforms' },
    { value: 'AI', label: 'Powered Editor' },
    { value: '∞', label: 'Versions' },
  ]

  return (
    <div className="home-page container">
      <section className="hero-section">
        
        {/* LEFT COLUMN */}
        <div className="hero-left">
          <div className="eyebrow">
            India's AI Resume Platform · 2025
          </div>
          
          <h1 className="hero-title">
            Land the<br />
            job you<br />
            <span className="hero-italic">deserve.</span>
          </h1>
          
          <p className="hero-desc">
            Build ATS-ready resumes from a single prompt. Match with live jobs from 
            LinkedIn, Naukri, Indeed & Internshala. Let AI rewrite your resume for every application.
          </p>
          
          <div className="hero-actions">
            <button className="btn hero-btn-solid" onClick={() => { window.scrollTo(0, 0); navigate('/build'); }}>
              BUILD MY RESUME
            </button>
            <button className="btn hero-btn-outline" onClick={() => { window.scrollTo(0, 0); navigate('/match'); }}>
              BROWSE JOBS
            </button>
          </div>
          
          <div className="hero-foot">
            POWERED BY GROQ · LLAMA 3.1 · HTML5 TYPESETTING
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="hero-right">
          <div className="stats-grid">
            {stats.map((s, i) => (
              <div key={i} className="stat-box">
                <div className="stat-value bebas">{s.value}</div>
                <div className="stat-label mono">{s.label}</div>
              </div>
            ))}
          </div>
          
          <div className="marquee-wrapper">
            <div className="marquee-content bebas">
              BUILD ✦ MATCH ✦ OPTIMIZE ✦ APPLY ✦ LAND ✦ BUILD ✦ MATCH ✦ OPTIMIZE ✦ APPLY ✦ LAND ✦
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES STRIP */}
      <section className="features-strip">
        {features.map((f, i) => (
          <div key={i} className="feature-block" onClick={() => { window.scrollTo(0, 0); navigate(f.to); }}>
            <div className="f-hover-bar"></div>
            <div className="f-num bebas">{f.num}</div>
            <h3 className="f-title playfair">{f.title}</h3>
            <p className="f-desc sans">{f.desc}</p>
            <div className="f-arrow">→</div>
          </div>
        ))}
      </section>

      {/* REVIEW SYSTEM */}
      <ReviewSection />

      {/* FOOTER */}
      <Footer />
    </div>
  )
}

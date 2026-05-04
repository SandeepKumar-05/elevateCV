import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import AuthModal from './AuthModal'
import './Navbar.css'

const navItems = [
  { to: '/', label: 'Home' },
  { to: '/build', label: 'Build' },
  { to: '/match', label: 'Match' },
  { to: '/optimize', label: 'Optimize' },
  { to: '/edit', label: 'Edit' },
]

export default function Navbar({ theme, toggleTheme }) {
  const [showAuth, setShowAuth] = useState(false)
  const [authMode, setAuthMode] = useState('signin')
  const [open, setOpen] = useState(false)

  const storedUser = (() => {
    try { return JSON.parse(localStorage.getItem('resumeai_user')) } catch { return null }
  })()

  const handleLogout = () => {
    localStorage.removeItem('resumeai_user')
    window.location.reload()
  }

  return (
    <>
      <nav className="navbar">
        {/* LEFT — Logo */}
        <div className="nav-left">
          <NavLink to="/" className="nav-logo">
            <span className="logo-lower">elevate</span>
            <span className="logo-cv">CV</span>
          </NavLink>
        </div>

        {/* RIGHT HAND SIDE (Tabs + Auth) */}
        <div className="nav-rhs">
          {/* CENTER — Navigation links (desktop inline, mobile overlay) */}
          <div className={`nav-center ${open ? 'mobile-open' : ''}`}>
          <ul className="nav-tabs">
            {navItems.map(({ to, label }) => (
              <li key={to} className="nav-tab">
                <NavLink
                  to={to}
                  className={({ isActive }) => `tab-link ${isActive ? 'active' : ''}`}
                  end={to === '/'}
                  onClick={() => setOpen(false)}
                >
                  {label}
                  <div className="tab-bar"></div>
                </NavLink>
              </li>
            ))}
          </ul>
        </div>

        {/* RIGHT — Theme toggle, auth, hamburger */}
        <div className="nav-right">
          <button
            className={`theme-circle-btn ${theme}`}
            onClick={toggleTheme}
            aria-label="Toggle theme"
          >
            {theme === 'light' ? '☀' : '☾'}
          </button>

          <div className="auth-btns">
            {storedUser ? (
              <button
                className="btn btn-ghost mono auth-action-btn"
                onClick={handleLogout}
              >
                OUT
              </button>
            ) : (
              <button
                className="btn btn-solid mono auth-action-btn"
                onClick={() => { setAuthMode('signup'); setShowAuth(true) }}
              >
                JOIN
              </button>
            )}
          </div>

          {/* Hamburger — mobile only */}
          <button
            className="nav-hamburger"
            onClick={() => setOpen(!open)}
            aria-label="Menu"
          >
            <div className={`ham-bar ${open ? 'open' : ''}`}></div>
          </button>
        </div>
      </div>
      </nav>

      {showAuth && (
        <AuthModal
          mode={authMode}
          onClose={() => setShowAuth(false)}
          onSuccess={(userData) => {
            localStorage.setItem('resumeai_user', JSON.stringify(userData))
            setShowAuth(false)
            window.location.reload()
          }}
        />
      )}
    </>
  )
}

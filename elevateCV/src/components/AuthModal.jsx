import { useState } from 'react'
import './AuthModal.css'

export default function AuthModal({ mode: initialMode, onClose, onSuccess }) {
  const [mode, setMode] = useState(initialMode)
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [loading, setLoading] = useState(false)

  const handle = async (e) => {
    e.preventDefault()
    setLoading(true)
    await new Promise(r => setTimeout(r, 900))
    setLoading(false)
    onSuccess({ name: form.name || form.email.split('@')[0], email: form.email, guest: false })
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box fade-in">
        <button className="modal-close" onClick={onClose}>✕</button>

        <div className="modal-logo" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span className="logo-lower">elevate</span><span className="logo-cv">CV</span>
        </div>

        <div className="modal-tabs">
          <button className={`modal-tab ${mode === 'signin' ? 'active' : ''}`} onClick={() => setMode('signin')}>Sign In</button>
          <button className={`modal-tab ${mode === 'signup' ? 'active' : ''}`} onClick={() => setMode('signup')}>Sign Up</button>
        </div>

        <form onSubmit={handle} className="modal-form">
          {mode === 'signup' && (
            <div className="form-group">
              <label>Full Name</label>
              <input className="input" placeholder="Alex Johnson" value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
            </div>
          )}
          <div className="form-group">
            <label>Email</label>
            <input className="input" type="email" placeholder="you@example.com" value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input className="input" type="password" placeholder="••••••••" value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required />
          </div>
          <button className="btn btn-primary" type="submit" style={{ width: '100%', marginTop: 8 }} disabled={loading}>
            {loading ? 'Please wait…' : mode === 'signin' ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <div className="modal-divider"><span>or</span></div>

        <button className="btn btn-ghost" style={{ width: '100%' }} onClick={() => {
          onSuccess({ guest: true, name: 'Guest' })
        }}>
          🙋 Continue as Guest
        </button>

        <p className="modal-note">
          {mode === 'signin' ? "Don't have an account? " : 'Already have an account? '}
          <button className="link-btn" onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}>
            {mode === 'signin' ? 'Sign Up' : 'Sign In'}
          </button>
        </p>

        {/* Guest note */}
        <div className="guest-info-box">
          <strong>ℹ Guest Mode:</strong> You can use all features, but job alerts and saved preferences require an account.
        </div>
      </div>
    </div>
  )
}

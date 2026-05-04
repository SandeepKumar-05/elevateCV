import React, { createContext, useContext, useState, useCallback } from 'react'

const ToastCtx = createContext()
export const useToast = () => useContext(ToastCtx)

export default function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const toast = useCallback((msg, type = 'info') => {
    const id = Date.now() + Math.random()
    setToasts(t => [...t, { id, msg, type }])
    setTimeout(() => {
      setToasts(t => t.map(x => x.id === id ? { ...x, removing: true } : x))
      setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 280)
    }, 2800)
  }, [])

  return (
    <ToastCtx.Provider value={toast}>
      {children}
      <div className="toast-container">
        {toasts.map(t => (
          <div key={t.id} className={`toast ${t.type} ${t.removing ? 'removing' : ''}`}>
            <span className="toast-icon">
              {t.type === 'success' ? '✓' : t.type === 'error' ? '✕' : 'ℹ'}
            </span>
            {t.msg}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  )
}

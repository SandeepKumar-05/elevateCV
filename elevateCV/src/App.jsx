import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import ToastProvider from './components/Toast'
import Home from './pages/Home'
import Build from './pages/Build'
import Match from './pages/Match'
import Optimize from './pages/Optimize'
import Edit from './pages/Edit'

import './index.css'

export default function App() {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('resumeai_theme') || 'light';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('resumeai_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  return (
    <BrowserRouter>

      <ToastProvider>
        <Navbar theme={theme} toggleTheme={toggleTheme} />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/build" element={<Build />} />
          <Route path="/match" element={<Match />} />
          <Route path="/optimize" element={<Optimize />} />
          <Route path="/edit" element={<Edit />} />
        </Routes>
      </ToastProvider>
    </BrowserRouter>
  )
}

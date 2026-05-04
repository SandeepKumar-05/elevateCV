import React from 'react';
import { Link } from 'react-router-dom';
import './Footer.css';

const Footer = () => {
    return (
        <footer className="footer container">
            <div className="footer-top">
                <div className="footer-brand">
                    <Link to="/" className="nav-logo footer-logo">
                        <span className="logo-lower">elevate</span>
                        <span className="logo-cv">CV</span>
                    </Link>
                    <p className="mono">India's Premium AI Resume Builder</p>
                </div>
                <div className="footer-links">
                    <div className="link-group">
                        <h4 className="mono">PRODUCT</h4>
                        <Link to="/build" className="footer-link">Build Resume</Link>
                        <Link to="/match" className="footer-link">Job Match</Link>
                        <Link to="/optimize" className="footer-link">Optimize JD</Link>
                    </div>
                    <div className="link-group">
                        <h4 className="mono">RESOURCES</h4>
                        <Link to="/" className="footer-link">Templates</Link>
                        <Link to="/" className="footer-link">ATS Guide</Link>
                        <Link to="/" className="footer-link">FAQ</Link>
                    </div>
                    <div className="link-group">
                        <h4 className="mono">CONNECT</h4>
                        <a href="https://twitter.com" className="footer-link" target="_blank" rel="noopener noreferrer">Twitter/X</a>
                        <a href="https://github.com" className="footer-link" target="_blank" rel="noopener noreferrer">GitHub</a>
                        <a href="mailto:contact@elevatecv.ai" className="footer-link">Contact</a>
                    </div>
                </div>
            </div>
            <div className="footer-bottom mono">
                <div className="footer-copy">© 2025 ELEVATE CV. ALL RIGHTS RESERVED.</div>
                <div className="footer-legal">
                    <span>PRIVACY</span>
                    <span>TERMS</span>
                    <span>MADE IN INDIA</span>
                </div>
            </div>
        </footer>
    );
};

export default Footer;

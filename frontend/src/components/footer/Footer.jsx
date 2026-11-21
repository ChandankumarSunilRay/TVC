import React from "react";
import { Link } from "react-router-dom";
import "./footer.css";

const Footer = () => {
  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
        <div className="site-footer-top">
          <div className="site-footer-brand">
            <Link to="/" className="site-footer-logo">
              <img src="/favicon.svg" alt="" width="34" height="34" className="site-footer-mark" />
              <span>The Virtual Campus</span>
            </Link>
          </div>
          <nav className="site-footer-links" aria-label="Legal and support">
            <Link to="/privacy" aria-label="Privacy policy">Privacy</Link>
            <Link to="/terms">Terms</Link>
            <Link to="/refund" aria-label="Refund and cancellation policy">Refunds</Link>
            <Link to="/contact">Contact</Link>
          </nav>
          <div className="site-footer-support">
            <p>Get in touch</p>
            <a href="mailto:thevirtualcampus.support@gmail.com">
              thevirtualcampus.support@gmail.com
            </a>
          </div>
        </div>
        <div className="site-footer-bottom">
          <p>&copy; {new Date().getFullYear()} The Virtual Campus.</p>
          <p>Owned and operated by Chandankumar Sunil Ray.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

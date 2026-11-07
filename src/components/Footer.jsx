import { Link } from 'react-router-dom';
import Logo from './Logo.jsx';
import './Footer.css';

export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="footer">
      <div className="container footer__grid">
        <div className="footer__brand">
          <Logo variant="light" size={28} tagline />
          <p>The digital operations centre for your business — people, customers, calls and money in one place.</p>
        </div>

        <nav aria-label="Product">
          <h3>Product</h3>
          <ul>
            <li><a href="/#features">Features</a></li>
            <li><a href="/#how-it-works">How it works</a></li>
            <li><a href="/#pricing">Pricing</a></li>
            <li><a href="/#faq">FAQ</a></li>
            <li><Link to="/blog">Blog</Link></li>
            <li><a href="/#demo">Book a demo</a></li>
          </ul>
        </nav>

        <nav aria-label="Features">
          <h3>Features</h3>
          <ul>
            <li>Employees &amp; HR</li>
            <li>Verified attendance</li>
            <li>Leave management</li>
            <li>Customers &amp; invoicing</li>
            <li>Income &amp; expenses</li>
          </ul>
        </nav>

        <nav aria-label="Account">
          <h3>Account</h3>
          <ul>
            <li><Link to="/signup">Create account</Link></li>
            <li><Link to="/login">Log in</Link></li>
            <li><a href="mailto:hello@workard.com">hello@workard.com</a></li>
            <li><Link to="/privacy">Privacy Policy</Link></li>
          </ul>
        </nav>
      </div>
      <div className="container footer__bottom">
        <p>© {year} Workard. All rights reserved.</p>
      </div>
    </footer>
  );
}

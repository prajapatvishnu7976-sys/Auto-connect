import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-top">
          <div className="footer-brand">
            <div className="footer-logo">
              <span>🛺</span>
              <span>Auto<span className="accent">Connect</span></span>
            </div>
            <p className="footer-desc">
              Connecting students with reliable auto-rickshaw routes.
              Find your ride, share your commute, travel smarter.
            </p>
          </div>

          <div className="footer-links-group">
            <h4>Quick Links</h4>
            <Link to="/">Browse Routes</Link>
            <Link to="/login">Login</Link>
            <Link to="/signup">Sign Up</Link>
          </div>

          <div className="footer-links-group">
            <h4>For Drivers</h4>
            <Link to="/signup">Register as Driver</Link>
            <Link to="/login">Driver Login</Link>
          </div>

          <div className="footer-links-group">
            <h4>Support</h4>
            <a href="#">Help Center</a>
            <a href="#">Contact Us</a>
            <a href="#">Privacy Policy</a>
          </div>
        </div>

        <div className="footer-bottom">
          <p>© {new Date().getFullYear()} AutoConnect. Built for campus commuting.</p>
          <p className="footer-tagline">Made with ❤️ for students & drivers</p>
        </div>
      </div>

      <style>{`
        .footer {
          background: linear-gradient(180deg, #0f172a 0%, #1e293b 100%);
          color: #94a3b8;
          margin-top: auto;
          padding-top: 60px;
        }
        .footer-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 24px;
        }
        .footer-top {
          display: grid;
          grid-template-columns: 2fr 1fr 1fr 1fr;
          gap: 40px;
          padding-bottom: 40px;
          border-bottom: 1px solid rgba(148, 163, 184, 0.15);
        }
        .footer-logo {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 22px;
          font-weight: 800;
          color: #fff;
          margin-bottom: 16px;
        }
        .footer-logo .accent {
          background: linear-gradient(135deg, #60a5fa, #a78bfa);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .footer-desc {
          font-size: 14px;
          line-height: 1.7;
          max-width: 280px;
          color: #64748b;
        }
        .footer-links-group h4 {
          color: #f1f5f9;
          font-size: 14px;
          font-weight: 700;
          margin-bottom: 16px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .footer-links-group a {
          display: block;
          color: #64748b;
          font-size: 14px;
          margin-bottom: 10px;
          transition: color 0.2s;
        }
        .footer-links-group a:hover {
          color: #60a5fa;
        }
        .footer-bottom {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 24px 0;
          font-size: 13px;
        }
        .footer-tagline {
          color: #475569;
        }
        @media (max-width: 768px) {
          .footer-top {
            grid-template-columns: 1fr 1fr;
            gap: 32px;
          }
          .footer-bottom {
            flex-direction: column;
            gap: 8px;
            text-align: center;
          }
        }
        @media (max-width: 480px) {
          .footer-top {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </footer>
  );
}
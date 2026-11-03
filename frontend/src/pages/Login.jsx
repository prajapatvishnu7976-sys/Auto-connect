import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const user = await login(email, password);
      if (user.role === "student") navigate("/student");
      else if (user.role === "driver") navigate("/driver");
      else if (user.role === "admin") navigate("/admin");
      else navigate("/");
    } catch (err) {
      setError(err.response?.data?.error || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      {/* LEFT PANEL */}
      <div className="auth-left">
        <div className="auth-left-content">
          <div className="auth-brand">
            <span className="brand-icon">🛺</span>
            <span className="brand-name">AutoConnect</span>
          </div>
          <h1 className="auth-left-title">Welcome back to smarter commuting</h1>
          <p className="auth-left-desc">
            Login to track live autos, manage your rides, and stay connected with your campus routes.
          </p>
          <div className="auth-features">
            <div className="auth-feature">
              <span>📍</span> Live GPS tracking
            </div>
            <div className="auth-feature">
              <span>🪑</span> Real-time seat availability
            </div>
            <div className="auth-feature">
              <span>🗺️</span> Verified campus routes
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="auth-right">
        <div className="auth-form-wrapper">
          <h2 className="auth-form-title">Sign in to your account</h2>
          <p className="auth-form-subtitle">
            Don't have an account? <Link to="/signup">Create one free</Link>
          </p>

          {error && <div className="msg-error">⚠️ {error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Email address</label>
              <input
                type="email"
                placeholder="you@college.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
              />
            </div>

            <div className="form-group">
              <label>Password</label>
              <div className="password-field">
                <input
                  type={showPass ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="toggle-pass"
                  onClick={() => setShowPass(!showPass)}
                >
                  {showPass ? "🙈" : "👁️"}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary auth-submit"
              disabled={loading}
            >
              {loading ? (
                <span className="btn-loading">
                  <span className="btn-spinner"></span> Signing in...
                </span>
              ) : (
                "Sign In →"
              )}
            </button>
          </form>

          <div className="auth-divider">
            <span>or continue as</span>
          </div>

          <div className="auth-roles">
            <Link to="/signup" className="role-chip">🎓 Student</Link>
            <Link to="/signup" className="role-chip">🚗 Driver</Link>
          </div>
        </div>
      </div>

      <style>{`
        .auth-page {
          display: flex;
          min-height: calc(100vh - 70px);
          margin: -40px -20px;
        }
        .auth-left {
          flex: 1;
          background: linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #312e81 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 60px;
          position: relative;
          overflow: hidden;
        }
        .auth-left::before {
          content: '';
          position: absolute;
          width: 400px;
          height: 400px;
          background: radial-gradient(circle, rgba(99,102,241,0.2), transparent 70%);
          top: -100px;
          right: -100px;
        }
        .auth-left-content {
          position: relative;
          z-index: 1;
          max-width: 420px;
        }
        .auth-brand {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 40px;
        }
        .brand-icon { font-size: 32px; }
        .brand-name {
          font-size: 24px;
          font-weight: 800;
          color: #fff;
        }
        .auth-left-title {
          font-size: 36px;
          font-weight: 900;
          color: #ffffff;
          line-height: 1.25;
          letter-spacing: -1px;
          margin-bottom: 16px;
        }
        .auth-left-desc {
          font-size: 16px;
          color: #94a3b8;
          line-height: 1.7;
          margin-bottom: 36px;
        }
        .auth-features {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }
        .auth-feature {
          display: flex;
          align-items: center;
          gap: 12px;
          color: #cbd5e1;
          font-size: 15px;
          font-weight: 500;
        }
        .auth-feature span {
          font-size: 20px;
        }
        .auth-right {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 40px 24px;
          background: #ffffff;
        }
        .auth-form-wrapper {
          width: 100%;
          max-width: 400px;
        }
        .auth-form-title {
          font-size: 28px;
          font-weight: 800;
          color: #0f172a;
          margin-bottom: 8px;
          letter-spacing: -0.5px;
        }
        .auth-form-subtitle {
          font-size: 14px;
          color: #64748b;
          margin-bottom: 32px;
        }
        .auth-form-subtitle a {
          color: #2563eb;
          font-weight: 600;
        }
        .auth-form-subtitle a:hover {
          text-decoration: underline;
        }
        .password-field {
          position: relative;
        }
        .password-field input {
          width: 100%;
          padding-right: 48px;
        }
        .toggle-pass {
          position: absolute;
          right: 14px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          font-size: 18px;
          cursor: pointer;
          padding: 4px;
        }
        .auth-submit {
          width: 100%;
          padding: 16px !important;
          font-size: 16px !important;
          margin-top: 8px;
        }
        .btn-loading {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .btn-spinner {
          width: 18px;
          height: 18px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: #fff;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }
        .auth-divider {
          display: flex;
          align-items: center;
          margin: 28px 0;
          color: #94a3b8;
          font-size: 13px;
        }
        .auth-divider::before,
        .auth-divider::after {
          content: '';
          flex: 1;
          height: 1px;
          background: #e2e8f0;
        }
        .auth-divider span {
          padding: 0 16px;
        }
        .auth-roles {
          display: flex;
          gap: 12px;
        }
        .role-chip {
          flex: 1;
          text-align: center;
          padding: 12px;
          border: 2px solid #e2e8f0;
          border-radius: 10px;
          font-weight: 600;
          font-size: 14px;
          color: #475569;
          transition: all 0.2s;
        }
        .role-chip:hover {
          border-color: #2563eb;
          color: #2563eb;
          background: #eff6ff;
        }
        @media (max-width: 900px) {
          .auth-page { flex-direction: column; }
          .auth-left { padding: 40px 24px; }
          .auth-left-title { font-size: 28px; }
        }
      `}</style>
    </div>
  );
}
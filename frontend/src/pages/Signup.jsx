import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Signup() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    role: "student",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      const user = await register(form.name, form.email, form.phone, form.password, form.role);
      if (user.role === "driver") {
        setSuccess("Account created! Please wait for admin approval.");
        setTimeout(() => navigate("/driver"), 2000);
      } else {
        navigate("/student");
      }
    } catch (err) {
      setError(err.response?.data?.error || "Signup failed. Please try again.");
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
          <h1 className="auth-left-title">Join the campus commute revolution</h1>
          <p className="auth-left-desc">
            Whether you're a student looking for rides or a driver ready to serve — get started in under a minute.
          </p>
          <div className="auth-features">
            <div className="auth-feature">
              <span>⚡</span> Instant account setup
            </div>
            <div className="auth-feature">
              <span>🔒</span> Secure & private
            </div>
            <div className="auth-feature">
              <span>🎯</span> Role-based dashboards
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="auth-right">
        <div className="auth-form-wrapper">
          <h2 className="auth-form-title">Create your account</h2>
          <p className="auth-form-subtitle">
            Already have an account? <Link to="/login">Sign in</Link>
          </p>

          {error && <div className="msg-error">⚠️ {error}</div>}
          {success && <div className="msg-success">✅ {success}</div>}

          <form onSubmit={handleSubmit}>
            {/* Role Selector */}
            <div className="role-selector">
              <button
                type="button"
                className={`role-btn ${form.role === "student" ? "active" : ""}`}
                onClick={() => setForm({ ...form, role: "student" })}
              >
                <span className="role-emoji">🎓</span>
                <span>Student</span>
              </button>
              <button
                type="button"
                className={`role-btn ${form.role === "driver" ? "active" : ""}`}
                onClick={() => setForm({ ...form, role: "driver" })}
              >
                <span className="role-emoji">🚗</span>
                <span>Driver</span>
              </button>
            </div>

            <div className="form-group">
              <label>Full Name</label>
              <input name="name" placeholder="Rahul Kumar" value={form.name} onChange={handleChange} required />
            </div>

            <div className="form-group">
              <label>Email address</label>
              <input name="email" type="email" placeholder="you@college.edu" value={form.email} onChange={handleChange} required />
            </div>

            <div className="form-group">
              <label>Phone (10 digits)</label>
              <input name="phone" type="tel" placeholder="9876543210" value={form.phone} onChange={handleChange} required maxLength={10} />
            </div>

            <div className="form-group">
              <label>Password</label>
              <div className="password-field">
                <input
                  name="password"
                  type={showPass ? "text" : "password"}
                  placeholder="Min 8 chars, letter + number"
                  value={form.password}
                  onChange={handleChange}
                  required
                />
                <button type="button" className="toggle-pass" onClick={() => setShowPass(!showPass)}>
                  {showPass ? "🙈" : "👁️"}
                </button>
              </div>
            </div>

            <button type="submit" className="btn btn-primary auth-submit" disabled={loading}>
              {loading ? (
                <span className="btn-loading">
                  <span className="btn-spinner"></span> Creating account...
                </span>
              ) : (
                `Create ${form.role === "student" ? "Student" : "Driver"} Account →`
              )}
            </button>
          </form>
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
        .auth-feature span { font-size: 20px; }
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
          margin-bottom: 28px;
        }
        .auth-form-subtitle a {
          color: #2563eb;
          font-weight: 600;
        }
        .auth-form-subtitle a:hover { text-decoration: underline; }
        .role-selector {
          display: flex;
          gap: 12px;
          margin-bottom: 24px;
        }
        .role-btn {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
          padding: 16px 12px;
          border: 2px solid #e2e8f0;
          border-radius: 12px;
          background: #f8fafc;
          font-weight: 600;
          font-size: 14px;
          color: #64748b;
          transition: all 0.2s;
          cursor: pointer;
        }
        .role-btn:hover {
          border-color: #93c5fd;
          background: #eff6ff;
        }
        .role-btn.active {
          border-color: #2563eb;
          background: #eff6ff;
          color: #2563eb;
          box-shadow: 0 0 0 3px rgba(37,99,235,0.1);
        }
        .role-emoji { font-size: 24px; }
        .password-field { position: relative; }
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
        @media (max-width: 900px) {
          .auth-page { flex-direction: column; }
          .auth-left { padding: 40px 24px; }
          .auth-left-title { font-size: 28px; }
        }
      `}</style>
    </div>
  );
}
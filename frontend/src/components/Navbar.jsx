import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const dashboardLink = () => {
    if (!user) return null;
    if (user.role === "student") return <Link to="/student" className="nav-link">Dashboard</Link>;
    if (user.role === "driver") return <Link to="/driver" className="nav-link">Dashboard</Link>;
    if (user.role === "admin") return <Link to="/admin" className="nav-link">Admin Panel</Link>;
  };

  return (
    <nav className="navbar">
      <div className="nav-container">
        <Link to="/" className="nav-logo">
          <span className="logo-icon">🛺</span>
          <span className="logo-text">Auto<span className="logo-accent">Connect</span></span>
        </Link>

        <div className="nav-links">
          <Link to="/" className="nav-link">Routes</Link>
          {dashboardLink()}

          {user ? (
            <>
              <Link to="/profile" className="nav-user">
                <span className="user-avatar">{user.name.charAt(0).toUpperCase()}</span>
                <span className="user-name">{user.name.split(" ")[0]}</span>
              </Link>
              <button onClick={handleLogout} className="btn btn-outline nav-btn">
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="nav-link">Login</Link>
              <Link to="/signup" className="btn btn-primary nav-btn">Sign Up</Link>
            </>
          )}
        </div>
      </div>

      <style>{`
        .navbar {
          background: rgba(255, 255, 255, 0.9);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border-bottom: 1px solid rgba(226, 232, 240, 0.8);
          position: sticky;
          top: 0;
          z-index: 1000;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.03);
        }
        .nav-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 14px 24px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .nav-logo {
          display: flex;
          align-items: center;
          gap: 10px;
          transition: transform 0.2s;
        }
        .nav-logo:hover {
          transform: scale(1.02);
        }
        .logo-icon {
          font-size: 28px;
        }
        .logo-text {
          font-size: 22px;
          font-weight: 800;
          color: #0f172a;
          letter-spacing: -0.5px;
        }
        .logo-accent {
          background: linear-gradient(135deg, #2563eb, #7c3aed);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .nav-links {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .nav-link {
          font-weight: 600;
          color: #64748b;
          padding: 8px 16px;
          border-radius: 8px;
          transition: all 0.2s;
          font-size: 14.5px;
        }
        .nav-link:hover {
          color: #2563eb;
          background: #eff6ff;
        }
        .nav-user {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 6px 12px 6px 6px;
          border-radius: 50px;
          background: #f1f5f9;
          transition: all 0.2s;
          margin-right: 4px;
        }
        .nav-user:hover {
          background: #e2e8f0;
        }
        .user-avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: linear-gradient(135deg, #2563eb, #7c3aed);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 14px;
        }
        .user-name {
          font-weight: 600;
          font-size: 14px;
          color: #334155;
        }
        .nav-btn {
          padding: 8px 18px !important;
          font-size: 14px !important;
        }
        @media (max-width: 640px) {
          .user-name { display: none; }
          .nav-link { padding: 8px 10px; font-size: 13px; }
          .logo-text { font-size: 18px; }
        }
      `}</style>
    </nav>
  );
}
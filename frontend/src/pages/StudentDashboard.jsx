import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import API from "../services/api";
import RouteCard from "../components/RouteCard";
import { getGreeting } from "../utils/helpers";

export default function StudentDashboard() {
  const { user } = useAuth();
  const [routes, setRoutes] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => {
      API.get(`/routes?q=${search}`)
        .then((res) => setRoutes(res.data.routes))
        .catch(() => {})
        .finally(() => setLoading(false));
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  return (
    <div className="dash-page">
      {/* Welcome Banner */}
      <div className="dash-banner student-banner">
        <div className="banner-text">
          <p className="banner-greeting">{getGreeting()},</p>
          <h1 className="banner-name">{user?.name?.split(" ")[0]}! 🎓</h1>
          <p className="banner-desc">Find routes, check live autos, and plan your commute.</p>
        </div>
        <div className="banner-actions">
          <Link to="/profile" className="btn banner-btn-outline">My Profile</Link>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="quick-stats">
        <div className="qstat">
          <span className="qstat-icon">🗺️</span>
          <div>
            <span className="qstat-num">{routes.length}</span>
            <span className="qstat-label">Routes Available</span>
          </div>
        </div>
        <div className="qstat">
          <span className="qstat-icon">🔍</span>
          <div>
            <span className="qstat-num">Live</span>
            <span className="qstat-label">Search & Track</span>
          </div>
        </div>
        <div className="qstat">
          <span className="qstat-icon">📍</span>
          <div>
            <span className="qstat-num">GPS</span>
            <span className="qstat-label">Real-time Location</span>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="dash-search">
        <span className="dash-search-icon">🔍</span>
        <input
          type="text"
          placeholder="Search routes by name, location, or ID..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {search && (
          <button className="clear-btn" onClick={() => setSearch("")}>✕</button>
        )}
      </div>

      {/* Routes */}
      <div className="dash-section-header">
        <h2>{search ? `Results for "${search}"` : "All Routes"}</h2>
        <span className="result-count">
          {loading ? "..." : `${routes.length} found`}
        </span>
      </div>

      {loading ? (
        <div className="loading-text">
          <div className="mini-spinner"></div>
          Loading routes...
        </div>
      ) : routes.length === 0 ? (
        <div className="empty-dash">
          <div className="empty-icon">🔍</div>
          <h3>No routes found</h3>
          <p>Try a different search term.</p>
        </div>
      ) : (
        <div className="grid">
          {routes.map((r) => (
            <RouteCard key={r.route_id} route={r} />
          ))}
        </div>
      )}

      <style>{`
        .dash-banner {
          border-radius: 20px;
          padding: 36px 40px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 28px;
          position: relative;
          overflow: hidden;
        }
        .student-banner {
          background: linear-gradient(135deg, #1e40af 0%, #3b82f6 50%, #6366f1 100%);
          color: #fff;
        }
        .dash-banner::after {
          content: '';
          position: absolute;
          width: 300px;
          height: 300px;
          background: radial-gradient(circle, rgba(255,255,255,0.08), transparent 70%);
          top: -100px;
          right: -50px;
        }
        .banner-greeting {
          font-size: 15px;
          opacity: 0.8;
          font-weight: 500;
          margin-bottom: 4px;
        }
        .banner-name {
          font-size: 32px;
          font-weight: 900;
          letter-spacing: -0.5px;
          margin-bottom: 8px;
        }
        .banner-desc {
          font-size: 15px;
          opacity: 0.75;
        }
        .banner-btn-outline {
          background: rgba(255,255,255,0.15) !important;
          color: #fff !important;
          border: 1.5px solid rgba(255,255,255,0.3) !important;
          backdrop-filter: blur(10px);
          position: relative;
          z-index: 1;
        }
        .banner-btn-outline:hover {
          background: rgba(255,255,255,0.25) !important;
        }
        .quick-stats {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
          margin-bottom: 28px;
        }
        .qstat {
          background: #fff;
          border-radius: 14px;
          padding: 20px;
          display: flex;
          align-items: center;
          gap: 16px;
          border: 1px solid #f1f5f9;
          box-shadow: 0 2px 4px rgba(0,0,0,0.03);
        }
        .qstat-icon { font-size: 28px; }
        .qstat-num {
          display: block;
          font-size: 22px;
          font-weight: 800;
          color: #0f172a;
        }
        .qstat-label {
          font-size: 12px;
          color: #94a3b8;
          font-weight: 500;
        }
        .dash-search {
          display: flex;
          align-items: center;
          background: #fff;
          border: 2px solid #e2e8f0;
          border-radius: 14px;
          padding: 4px 4px 4px 18px;
          margin-bottom: 28px;
          transition: border-color 0.2s;
        }
        .dash-search:focus-within {
          border-color: #2563eb;
          box-shadow: 0 0 0 4px rgba(37,99,235,0.1);
        }
        .dash-search-icon { font-size: 18px; margin-right: 10px; }
        .dash-search input {
          flex: 1;
          border: none;
          outline: none;
          font-size: 15px;
          padding: 14px 0;
          background: transparent;
        }
        .clear-btn {
          background: #f1f5f9;
          border: none;
          width: 36px;
          height: 36px;
          border-radius: 10px;
          font-size: 14px;
          color: #64748b;
          cursor: pointer;
          margin-right: 4px;
        }
        .clear-btn:hover { background: #e2e8f0; }
        .dash-section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }
        .dash-section-header h2 {
          font-size: 20px;
          font-weight: 800;
          color: #0f172a;
        }
        .result-count {
          font-size: 13px;
          color: #94a3b8;
          font-weight: 600;
          background: #f1f5f9;
          padding: 4px 12px;
          border-radius: 20px;
        }
        .empty-dash {
          text-align: center;
          padding: 60px 20px;
          background: #fff;
          border-radius: 16px;
          border: 2px dashed #e2e8f0;
        }
        .empty-dash .empty-icon { font-size: 48px; margin-bottom: 12px; }
        .empty-dash h3 { font-size: 18px; color: #334155; margin-bottom: 4px; }
        .empty-dash p { color: #94a3b8; font-size: 14px; }
        .mini-spinner {
          width: 24px; height: 24px;
          border: 3px solid #e2e8f0;
          border-top-color: #2563eb;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
          margin: 0 auto 12px;
        }
        @media (max-width: 640px) {
          .dash-banner { flex-direction: column; gap: 20px; text-align: center; }
          .quick-stats { grid-template-columns: 1fr; }
          .banner-name { font-size: 26px; }
        }
      `}</style>
    </div>
  );
}
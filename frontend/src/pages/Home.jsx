import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import API from "../services/api";
import RouteCard from "../components/RouteCard";

export default function Home() {
  const { user } = useAuth();
  const [routes, setRoutes] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => {
      API.get(`/routes?q=${search}`)
        .then((res) => setRoutes(res.data.routes))
        .catch(() => setRoutes([]))
        .finally(() => setLoading(false));
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  return (
    <div className="home-page">
      {/* HERO SECTION */}
      <section className="hero">
        <div className="hero-content">
          <div className="hero-badge">🎓 Campus Commute Made Easy</div>
          <h1 className="hero-title">
            Find Your Perfect<br />
            <span className="hero-gradient">Auto Route</span>
          </h1>
          <p className="hero-subtitle">
            Search routes, check live auto availability, and plan your daily
            commute with real-time seat & location updates.
          </p>

          <div className="hero-search">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="Search by route name, location, or ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {!user && (
            <div className="hero-actions">
              <Link to="/signup" className="btn btn-primary hero-btn">
                Get Started Free →
              </Link>
              <Link to="/login" className="btn btn-outline hero-btn">
                Login
              </Link>
            </div>
          )}
        </div>

        <div className="hero-stats">
          <div className="stat-item">
            <span className="stat-num">{routes.length || "—"}</span>
            <span className="stat-label">Active Routes</span>
          </div>
          <div className="stat-divider"></div>
          <div className="stat-item">
            <span className="stat-num">Live</span>
            <span className="stat-label">GPS Tracking</span>
          </div>
          <div className="stat-divider"></div>
          <div className="stat-item">
            <span className="stat-num">24/7</span>
            <span className="stat-label">Availability</span>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="features">
        <div className="feature-card">
          <div className="feature-icon">🗺️</div>
          <h3>Browse Routes</h3>
          <p>Explore all verified auto routes with stops, fares & travel time.</p>
        </div>
        <div className="feature-card">
          <div className="feature-icon">📍</div>
          <h3>Live Tracking</h3>
          <p>See real-time driver location and available seats instantly.</p>
        </div>
        <div className="feature-card">
          <div className="feature-icon">🚗</div>
          <h3>Driver Portal</h3>
          <p>Drivers can manage autos, seats, status & share GPS location.</p>
        </div>
      </section>

      {/* ROUTES GRID */}
      <section className="routes-section">
        <div className="section-header">
          <h2 className="section-title">
            {search ? `Results for "${search}"` : "Available Routes"}
          </h2>
          <p className="section-count">
            {loading ? "Searching..." : `${routes.length} route${routes.length !== 1 ? "s" : ""} found`}
          </p>
        </div>

        {loading ? (
          <div className="loading-text">
            <div className="mini-spinner"></div>
            Loading routes...
          </div>
        ) : routes.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🔍</div>
            <h3>No routes found</h3>
            <p>Try a different search term or browse all routes.</p>
            {search && (
              <button className="btn btn-outline" onClick={() => setSearch("")} style={{ marginTop: 16 }}>
                Clear Search
              </button>
            )}
          </div>
        ) : (
          <div className="grid">
            {routes.map((route) => (
              <RouteCard key={route.route_id} route={route} />
            ))}
          </div>
        )}
      </section>

      <style>{`
        .home-page {
          margin: -40px -20px 0;
        }

        /* HERO */
        .hero {
          background: linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #1e293b 100%);
          padding: 80px 24px 0;
          position: relative;
          overflow: hidden;
        }
        .hero::before {
          content: '';
          position: absolute;
          top: -50%;
          right: -20%;
          width: 600px;
          height: 600px;
          background: radial-gradient(circle, rgba(37,99,235,0.15) 0%, transparent 70%);
          pointer-events: none;
        }
        .hero-content {
          max-width: 700px;
          margin: 0 auto;
          text-align: center;
          position: relative;
          z-index: 1;
        }
        .hero-badge {
          display: inline-block;
          background: rgba(37, 99, 235, 0.2);
          color: #93c5fd;
          font-size: 13px;
          font-weight: 600;
          padding: 6px 16px;
          border-radius: 50px;
          border: 1px solid rgba(37, 99, 235, 0.3);
          margin-bottom: 24px;
        }
        .hero-title {
          font-size: 48px;
          font-weight: 900;
          color: #ffffff;
          line-height: 1.15;
          letter-spacing: -1.5px;
          margin-bottom: 16px;
        }
        .hero-gradient {
          background: linear-gradient(135deg, #60a5fa, #a78bfa, #f472b6);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .hero-subtitle {
          font-size: 17px;
          color: #94a3b8;
          line-height: 1.7;
          margin-bottom: 32px;
          max-width: 520px;
          margin-left: auto;
          margin-right: auto;
        }
        .hero-search {
          display: flex;
          align-items: center;
          background: #ffffff;
          border-radius: 14px;
          padding: 6px 6px 6px 20px;
          box-shadow: 0 8px 32px rgba(0,0,0,0.2);
          max-width: 560px;
          margin: 0 auto 28px;
        }
        .search-icon {
          font-size: 18px;
          margin-right: 10px;
        }
        .hero-search input {
          flex: 1;
          border: none;
          outline: none;
          font-size: 16px;
          padding: 14px 0;
          background: transparent;
          color: #0f172a;
        }
        .hero-search input::placeholder {
          color: #94a3b8;
        }
        .hero-actions {
          display: flex;
          gap: 12px;
          justify-content: center;
          margin-bottom: 48px;
        }
        .hero-btn {
          padding: 14px 28px !important;
          font-size: 15px !important;
        }
        .hero-stats {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 0;
          background: rgba(255,255,255,0.05);
          backdrop-filter: blur(10px);
          border-top: 1px solid rgba(255,255,255,0.08);
          padding: 28px 24px;
          max-width: 600px;
          margin: 0 auto;
          border-radius: 16px 16px 0 0;
        }
        .stat-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 0 32px;
        }
        .stat-num {
          font-size: 24px;
          font-weight: 800;
          color: #ffffff;
        }
        .stat-label {
          font-size: 12px;
          color: #64748b;
          font-weight: 500;
          margin-top: 2px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .stat-divider {
          width: 1px;
          height: 36px;
          background: rgba(255,255,255,0.1);
        }

        /* FEATURES */
        .features {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 24px;
          max-width: 1200px;
          margin: 0 auto;
          padding: 48px 24px;
        }
        .feature-card {
          background: #ffffff;
          border-radius: 16px;
          padding: 32px 28px;
          border: 1px solid #f1f5f9;
          text-align: center;
          transition: all 0.3s ease;
        }
        .feature-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 24px rgba(0,0,0,0.06);
          border-color: #dbeafe;
        }
        .feature-icon {
          font-size: 36px;
          margin-bottom: 16px;
        }
        .feature-card h3 {
          font-size: 17px;
          font-weight: 700;
          color: #0f172a;
          margin-bottom: 8px;
        }
        .feature-card p {
          font-size: 14px;
          color: #64748b;
          line-height: 1.6;
        }

        /* ROUTES SECTION */
        .routes-section {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 24px 60px;
        }
        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          margin-bottom: 28px;
        }
        .section-title {
          font-size: 24px;
          font-weight: 800;
          color: #0f172a;
        }
        .section-count {
          font-size: 14px;
          color: #94a3b8;
          font-weight: 500;
        }
        .empty-state {
          text-align: center;
          padding: 60px 20px;
          background: #ffffff;
          border-radius: 16px;
          border: 2px dashed #e2e8f0;
        }
        .empty-icon {
          font-size: 48px;
          margin-bottom: 12px;
        }
        .empty-state h3 {
          font-size: 18px;
          color: #334155;
          margin-bottom: 6px;
        }
        .empty-state p {
          color: #94a3b8;
          font-size: 14px;
        }
        .mini-spinner {
          width: 24px;
          height: 24px;
          border: 3px solid #e2e8f0;
          border-top-color: #2563eb;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
          margin: 0 auto 12px;
        }

        @media (max-width: 768px) {
          .hero-title { font-size: 32px; }
          .features { grid-template-columns: 1fr; padding: 32px 16px; }
          .hero-stats { flex-direction: column; gap: 16px; }
          .stat-divider { width: 40px; height: 1px; }
          .stat-item { padding: 0; }
          .section-header { flex-direction: column; gap: 4px; }
        }
      `}</style>
    </div>
  );
}
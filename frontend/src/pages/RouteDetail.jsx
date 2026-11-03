import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import API from "../services/api";
import AutoCard from "../components/AutoCard";

export default function RouteDetail() {
  const { routeId } = useParams();
  const [route, setRoute] = useState(null);
  const [autos, setAutos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    Promise.all([
      API.get(`/routes/${routeId}`),
      API.get(`/routes/${routeId}/autos`),
    ])
      .then(([routeRes, autoRes]) => {
        setRoute(routeRes.data.route);
        setAutos(autoRes.data.autos);
      })
      .catch(() => setError("Route not found."))
      .finally(() => setLoading(false));
  }, [routeId]);

  if (loading) {
    return (
      <div className="loading-text">
        <div className="mini-spinner"></div>
        Loading route details...
      </div>
    );
  }

  if (error || !route) {
    return (
      <div className="empty-state-page">
        <div className="empty-icon">😕</div>
        <h2>Route Not Found</h2>
        <p>{error || "This route doesn't exist."}</p>
        <Link to="/" className="btn btn-primary" style={{ marginTop: 16 }}>
          ← Back to Routes
        </Link>
      </div>
    );
  }

  const statusClass =
    route.route_status === "Confirmed"
      ? "badge-green"
      : route.route_status === "Historical reference"
      ? "badge-red"
      : "badge-yellow";

  const availableAutos = autos.filter((a) => a.availability === "available");

  return (
    <div className="route-detail-page">
      <Link to="/" className="back-link">← Back to Routes</Link>

      {/* HERO HEADER */}
      <div className="detail-hero">
        <div className="detail-hero-top">
          <span className="detail-route-id">{route.route_id}</span>
          <span className={`badge ${statusClass}`}>{route.route_status}</span>
        </div>
        <h1 className="detail-title">{route.route_name}</h1>

        <div className="detail-path">
          <div className="detail-path-point">
            <div className="detail-dot start"></div>
            <div>
              <span className="path-label">From</span>
              <span className="path-value">{route.start_location}</span>
            </div>
          </div>
          <div className="detail-path-arrow">→</div>
          <div className="detail-path-point">
            <div className="detail-dot end"></div>
            <div>
              <span className="path-label">To</span>
              <span className="path-value">{route.end_location}</span>
            </div>
          </div>
        </div>

        <div className="detail-meta-row">
          <div className="detail-meta-chip">🚌 {route.transport_type}</div>
          {route.fare && <div className="detail-meta-chip fare">💰 ₹{route.fare}</div>}
          {route.distance_km && <div className="detail-meta-chip">📏 {route.distance_km} km</div>}
          {route.travel_time && <div className="detail-meta-chip">⏱ {route.travel_time}</div>}
          <div className="detail-meta-chip">🛑 {route.stops?.length || 0} stops</div>
        </div>
      </div>

      <div className="detail-grid">
        {/* STOPS */}
        <div className="detail-section">
          <h2 className="detail-section-title">
            🛑 Stops
            <span className="count-badge">{route.stops?.length || 0}</span>
          </h2>
          {route.stops && route.stops.length > 0 ? (
            <div className="stops-timeline">
              {route.stops.map((stop, i) => (
                <div key={i} className="timeline-item">
                  <div className="timeline-marker">
                    <div className={`timeline-dot ${i === 0 ? "first" : i === route.stops.length - 1 ? "last" : ""}`}>
                      {stop.stop_order}
                    </div>
                    {i < route.stops.length - 1 && <div className="timeline-line"></div>}
                  </div>
                  <div className="timeline-content">
                    <span className="stop-name">{stop.stop_name}</span>
                    {stop.is_verified && <span className="badge badge-green" style={{ fontSize: 10 }}>Verified</span>}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="no-data">No stops listed for this route.</p>
          )}
        </div>

        {/* AUTOS */}
        <div className="detail-section">
          <h2 className="detail-section-title">
            🛺 Autos
            <span className="count-badge">{autos.length}</span>
            {availableAutos.length > 0 && (
              <span className="available-tag">{availableAutos.length} available</span>
            )}
          </h2>
          {autos.length === 0 ? (
            <div className="no-autos">
              <div className="no-autos-icon">🚗</div>
              <p>No autos on this route right now.</p>
              <span>Check back later or try another route.</span>
            </div>
          ) : (
            <div className="autos-list">
              {autos.map((auto) => (
                <AutoCard key={auto.auto_number} auto={auto} />
              ))}
            </div>
          )}
        </div>
      </div>

      <style>{`
        .back-link {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          color: #2563eb;
          font-weight: 600;
          font-size: 14px;
          margin-bottom: 20px;
          transition: gap 0.2s;
        }
        .back-link:hover { gap: 10px; }

        .detail-hero {
          background: linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%);
          border-radius: 20px;
          padding: 36px;
          margin-bottom: 32px;
          color: #fff;
        }
        .detail-hero-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }
        .detail-route-id {
          background: rgba(255,255,255,0.1);
          padding: 4px 12px;
          border-radius: 6px;
          font-size: 13px;
          font-weight: 700;
          letter-spacing: 0.5px;
        }
        .detail-title {
          font-size: 32px;
          font-weight: 900;
          letter-spacing: -0.5px;
          margin-bottom: 24px;
        }
        .detail-path {
          display: flex;
          align-items: center;
          gap: 20px;
          background: rgba(255,255,255,0.06);
          border-radius: 14px;
          padding: 20px 24px;
          margin-bottom: 24px;
        }
        .detail-path-point {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .detail-dot {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          flex-shrink: 0;
        }
        .detail-dot.start {
          background: #10b981;
          box-shadow: 0 0 0 4px rgba(16,185,129,0.25);
        }
        .detail-dot.end {
          background: #f43f5e;
          box-shadow: 0 0 0 4px rgba(244,63,94,0.25);
        }
        .path-label {
          display: block;
          font-size: 11px;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          font-weight: 600;
        }
        .path-value {
          font-size: 16px;
          font-weight: 600;
          color: #e2e8f0;
        }
        .detail-path-arrow {
          font-size: 24px;
          color: #475569;
        }
        .detail-meta-row {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
        }
        .detail-meta-chip {
          background: rgba(255,255,255,0.08);
          padding: 6px 14px;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 500;
          color: #cbd5e1;
        }
        .detail-meta-chip.fare {
          background: rgba(16,185,129,0.15);
          color: #6ee7b7;
          font-weight: 700;
        }

        .detail-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 28px;
        }
        .detail-section {
          background: #fff;
          border-radius: 16px;
          padding: 28px;
          border: 1px solid #f1f5f9;
          box-shadow: 0 4px 6px rgba(0,0,0,0.03);
        }
        .detail-section-title {
          font-size: 18px;
          font-weight: 800;
          color: #0f172a;
          margin-bottom: 24px;
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .count-badge {
          background: #f1f5f9;
          color: #475569;
          font-size: 13px;
          font-weight: 700;
          padding: 2px 10px;
          border-radius: 20px;
        }
        .available-tag {
          background: #dcfce7;
          color: #15803d;
          font-size: 12px;
          font-weight: 700;
          padding: 2px 10px;
          border-radius: 20px;
          margin-left: auto;
        }

        /* Timeline */
        .stops-timeline {
          display: flex;
          flex-direction: column;
        }
        .timeline-item {
          display: flex;
          gap: 16px;
        }
        .timeline-marker {
          display: flex;
          flex-direction: column;
          align-items: center;
          width: 32px;
        }
        .timeline-dot {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: #e2e8f0;
          color: #475569;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: 800;
          flex-shrink: 0;
        }
        .timeline-dot.first {
          background: #10b981;
          color: #fff;
        }
        .timeline-dot.last {
          background: #ef4444;
          color: #fff;
        }
        .timeline-line {
          width: 2px;
          flex: 1;
          min-height: 24px;
          background: #e2e8f0;
        }
        .timeline-content {
          display: flex;
          align-items: center;
          gap: 10px;
          padding-bottom: 24px;
          flex: 1;
        }
        .stop-name {
          font-size: 15px;
          font-weight: 600;
          color: #334155;
        }

        .autos-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .no-autos {
          text-align: center;
          padding: 40px 20px;
        }
        .no-autos-icon { font-size: 40px; margin-bottom: 12px; }
        .no-autos p {
          font-size: 16px;
          font-weight: 600;
          color: #334155;
          margin-bottom: 4px;
        }
        .no-autos span { font-size: 13px; color: #94a3b8; }
        .no-data { color: #94a3b8; font-size: 14px; }

        .empty-state-page {
          text-align: center;
          padding: 80px 20px;
        }
        .empty-state-page .empty-icon { font-size: 64px; margin-bottom: 16px; }
        .empty-state-page h2 { font-size: 24px; color: #0f172a; margin-bottom: 8px; }
        .empty-state-page p { color: #64748b; }

        .mini-spinner {
          width: 28px;
          height: 28px;
          border: 3px solid #e2e8f0;
          border-top-color: #2563eb;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
          margin: 0 auto 12px;
        }

        @media (max-width: 768px) {
          .detail-grid { grid-template-columns: 1fr; }
          .detail-title { font-size: 24px; }
          .detail-path { flex-direction: column; gap: 12px; }
          .detail-path-arrow { transform: rotate(90deg); }
        }
      `}</style>
    </div>
  );
}
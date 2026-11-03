import { Link } from "react-router-dom";

export default function RouteCard({ route }) {
  const statusClass =
    route.route_status === "Confirmed"
      ? "badge-green"
      : route.route_status === "Historical reference"
      ? "badge-red"
      : "badge-yellow";

  return (
    <Link to={`/route/${route.route_id}`} className="route-card">
      <div className="route-card-top">
        <div className="route-id-badge">{route.route_id}</div>
        <span className={`badge ${statusClass}`}>{route.route_status}</span>
      </div>

      <h3 className="route-name">{route.route_name}</h3>

      <div className="route-path">
        <div className="path-point">
          <div className="path-dot start"></div>
          <span>{route.start_location}</span>
        </div>
        <div className="path-line"></div>
        <div className="path-point">
          <div className="path-dot end"></div>
          <span>{route.end_location}</span>
        </div>
      </div>

      <div className="route-meta">
        <div className="meta-item">
          <span className="meta-icon">🚌</span>
          <span>{route.transport_type || "Shared Auto"}</span>
        </div>
        <div className="meta-item">
          <span className="meta-icon">🛑</span>
          <span>{route.stops?.length || 0} stops</span>
        </div>
        {route.fare && (
          <div className="meta-item fare">
            <span className="meta-icon">💰</span>
            <span>₹{route.fare}</span>
          </div>
        )}
        {route.travel_time && (
          <div className="meta-item">
            <span className="meta-icon">⏱</span>
            <span>{route.travel_time}</span>
          </div>
        )}
      </div>

      <div className="route-card-footer">
        <span className="view-link">View Details →</span>
      </div>

      <style>{`
        .route-card {
          display: flex;
          flex-direction: column;
          background: #ffffff;
          border-radius: 16px;
          padding: 24px;
          border: 1px solid #f1f5f9;
          box-shadow: 0 4px 6px -1px rgba(0,0,0,0.04);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          overflow: hidden;
        }
        .route-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 3px;
          background: linear-gradient(90deg, #2563eb, #7c3aed);
          opacity: 0;
          transition: opacity 0.3s;
        }
        .route-card:hover {
          transform: translateY(-6px);
          box-shadow: 0 20px 40px -8px rgba(37, 99, 235, 0.15);
          border-color: #dbeafe;
        }
        .route-card:hover::before {
          opacity: 1;
        }
        .route-card-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 14px;
        }
        .route-id-badge {
          background: #f1f5f9;
          color: #475569;
          font-size: 12px;
          font-weight: 700;
          padding: 4px 10px;
          border-radius: 6px;
          letter-spacing: 0.5px;
        }
        .route-name {
          font-size: 18px;
          font-weight: 700;
          color: #0f172a;
          margin-bottom: 18px;
          line-height: 1.3;
        }
        .route-path {
          background: #f8fafc;
          border-radius: 12px;
          padding: 14px 16px;
          margin-bottom: 18px;
        }
        .path-point {
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 14px;
          font-weight: 500;
          color: #334155;
        }
        .path-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          flex-shrink: 0;
        }
        .path-dot.start {
          background: #10b981;
          box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.2);
        }
        .path-dot.end {
          background: #ef4444;
          box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.2);
        }
        .path-line {
          width: 2px;
          height: 16px;
          background: repeating-linear-gradient(
            to bottom,
            #cbd5e1 0,
            #cbd5e1 4px,
            transparent 4px,
            transparent 8px
          );
          margin-left: 4px;
        }
        .route-meta {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          margin-bottom: 16px;
        }
        .meta-item {
          display: flex;
          align-items: center;
          gap: 5px;
          font-size: 13px;
          color: #64748b;
          font-weight: 500;
        }
        .meta-item.fare {
          color: #059669;
          font-weight: 700;
        }
        .meta-icon {
          font-size: 14px;
        }
        .route-card-footer {
          border-top: 1px solid #f1f5f9;
          padding-top: 14px;
          margin-top: auto;
        }
        .view-link {
          font-size: 14px;
          font-weight: 600;
          color: #2563eb;
          transition: gap 0.2s;
        }
        .route-card:hover .view-link {
          color: #1d4ed8;
        }
      `}</style>
    </Link>
  );
}
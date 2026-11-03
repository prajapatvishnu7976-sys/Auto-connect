export default function AutoCard({ auto }) {
  const isAvailable = auto.availability === "available";
  const hasLocation = auto.location !== null && auto.location !== undefined;

  return (
    <div className="auto-card">
      <div className="auto-card-top">
        <div className="auto-number">
          <span className="auto-icon">🛺</span>
          <span>{auto.auto_number}</span>
        </div>
        <span className={`badge ${isAvailable ? "badge-green" : "badge-red"}`}>
          {isAvailable ? "● Available" : "● Offline"}
        </span>
      </div>

      <div className="auto-info">
        <div className="info-row">
          <span className="info-label">Driver</span>
          <span className="info-value">{auto.driver_name}</span>
        </div>
        {auto.driver_phone && (
          <div className="info-row">
            <span className="info-label">Phone</span>
            <span className="info-value phone">{auto.driver_phone}</span>
          </div>
        )}
        <div className="info-row">
          <span className="info-label">Seats</span>
          <span className="info-value">
            <span className={`seats-left ${auto.available_seats > 0 ? "has-seats" : "no-seats"}`}>
              {auto.available_seats}
            </span>
            <span className="seats-total"> / {auto.total_seats}</span>
          </span>
        </div>
      </div>

      {hasLocation && (
        <div className="live-location">
          <span className="live-dot"></span>
          <span className="live-text">Live Location</span>
          <span className="live-time">
            {new Date(auto.location.updated_at).toLocaleTimeString()}
          </span>
        </div>
      )}

      {!hasLocation && isAvailable && (
        <div className="no-location">
          <span>📍 Location not shared</span>
        </div>
      )}

      <style>{`
        .auto-card {
          background: #ffffff;
          border-radius: 16px;
          padding: 22px;
          border: 1px solid #f1f5f9;
          box-shadow: 0 4px 6px -1px rgba(0,0,0,0.04);
          transition: all 0.3s ease;
        }
        .auto-card:hover {
          box-shadow: 0 12px 24px -4px rgba(0,0,0,0.08);
          transform: translateY(-3px);
        }
        .auto-card-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 18px;
        }
        .auto-number {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 17px;
          font-weight: 800;
          color: #0f172a;
        }
        .auto-icon {
          font-size: 22px;
        }
        .auto-info {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .info-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .info-label {
          font-size: 13px;
          color: #94a3b8;
          font-weight: 500;
        }
        .info-value {
          font-size: 14px;
          font-weight: 600;
          color: #334155;
        }
        .info-value.phone {
          color: #2563eb;
          font-family: 'Inter', monospace;
        }
        .seats-left {
          font-size: 18px;
          font-weight: 800;
        }
        .seats-left.has-seats { color: #059669; }
        .seats-left.no-seats { color: #dc2626; }
        .seats-total {
          font-size: 14px;
          color: #94a3b8;
          font-weight: 500;
        }
        .live-location {
          margin-top: 16px;
          padding: 10px 14px;
          background: linear-gradient(135deg, #ecfdf5, #d1fae5);
          border-radius: 10px;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .live-dot {
          width: 8px;
          height: 8px;
          background: #10b981;
          border-radius: 50%;
          animation: pulse 1.5s ease-in-out infinite;
          box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.3);
        }
        .live-text {
          font-size: 13px;
          font-weight: 700;
          color: #059669;
        }
        .live-time {
          margin-left: auto;
          font-size: 12px;
          color: #6ee7b7;
          font-weight: 500;
        }
        .no-location {
          margin-top: 16px;
          padding: 10px 14px;
          background: #f8fafc;
          border-radius: 10px;
          font-size: 13px;
          color: #94a3b8;
          text-align: center;
        }
      `}</style>
    </div>
  );
}
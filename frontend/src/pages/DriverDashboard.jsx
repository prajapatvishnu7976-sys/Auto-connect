import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import API from "../services/api";
import useGeolocation from "../hooks/useGeolocation";
import { getGreeting } from "../utils/helpers";

export default function DriverDashboard() {
  const { user } = useAuth();
  const { location, error: geoError, getLocation } = useGeolocation();

  const [auto, setAuto] = useState(null);
  const [isApproved, setIsApproved] = useState(true);
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [saving, setSaving] = useState(false);

  const [autoNumber, setAutoNumber] = useState("");
  const [totalSeats, setTotalSeats] = useState(4);
  const [routeId, setRouteId] = useState("");
  const [seatsInput, setSeatsInput] = useState(0);

  const showMsg = (text, isError = false) => {
    if (isError) { setErr(text); setMsg(""); }
    else { setMsg(text); setErr(""); }
    setTimeout(() => { setMsg(""); setErr(""); }, 3500);
  };

  const fetchAuto = () => {
    API.get("/driver/auto")
      .then((res) => {
        setAuto(res.data.auto);
        setIsApproved(res.data.is_approved);
        if (res.data.auto) {
          setAutoNumber(res.data.auto.auto_number);
          setTotalSeats(res.data.auto.total_seats);
          setRouteId(res.data.auto.route_id || "");
          setSeatsInput(res.data.auto.available_seats);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchAuto();
    API.get("/routes").then((res) => setRoutes(res.data.routes)).catch(() => {});
  }, []);

  // When location is fetched, auto-send it
  useEffect(() => {
    if (location) {
      API.put("/driver/location", location)
        .then((res) => {
          setAuto(res.data.auto);
          showMsg("📍 Location shared successfully!");
        })
        .catch((e) => showMsg(e.response?.data?.error || "Failed to share location.", true));
    }
  }, [location]);

  const saveAuto = async () => {
    setSaving(true);
    try {
      const res = await API.put("/driver/auto", {
        auto_number: autoNumber,
        total_seats: Number(totalSeats),
        route_id: routeId || null,
      });
      setAuto(res.data.auto);
      setSeatsInput(res.data.auto.available_seats);
      showMsg("✅ Auto details saved!");
    } catch (e) {
      showMsg(e.response?.data?.error || "Failed to save.", true);
    } finally {
      setSaving(false);
    }
  };

  const updateSeats = async () => {
    try {
      const res = await API.put("/driver/seats", { available_seats: Number(seatsInput) });
      setAuto(res.data.auto);
      showMsg("✅ Seats updated!");
    } catch (e) {
      showMsg(e.response?.data?.error || "Failed.", true);
    }
  };

  const toggleStatus = async () => {
    const newStatus = auto?.availability === "available" ? "not_available" : "available";
    try {
      const res = await API.put("/driver/status", { availability: newStatus });
      setAuto(res.data.auto);
      showMsg(newStatus === "available" ? "🟢 You're now Online!" : "🔴 You're now Offline.");
    } catch (e) {
      showMsg(e.response?.data?.error || "Failed.", true);
    }
  };

  const stopLocation = async () => {
    try {
      const res = await API.delete("/driver/location");
      setAuto(res.data.auto);
      showMsg("Location sharing stopped.");
    } catch {
      showMsg("Failed.", true);
    }
  };

  if (loading) {
    return (
      <div className="loading-text">
        <div className="mini-spinner"></div>
        Loading dashboard...
      </div>
    );
  }

  if (!isApproved) {
    return (
      <div className="pending-page">
        <div className="pending-card">
          <div className="pending-icon">⏳</div>
          <h2>Waiting for Approval</h2>
          <p>Your driver account has been created successfully. An admin will review and approve it soon.</p>
          <div className="pending-info">
            <span>📧 {user?.email}</span>
            <span>👤 {user?.name}</span>
          </div>
        </div>
        <style>{`
          .pending-page { display: flex; justify-content: center; padding: 60px 20px; }
          .pending-card {
            max-width: 480px; text-align: center; background: #fff;
            border-radius: 20px; padding: 48px 36px;
            box-shadow: 0 8px 30px rgba(0,0,0,0.06); border: 1px solid #f1f5f9;
          }
          .pending-icon { font-size: 64px; margin-bottom: 20px; }
          .pending-card h2 { font-size: 24px; font-weight: 800; color: #0f172a; margin-bottom: 12px; }
          .pending-card p { color: #64748b; font-size: 15px; line-height: 1.6; margin-bottom: 24px; }
          .pending-info {
            display: flex; flex-direction: column; gap: 8px;
            background: #f8fafc; border-radius: 12px; padding: 16px; font-size: 14px; color: #475569;
          }
        `}</style>
      </div>
    );
  }

  const isOnline = auto?.availability === "available";

  return (
    <div className="dash-page">
      {/* Banner */}
      <div className="dash-banner driver-banner">
        <div className="banner-text">
          <p className="banner-greeting">{getGreeting()},</p>
          <h1 className="banner-name">{user?.name?.split(" ")[0]}! 🚗</h1>
          <p className="banner-desc">Manage your auto, seats, status & location.</p>
        </div>
        {auto && (
          <div className={`status-indicator ${isOnline ? "online" : "offline"}`}>
            <span className="status-dot"></span>
            {isOnline ? "Online" : "Offline"}
          </div>
        )}
      </div>

      {msg && <div className="msg-success">{msg}</div>}
      {err && <div className="msg-error">{err}</div>}

      {/* Auto Details Form */}
      <div className="card dash-card">
        <h3 className="card-title">🛺 Auto Details</h3>
        <div className="form-row">
          <div className="form-group">
            <label>Auto Number</label>
            <input value={autoNumber} onChange={(e) => setAutoNumber(e.target.value)} placeholder="UP32 AB 1234" />
          </div>
          <div className="form-group">
            <label>Total Seats</label>
            <input type="number" min="1" max="20" value={totalSeats} onChange={(e) => setTotalSeats(e.target.value)} />
          </div>
          <div className="form-group">
            <label>Assigned Route</label>
            <select value={routeId} onChange={(e) => setRouteId(e.target.value)}>
              <option value="">— No Route —</option>
              {routes.filter(r => r.route_status !== "Historical reference").map((r) => (
                <option key={r.route_id} value={r.route_id}>{r.route_name}</option>
              ))}
            </select>
          </div>
        </div>
        <button className="btn btn-primary" onClick={saveAuto} disabled={saving}>
          {saving ? "Saving..." : "💾 Save Auto Details"}
        </button>
      </div>

      {/* Controls (only if auto exists) */}
      {auto && (
        <div className="controls-grid">
          {/* Status Toggle */}
          <div className="card dash-card">
            <h3 className="card-title">⚡ Availability</h3>
            <p className="card-desc">Toggle your online status so students can find you.</p>
            <button
              className={`btn status-toggle-btn ${isOnline ? "btn-danger" : "btn-success"}`}
              onClick={toggleStatus}
            >
              {isOnline ? "🔴 Go Offline" : "🟢 Go Online"}
            </button>
          </div>

          {/* Seats */}
          <div className="card dash-card">
            <h3 className="card-title">🪑 Available Seats</h3>
            <p className="card-desc">Update how many seats are free right now.</p>
            <div className="seats-control">
              <button className="seat-btn" onClick={() => setSeatsInput(Math.max(0, seatsInput - 1))}>−</button>
              <span className="seats-display">
                <strong>{seatsInput}</strong>
                <small>/ {auto.total_seats}</small>
              </span>
              <button className="seat-btn" onClick={() => setSeatsInput(Math.min(auto.total_seats, seatsInput + 1))}>+</button>
              <button className="btn btn-primary seats-save" onClick={updateSeats}>Update</button>
            </div>
          </div>

          {/* Location */}
          <div className="card dash-card location-card">
            <h3 className="card-title">📍 Live Location</h3>
            <p className="card-desc">Share your GPS so students can track you in real-time.</p>
            {auto.latitude ? (
              <div className="location-active">
                <span className="live-pulse"></span>
                <div>
                  <strong>Location Active</strong>
                  <p>Lat: {auto.latitude?.toFixed(5)}, Lng: {auto.longitude?.toFixed(5)}</p>
                </div>
              </div>
            ) : (
              <div className="location-inactive">Location not being shared</div>
            )}
            {geoError && <p className="geo-error">⚠️ {geoError}</p>}
            <div className="location-actions">
              <button className="btn btn-success" onClick={getLocation}>📡 Share Location</button>
              <button className="btn btn-outline" onClick={stopLocation}>Stop</button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .driver-banner {
          background: linear-gradient(135deg, #064e3b 0%, #059669 50%, #10b981 100%);
          color: #fff;
          border-radius: 20px;
          padding: 36px 40px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 28px;
          position: relative;
          overflow: hidden;
        }
        .driver-banner::after {
          content: '';
          position: absolute;
          width: 300px; height: 300px;
          background: radial-gradient(circle, rgba(255,255,255,0.08), transparent 70%);
          top: -100px; right: -50px;
        }
        .banner-greeting { font-size: 15px; opacity: 0.8; font-weight: 500; margin-bottom: 4px; }
        .banner-name { font-size: 32px; font-weight: 900; letter-spacing: -0.5px; margin-bottom: 8px; }
        .banner-desc { font-size: 15px; opacity: 0.75; }
        .status-indicator {
          display: flex; align-items: center; gap: 8px;
          padding: 10px 20px; border-radius: 50px;
          font-weight: 700; font-size: 14px;
          position: relative; z-index: 1;
        }
        .status-indicator.online {
          background: rgba(255,255,255,0.2);
          border: 1.5px solid rgba(255,255,255,0.3);
        }
        .status-indicator.offline {
          background: rgba(0,0,0,0.2);
          border: 1.5px solid rgba(255,255,255,0.15);
        }
        .status-dot {
          width: 10px; height: 10px; border-radius: 50%;
        }
        .online .status-dot {
          background: #4ade80;
          box-shadow: 0 0 0 3px rgba(74,222,128,0.4);
          animation: pulse 1.5s ease-in-out infinite;
        }
        .offline .status-dot { background: #f87171; }

        .dash-card { margin-bottom: 20px; }
        .card-title {
          font-size: 17px; font-weight: 800; color: #0f172a; margin-bottom: 6px;
        }
        .card-desc {
          font-size: 13px; color: #94a3b8; margin-bottom: 20px;
        }
        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr 1.5fr;
          gap: 16px;
          margin-bottom: 8px;
        }
        .controls-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
        }
        .location-card { grid-column: 1 / -1; }
        .status-toggle-btn {
          width: 100%;
          padding: 16px !important;
          font-size: 16px !important;
        }
        .seats-control {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .seat-btn {
          width: 44px; height: 44px;
          border-radius: 12px;
          background: #f1f5f9;
          border: 2px solid #e2e8f0;
          font-size: 20px;
          font-weight: 700;
          color: #334155;
          cursor: pointer;
          transition: all 0.15s;
        }
        .seat-btn:hover { background: #e2e8f0; border-color: #cbd5e1; }
        .seats-display {
          text-align: center;
          min-width: 70px;
        }
        .seats-display strong {
          display: block;
          font-size: 28px;
          font-weight: 900;
          color: #0f172a;
        }
        .seats-display small {
          font-size: 13px;
          color: #94a3b8;
        }
        .seats-save { margin-left: auto; }
        .location-active {
          display: flex; align-items: center; gap: 12px;
          background: #ecfdf5; border-radius: 12px; padding: 14px 18px;
          margin-bottom: 16px;
        }
        .live-pulse {
          width: 12px; height: 12px; border-radius: 50%;
          background: #10b981;
          box-shadow: 0 0 0 4px rgba(16,185,129,0.3);
          animation: pulse 1.5s ease-in-out infinite;
          flex-shrink: 0;
        }
        .location-active strong { font-size: 14px; color: #059669; }
        .location-active p { font-size: 12px; color: #6ee7b7; margin-top: 2px; }
        .location-inactive {
          background: #f8fafc; border-radius: 12px; padding: 14px 18px;
          font-size: 14px; color: #94a3b8; margin-bottom: 16px; text-align: center;
        }
        .geo-error { color: #dc2626; font-size: 13px; margin-bottom: 12px; }
        .location-actions { display: flex; gap: 12px; }
        .mini-spinner {
          width: 24px; height: 24px;
          border: 3px solid #e2e8f0; border-top-color: #2563eb;
          border-radius: 50%; animation: spin 0.8s linear infinite;
          margin: 0 auto 12px;
        }
        @media (max-width: 768px) {
          .form-row { grid-template-columns: 1fr; }
          .controls-grid { grid-template-columns: 1fr; }
          .driver-banner { flex-direction: column; gap: 16px; text-align: center; }
        }
      `}</style>
    </div>
  );
}
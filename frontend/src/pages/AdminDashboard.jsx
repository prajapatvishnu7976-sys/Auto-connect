import { useState, useEffect } from "react";
import API from "../services/api";

export default function AdminDashboard() {
  const [tab, setTab] = useState("stats");
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [autos, setAutos] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);
  const [userFilter, setUserFilter] = useState("all");

  const showMsg = (text, isError = false) => {
    if (isError) { setErr(text); setMsg(""); }
    else { setMsg(text); setErr(""); }
    setTimeout(() => { setMsg(""); setErr(""); }, 3500);
  };

  const loadAll = async () => {
    try {
      const [s, u, a, r] = await Promise.all([
        API.get("/admin/stats"),
        API.get("/admin/users"),
        API.get("/admin/autos"),
        API.get("/routes"),
      ]);
      setStats(s.data);
      setUsers(u.data.users);
      setAutos(a.data.autos);
      setRoutes(r.data.routes);
    } catch {
      showMsg("Failed to load admin data.", true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadAll(); }, []);

  const approveDriver = async (userId, approved) => {
    try {
      await API.put(`/admin/users/${userId}/approval`, { approved });
      showMsg(approved ? "✅ Driver approved!" : "Driver unapproved.");
      loadAll();
    } catch {
      showMsg("Failed to update approval.", true);
    }
  };

  const deleteUser = async (userId, name) => {
    if (!window.confirm(`Delete user "${name}"? This cannot be undone.`)) return;
    try {
      await API.delete(`/admin/users/${userId}`);
      showMsg("User deleted.");
      loadAll();
    } catch (e) {
      showMsg(e.response?.data?.error || "Failed to delete.", true);
    }
  };

  const deleteRoute = async (routeId, name) => {
    if (!window.confirm(`Delete route "${name}"? This cannot be undone.`)) return;
    try {
      await API.delete(`/admin/routes/${routeId}`);
      showMsg("Route deleted.");
      loadAll();
    } catch {
      showMsg("Failed to delete route.", true);
    }
  };

  if (loading) {
    return (
      <div className="loading-text">
        <div className="mini-spinner"></div>
        Loading admin panel...
      </div>
    );
  }

  const tabs = [
    { id: "stats", label: "📊 Overview", count: null },
    { id: "users", label: "👥 Users", count: users.length },
    { id: "autos", label: "🛺 Autos", count: autos.length },
    { id: "routes", label: "🗺️ Routes", count: routes.length },
  ];

  const filteredUsers = userFilter === "all"
    ? users
    : users.filter((u) => u.role === userFilter);

  const pendingDrivers = users.filter((u) => u.role === "driver" && !u.is_approved);

  const statCards = stats ? [
    { label: "Students", value: stats.students, icon: "🎓", color: "#2563eb", bg: "#eff6ff" },
    { label: "Drivers", value: stats.drivers, icon: "🚗", color: "#059669", bg: "#ecfdf5" },
    { label: "Pending", value: stats.pending_drivers, icon: "⏳", color: "#d97706", bg: "#fffbeb" },
    { label: "Routes", value: stats.routes, icon: "🗺️", color: "#7c3aed", bg: "#f5f3ff" },
    { label: "Verified", value: stats.routes_field_verified, icon: "✅", color: "#0891b2", bg: "#ecfeff" },
    { label: "Total Autos", value: stats.autos, icon: "🛺", color: "#e11d48", bg: "#fff1f2" },
    { label: "Available", value: stats.autos_available, icon: "🟢", color: "#16a34a", bg: "#f0fdf4" },
  ] : [];

  return (
    <div className="admin-page">
      {/* Header */}
      <div className="admin-header">
        <div>
          <h1 className="admin-title">👑 Admin Panel</h1>
          <p className="admin-subtitle">Manage users, routes, autos & monitor the platform</p>
        </div>
        {pendingDrivers.length > 0 && (
          <div className="pending-alert" onClick={() => { setTab("users"); setUserFilter("driver"); }}>
            <span className="pending-count">{pendingDrivers.length}</span>
            driver{pendingDrivers.length > 1 ? "s" : ""} awaiting approval →
          </div>
        )}
      </div>

      {msg && <div className="msg-success">{msg}</div>}
      {err && <div className="msg-error">{err}</div>}

      {/* Tabs */}
      <div className="admin-tabs">
        {tabs.map((t) => (
          <button
            key={t.id}
            className={`admin-tab ${tab === t.id ? "active" : ""}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
            {t.count !== null && <span className="tab-count">{t.count}</span>}
          </button>
        ))}
      </div>

      {/* ====== STATS TAB ====== */}
      {tab === "stats" && (
        <div className="stats-grid">
          {statCards.map((s) => (
            <div key={s.label} className="stat-card" style={{ borderTopColor: s.color }}>
              <div className="stat-icon" style={{ background: s.bg }}>{s.icon}</div>
              <div className="stat-info">
                <span className="stat-value" style={{ color: s.color }}>{s.value}</span>
                <span className="stat-label">{s.label}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ====== USERS TAB ====== */}
      {tab === "users" && (
        <div>
          <div className="filter-bar">
            {["all", "student", "driver", "admin"].map((f) => (
              <button
                key={f}
                className={`filter-chip ${userFilter === f ? "active" : ""}`}
                onClick={() => setUserFilter(f)}
              >
                {f === "all" ? "All" : f.charAt(0).toUpperCase() + f.slice(1)}s
                <span className="filter-count">
                  {f === "all" ? users.length : users.filter((u) => u.role === f).length}
                </span>
              </button>
            ))}
          </div>

          <div className="table-card">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((u) => (
                  <tr key={u.user_id}>
                    <td>
                      <div className="user-cell">
                        <div className={`user-av role-${u.role}`}>
                          {u.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <strong>{u.name}</strong>
                          <small>ID #{u.user_id}</small>
                        </div>
                      </div>
                    </td>
                    <td className="email-cell">{u.email}</td>
                    <td>{u.phone || "—"}</td>
                    <td>
                      <span className={`badge badge-${u.role === "admin" ? "purple" : u.role === "driver" ? "yellow" : "blue"}`}>
                        {u.role}
                      </span>
                    </td>
                    <td>
                      {u.role === "driver" ? (
                        <button
                          className={`btn btn-sm ${u.is_approved ? "btn-outline-danger" : "btn-success"}`}
                          onClick={() => approveDriver(u.user_id, !u.is_approved)}
                        >
                          {u.is_approved ? "Unapprove" : "✓ Approve"}
                        </button>
                      ) : (
                        <span className="badge badge-green">Active</span>
                      )}
                    </td>
                    <td>
                      {u.role !== "admin" && (
                        <button
                          className="btn btn-sm btn-danger"
                          onClick={() => deleteUser(u.user_id, u.name)}
                        >
                          Delete
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredUsers.length === 0 && (
              <div className="table-empty">No users found.</div>
            )}
          </div>
        </div>
      )}

      {/* ====== AUTOS TAB ====== */}
      {tab === "autos" && (
        <div className="table-card">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Auto Number</th>
                <th>Driver</th>
                <th>Route</th>
                <th>Seats</th>
                <th>Status</th>
                <th>Approved</th>
              </tr>
            </thead>
            <tbody>
              {autos.map((a) => (
                <tr key={a.auto_number}>
                  <td><strong className="auto-num">🛺 {a.auto_number}</strong></td>
                  <td>{a.driver_name}</td>
                  <td>{a.route_id || <span className="muted">—</span>}</td>
                  <td>
                    <span className={a.available_seats > 0 ? "seats-ok" : "seats-zero"}>
                      {a.available_seats}
                    </span>
                    /{a.total_seats}
                  </td>
                  <td>
                    <span className={`badge ${a.availability === "available" ? "badge-green" : "badge-red"}`}>
                      {a.availability === "available" ? "● Online" : "● Offline"}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${a.is_approved ? "badge-green" : "badge-yellow"}`}>
                      {a.is_approved ? "Yes" : "No"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {autos.length === 0 && <div className="table-empty">No autos registered yet.</div>}
        </div>
      )}

      {/* ====== ROUTES TAB ====== */}
      {tab === "routes" && (
        <div className="table-card">
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Route Name</th>
                <th>Path</th>
                <th>Status</th>
                <th>Fare</th>
                <th>Stops</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {routes.map((r) => (
                <tr key={r.route_id}>
                  <td><span className="route-id-tag">{r.route_id}</span></td>
                  <td><strong>{r.route_name}</strong></td>
                  <td className="path-cell">
                    <span>{r.start_location}</span>
                    <span className="path-arrow">→</span>
                    <span>{r.end_location}</span>
                  </td>
                  <td>
                    <span className={`badge ${r.route_status === "Confirmed" ? "badge-green" : r.route_status === "Historical reference" ? "badge-red" : "badge-yellow"}`}>
                      {r.route_status}
                    </span>
                  </td>
                  <td>{r.fare ? `₹${r.fare}` : <span className="muted">—</span>}</td>
                  <td>{r.stops?.length || 0}</td>
                  <td>
                    <button
                      className="btn btn-sm btn-danger"
                      onClick={() => deleteRoute(r.route_id, r.route_name)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {routes.length === 0 && <div className="table-empty">No routes found.</div>}
        </div>
      )}

      <style>{`
        .admin-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 28px;
          flex-wrap: wrap;
          gap: 16px;
        }
        .admin-title {
          font-size: 28px;
          font-weight: 900;
          color: #0f172a;
          letter-spacing: -0.5px;
        }
        .admin-subtitle {
          font-size: 14px;
          color: #64748b;
          margin-top: 4px;
        }
        .pending-alert {
          display: flex;
          align-items: center;
          gap: 10px;
          background: #fffbeb;
          border: 1.5px solid #fde68a;
          color: #92400e;
          padding: 10px 20px;
          border-radius: 12px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }
        .pending-alert:hover {
          background: #fef3c7;
          transform: translateY(-1px);
        }
        .pending-count {
          background: #f59e0b;
          color: #fff;
          width: 26px;
          height: 26px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 13px;
          font-weight: 800;
        }

        /* Tabs */
        .admin-tabs {
          display: flex;
          gap: 6px;
          background: #f1f5f9;
          padding: 6px;
          border-radius: 14px;
          margin-bottom: 28px;
          overflow-x: auto;
        }
        .admin-tab {
          flex: 1;
          padding: 12px 20px;
          border-radius: 10px;
          border: none;
          background: transparent;
          font-size: 14px;
          font-weight: 600;
          color: #64748b;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          white-space: nowrap;
        }
        .admin-tab:hover { color: #334155; background: rgba(255,255,255,0.5); }
        .admin-tab.active {
          background: #ffffff;
          color: #0f172a;
          box-shadow: 0 2px 8px rgba(0,0,0,0.06);
        }
        .tab-count {
          background: #e2e8f0;
          color: #475569;
          font-size: 12px;
          font-weight: 700;
          padding: 1px 8px;
          border-radius: 10px;
        }
        .admin-tab.active .tab-count {
          background: #dbeafe;
          color: #2563eb;
        }

        /* Stats */
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 16px;
        }
        .stat-card {
          background: #fff;
          border-radius: 16px;
          padding: 24px;
          display: flex;
          align-items: center;
          gap: 16px;
          border: 1px solid #f1f5f9;
          border-top: 3px solid;
          box-shadow: 0 2px 4px rgba(0,0,0,0.03);
          transition: transform 0.2s;
        }
        .stat-card:hover { transform: translateY(-3px); }
        .stat-icon {
          width: 52px;
          height: 52px;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
          flex-shrink: 0;
        }
        .stat-value {
          display: block;
          font-size: 28px;
          font-weight: 900;
          letter-spacing: -1px;
        }
        .stat-label {
          font-size: 13px;
          color: #94a3b8;
          font-weight: 500;
        }

        /* Filters */
        .filter-bar {
          display: flex;
          gap: 8px;
          margin-bottom: 20px;
          flex-wrap: wrap;
        }
        .filter-chip {
          padding: 8px 16px;
          border-radius: 50px;
          border: 1.5px solid #e2e8f0;
          background: #fff;
          font-size: 13px;
          font-weight: 600;
          color: #64748b;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 6px;
          transition: all 0.15s;
        }
        .filter-chip:hover { border-color: #93c5fd; color: #2563eb; }
        .filter-chip.active {
          background: #2563eb;
          border-color: #2563eb;
          color: #fff;
        }
        .filter-count {
          background: rgba(0,0,0,0.08);
          padding: 1px 7px;
          border-radius: 10px;
          font-size: 11px;
        }
        .filter-chip.active .filter-count {
          background: rgba(255,255,255,0.25);
        }

        /* Table */
        .table-card {
          background: #fff;
          border-radius: 16px;
          border: 1px solid #f1f5f9;
          box-shadow: 0 2px 4px rgba(0,0,0,0.03);
          overflow-x: auto;
        }
        .admin-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 14px;
        }
        .admin-table thead {
          background: #f8fafc;
        }
        .admin-table th {
          padding: 14px 18px;
          text-align: left;
          font-size: 12px;
          font-weight: 700;
          color: #94a3b8;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          border-bottom: 2px solid #f1f5f9;
          white-space: nowrap;
        }
        .admin-table td {
          padding: 14px 18px;
          border-bottom: 1px solid #f8fafc;
          color: #334155;
          vertical-align: middle;
        }
        .admin-table tbody tr {
          transition: background 0.15s;
        }
        .admin-table tbody tr:hover {
          background: #f8fafc;
        }
        .user-cell {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .user-av {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
          font-size: 14px;
          color: #fff;
          flex-shrink: 0;
        }
        .user-av.role-student { background: linear-gradient(135deg, #2563eb, #3b82f6); }
        .user-av.role-driver { background: linear-gradient(135deg, #059669, #10b981); }
        .user-av.role-admin { background: linear-gradient(135deg, #7c3aed, #a78bfa); }
        .user-cell strong { display: block; font-size: 14px; color: #0f172a; }
        .user-cell small { font-size: 11px; color: #94a3b8; }
        .email-cell { font-size: 13px; color: #64748b; }
        .auto-num { color: #0f172a; font-size: 14px; }
        .route-id-tag {
          background: #f1f5f9;
          padding: 3px 8px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 700;
          color: #475569;
          letter-spacing: 0.3px;
        }
        .path-cell {
          font-size: 13px;
          max-width: 220px;
        }
        .path-arrow {
          color: #cbd5e1;
          margin: 0 6px;
        }
        .seats-ok { color: #059669; font-weight: 800; }
        .seats-zero { color: #dc2626; font-weight: 800; }
        .muted { color: #cbd5e1; }
        .table-empty {
          text-align: center;
          padding: 48px;
          color: #94a3b8;
          font-size: 14px;
        }
        .btn-sm {
          padding: 6px 14px !important;
          font-size: 12px !important;
          border-radius: 8px !important;
        }
        .btn-outline-danger {
          background: transparent;
          border: 1.5px solid #fca5a5;
          color: #dc2626;
        }
        .btn-outline-danger:hover {
          background: #fef2f2;
        }
        .mini-spinner {
          width: 28px; height: 28px;
          border: 3px solid #e2e8f0;
          border-top-color: #2563eb;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
          margin: 0 auto 12px;
        }
        @media (max-width: 768px) {
          .admin-tabs { flex-wrap: nowrap; }
          .stats-grid { grid-template-columns: 1fr 1fr; }
        }
      `}</style>
    </div>
  );
}
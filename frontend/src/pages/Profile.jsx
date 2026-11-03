import { useAuth } from "../context/AuthContext";
import { Link } from "react-router-dom";

export default function Profile() {
  const { user } = useAuth();

  if (!user) return null;

  const roleConfig = {
    student: { emoji: "🎓", label: "Student", color: "#2563eb", bg: "#eff6ff", dashboard: "/student" },
    driver: { emoji: "🚗", label: "Driver", color: "#059669", bg: "#ecfdf5", dashboard: "/driver" },
    admin: { emoji: "👑", label: "Admin", color: "#7c3aed", bg: "#f5f3ff", dashboard: "/admin" },
  };

  const role = roleConfig[user.role] || roleConfig.student;

  return (
    <div className="profile-page">
      <div className="profile-card">
        {/* Avatar Header */}
        <div className="profile-header" style={{ background: `linear-gradient(135deg, ${role.color}, ${role.color}dd)` }}>
          <div className="profile-avatar">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <h1 className="profile-name">{user.name}</h1>
          <span className="profile-role-badge">
            {role.emoji} {role.label}
          </span>
        </div>

        {/* Details */}
        <div className="profile-body">
          <div className="profile-field">
            <span className="field-icon">📧</span>
            <div className="field-content">
              <span className="field-label">Email</span>
              <span className="field-value">{user.email}</span>
            </div>
          </div>

          <div className="profile-field">
            <span className="field-icon">📱</span>
            <div className="field-content">
              <span className="field-label">Phone</span>
              <span className="field-value">{user.phone || "Not provided"}</span>
            </div>
          </div>

          <div className="profile-field">
            <span className="field-icon">🆔</span>
            <div className="field-content">
              <span className="field-label">User ID</span>
              <span className="field-value">#{user.user_id}</span>
            </div>
          </div>

          <div className="profile-field">
            <span className="field-icon">🎭</span>
            <div className="field-content">
              <span className="field-label">Role</span>
              <span className="field-value" style={{ color: role.color, fontWeight: 700 }}>
                {role.emoji} {role.label}
              </span>
            </div>
          </div>

          {user.role === "driver" && (
            <div className="profile-field">
              <span className="field-icon">{user.is_approved ? "✅" : "⏳"}</span>
              <div className="field-content">
                <span className="field-label">Approval Status</span>
                <span className={`field-value ${user.is_approved ? "approved" : "pending"}`}>
                  {user.is_approved ? "Approved" : "Pending Admin Approval"}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="profile-actions">
          <Link to={role.dashboard} className="btn btn-primary" style={{ flex: 1 }}>
            Go to Dashboard →
          </Link>
          <Link to="/" className="btn btn-outline" style={{ flex: 1 }}>
            Browse Routes
          </Link>
        </div>
      </div>

      <style>{`
        .profile-page {
          display: flex;
          justify-content: center;
          padding: 20px 0 40px;
        }
        .profile-card {
          width: 100%;
          max-width: 480px;
          background: #ffffff;
          border-radius: 20px;
          overflow: hidden;
          box-shadow: 0 8px 30px rgba(0,0,0,0.08);
          border: 1px solid #f1f5f9;
        }
        .profile-header {
          padding: 40px 28px 36px;
          text-align: center;
          color: #fff;
        }
        .profile-avatar {
          width: 88px;
          height: 88px;
          border-radius: 50%;
          background: rgba(255,255,255,0.2);
          border: 3px solid rgba(255,255,255,0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 36px;
          font-weight: 800;
          margin: 0 auto 16px;
          backdrop-filter: blur(10px);
        }
        .profile-name {
          font-size: 26px;
          font-weight: 800;
          margin-bottom: 10px;
          letter-spacing: -0.5px;
        }
        .profile-role-badge {
          display: inline-block;
          background: rgba(255,255,255,0.2);
          padding: 6px 18px;
          border-radius: 50px;
          font-size: 14px;
          font-weight: 600;
          backdrop-filter: blur(10px);
        }
        .profile-body {
          padding: 28px;
        }
        .profile-field {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 16px 0;
          border-bottom: 1px solid #f1f5f9;
        }
        .profile-field:last-child {
          border-bottom: none;
        }
        .field-icon {
          width: 44px;
          height: 44px;
          background: #f8fafc;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
          flex-shrink: 0;
        }
        .field-content {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .field-label {
          font-size: 12px;
          color: #94a3b8;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .field-value {
          font-size: 15px;
          font-weight: 600;
          color: #0f172a;
        }
        .field-value.approved { color: #059669; }
        .field-value.pending { color: #d97706; }
        .profile-actions {
          display: flex;
          gap: 12px;
          padding: 0 28px 28px;
        }
      `}</style>
    </div>
  );
}
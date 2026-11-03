export default function Loader({ fullScreen = true }) {
  return (
    <div className={fullScreen ? "loader-fullscreen" : "loader-inline"}>
      <div className="loader-content">
        <div className="loader-ring">
          <div className="loader-ring-inner"></div>
        </div>
        <p className="loader-text">Loading AutoConnect...</p>
      </div>

      <style>{`
        .loader-fullscreen {
          display: flex;
          justify-content: center;
          align-items: center;
          height: 100vh;
          background: linear-gradient(135deg, #f8fafc 0%, #eff6ff 100%);
        }
        .loader-inline {
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 80px 20px;
        }
        .loader-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 20px;
        }
        .loader-ring {
          width: 56px;
          height: 56px;
          border-radius: 50%;
          background: conic-gradient(from 0deg, #2563eb, #7c3aed, #2563eb);
          animation: spin 1s linear infinite;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .loader-ring-inner {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: #f8fafc;
        }
        .loader-text {
          color: #64748b;
          font-size: 15px;
          font-weight: 600;
          letter-spacing: 0.3px;
          animation: pulse 1.5s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
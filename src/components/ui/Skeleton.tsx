export const SkeletonTicketGrid = () => (
  <div className="ticket-grid">
    {Array.from({ length: 30 }).map((_, i) => (
      <div
        key={i}
        style={{
          borderRadius: "10px",
          padding: "10px 6px",
          textAlign: "center",
          background: "rgba(30, 20, 53, 0.3)",
          border: "1px solid rgba(124,58,237,0.1)",
          position: "relative",
          overflow: "hidden",
          height: "52px",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.04), transparent)",
            animation: "shimmer 1.5s infinite",
          }}
        />
        <style>{`
          @keyframes shimmer {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
          }
        `}</style>
      </div>
    ))}
  </div>
);
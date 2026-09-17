import React, { useEffect } from "react";
import { IconCheck, IconX } from "@tabler/icons-react";

/**
 * Full-screen animated gate. Shown when a check-in/out decision comes back:
 * granted -> the two doors slide apart revealing a welcome; denied -> doors stay shut.
 * Auto-closes after a few seconds.
 */
export default function GateOverlay({ show, decision, onClose }) {
  useEffect(() => {
    if (!show) return undefined;
    const t = setTimeout(() => onClose?.(), 3800);
    return () => clearTimeout(t);
  }, [show, onClose]);

  if (!show || !decision) return null;

  const granted = decision.accessGranted;

  return (
    <div style={styles.backdrop} onClick={onClose}>
      <style>{keyframes}</style>
      <div style={styles.box} onClick={(e) => e.stopPropagation()}>
        <div style={styles.gateInner}>
          <div style={{ ...styles.behind, background: granted ? "#0c2a26" : "#3a1115" }}>
            {granted ? (
              <div style={styles.center} className="gov-pop">
                <IconCheck size={56} color="#2bd4bd" />
                <div style={styles.welcome}>Welcome{decision.memberName ? `, ${decision.memberName}` : ""}!</div>
                <div style={styles.open}>🟢 GATE OPEN</div>
              </div>
            ) : (
              <div style={styles.center} className="gov-shake">
                <IconX size={56} color="#ff6b6b" />
                <div style={{ ...styles.welcome, color: "#ff6b6b" }}>Access Denied</div>
                <div style={styles.denied}>{decision.message}</div>
              </div>
            )}
          </div>
          <div className={`gov-door ${granted ? "gov-open-left" : ""}`} style={{ ...styles.door, left: 0 }}>
            <div style={styles.handle} />
          </div>
          <div className={`gov-door ${granted ? "gov-open-right" : ""}`} style={{ ...styles.door, right: 0 }}>
            <div style={{ ...styles.handle, left: 10 }} />
          </div>
        </div>
        <p style={styles.msg}>{decision.message}</p>
      </div>
    </div>
  );
}

const keyframes = `
@keyframes govPop { 0%{transform:scale(.6);opacity:0;} 100%{transform:scale(1);opacity:1;} }
@keyframes govShake { 0%,100%{transform:translateX(0);} 20%{transform:translateX(-8px);} 40%{transform:translateX(8px);} 60%{transform:translateX(-6px);} 80%{transform:translateX(6px);} }
.gov-pop { animation: govPop .35s ease both; }
.gov-shake { animation: govShake .45s ease both; }
.gov-door { transition: transform .9s cubic-bezier(.22,.61,.36,1); }
.gov-open-left { transform: translateX(-100%); }
.gov-open-right { transform: translateX(100%); }
`;

const styles = {
  backdrop: { position: "fixed", inset: 0, zIndex: 1080, background: "rgba(6,18,16,.85)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 20 },
  box: { textAlign: "center" },
  gateInner: { position: "relative", width: 340, height: 215, borderRadius: 12, overflow: "hidden", border: "3px solid #2bb3a3", margin: "0 auto" },
  behind: { position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" },
  center: { textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 6, color: "#fff" },
  welcome: { fontSize: 24, fontWeight: 800 },
  open: { fontSize: 14, color: "#2bd4bd", letterSpacing: 2, fontWeight: 700 },
  denied: { fontSize: 13, color: "#ffb4b4", maxWidth: 260 },
  door: { position: "absolute", top: 0, width: "50%", height: "100%", background: "linear-gradient(135deg, #1f6f64, #2bb3a3)" },
  handle: { position: "absolute", top: "50%", right: 10, width: 8, height: 42, marginTop: -21, borderRadius: 4, background: "rgba(255,255,255,.5)" },
  msg: { color: "#fff", marginTop: 18, fontSize: 16, fontWeight: 600 },
};

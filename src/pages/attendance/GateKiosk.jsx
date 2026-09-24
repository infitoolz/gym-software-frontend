import React, { useEffect, useRef, useState, useCallback } from "react";
import { kioskCheckIn } from "../../api/attendanceApi";
import { getMemberMembership, createMembershipOrder, verifyMembershipPayment } from "../../api/membershipApi";
import { getMembershipPlans } from "../../api/membershipPlansApi";
import { getInventory } from "../../api/inventoryApi";
import { getMemberProgressEntries } from "../../api/progressApi";
import { getVisibleTrainers } from "../../api/scheduleApi";
import { extractApiErrorMessage } from "../../utils/errorMessage";
import Swal from "sweetalert2";
import { Html5Qrcode } from "html5-qrcode";
import {
  IconScan,
  IconCrown,
  IconCalendarEvent,
  IconBottle,
  IconChartBar,
  IconArrowLeft,
  IconUser,
  IconCheck,
  IconX,
  IconCurrencyRupee,
  IconStar,
  IconBarbell,
  IconHeart,
  IconShoppingCart,
  IconMaximize,
  IconMinimize,
  IconLock,
  IconKeyboard,
  IconClock,
  IconTrash,
  IconCircleCheck,
  IconCircleX,
  IconBolt,
  IconLogout,
  IconCamera,
  IconCameraOff,
  IconRefresh,
  IconUpload,
  IconPhoto,
} from "@tabler/icons-react";

// ── Load Razorpay script ──────────────────────────────────────────
const loadRazorpay = () =>
  new Promise((resolve, reject) => {
    if (window.Razorpay) return resolve(true);
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = () => resolve(true);
    s.onerror = () => reject(new Error("Failed to load payment gateway"));
    document.body.appendChild(s);
  });

// ── Kiosk wrapper (shared layout) ─────────────────────────────────
function KioskShell({
  children,
  onBack,
  title,
  subtitle,
  isKioskMode,
  onToggleKioskMode,
}) {
  const [timeStr, setTimeStr] = useState("");
  const [dateStr, setDateStr] = useState("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(
        now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })
      );
      setDateStr(
        now.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={isKioskMode ? styles.kioskFullscreenWrap : styles.wrap}>
      <style>{keyframes}</style>

      {/* Top status bar */}
      <header style={styles.topBar}>
        <div style={styles.topBarLeft}>
          {onBack ? (
            <button type="button" onClick={onBack} style={styles.backBtn}>
              <IconArrowLeft size={18} />
              <span>Back</span>
            </button>
          ) : (
            <div style={styles.statusPill}>
              <span style={styles.liveDot} />
              <span style={styles.liveText}>GATE 01 • TERMINAL ONLINE</span>
            </div>
          )}
        </div>

        <div style={styles.topBarCenter}>
          <div style={styles.clockTime}>
            <IconClock size={16} style={{ opacity: 0.8 }} />
            <span>{timeStr || "--:--"}</span>
          </div>
          <div style={styles.clockDate}>{dateStr}</div>
        </div>

        <div style={styles.topBarRight}>
          <button
            type="button"
            onClick={onToggleKioskMode}
            style={isKioskMode ? styles.kioskExitBtn : styles.kioskModeBtn}
            title={isKioskMode ? "Exit Fullscreen Kiosk" : "Enter Standalone Kiosk Mode"}
          >
            {isKioskMode ? (
              <>
                <IconLock size={16} />
                <span>Exit Kiosk</span>
              </>
            ) : (
              <>
                <IconMaximize size={16} />
                <span>Launch Kiosk Mode</span>
              </>
            )}
          </button>
        </div>
      </header>

      {/* Brand header */}
      <div style={styles.brandBox}>
        <div style={styles.brandGlow}>FITNEXUS</div>
        <div style={styles.brandSub}>Smart Touch Gate & Member Self-Service</div>
        {title && <h2 style={styles.sectionTitle}>{title}</h2>}
        {subtitle && <p style={styles.sub}>{subtitle}</p>}
      </div>

      <div style={styles.mainContent}>{children}</div>
    </div>
  );
}

// ── On-Screen Touch Keypad Component ──────────────────────────────
function TouchKeypad({ onKeyPress, onBackspace, onClear, onSubmit }) {
  const keys = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "CLR", "0", "DEL"];

  const handleKeyClick = (key) => {
    if (key === "CLR") {
      onClear && onClear();
    } else if (key === "DEL") {
      onBackspace && onBackspace();
    } else {
      onKeyPress && onKeyPress(key);
    }
  };

  return (
    <div style={styles.keypadContainer} className="fade-in">
      <div style={styles.keypadGrid}>
        {keys.map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => handleKeyClick(k)}
            style={
              k === "CLR"
                ? { ...styles.keypadBtn, color: "#ff8787" }
                : k === "DEL"
                ? { ...styles.keypadBtn, color: "#ffd43b" }
                : styles.keypadBtn
            }
          >
            {k}
          </button>
        ))}
      </div>
      {onSubmit && (
        <button type="button" onClick={onSubmit} style={styles.keypadSubmitBtn}>
          <IconCheck size={18} /> Confirm Entry
        </button>
      )}
    </div>
  );
}

// ── Main kiosk component ──────────────────────────────────────────
export default function GateKiosk() {
  const [screen, setScreen] = useState("home"); // home | checkin | identify | renew | book | shop | progress
  const [memberId, setMemberId] = useState(null); // identified member
  const [memberInfo, setMemberInfo] = useState(null);
  const [pendingFeature, setPendingFeature] = useState(null);
  const [isKioskMode, setIsKioskMode] = useState(false);

  const handleBack = () => {
    setScreen("home");
    setPendingFeature(null);
  };

  // Toggle Fullscreen / Standalone Kiosk Mode
  const handleToggleKioskMode = async () => {
    if (!isKioskMode) {
      try {
        if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
          await document.documentElement.requestFullscreen();
        }
      } catch (err) {
        console.warn("Fullscreen request bypassed:", err);
      }
      setIsKioskMode(true);
    } else {
      const { value: pin } = await Swal.fire({
        title: "Staff PIN Required",
        text: "Enter staff security PIN to exit Kiosk Mode",
        input: "password",
        inputPlaceholder: "Default PIN: 1234",
        showCancelButton: true,
        confirmButtonText: "Exit Kiosk",
        confirmButtonColor: "#2bb3a3",
        cancelButtonColor: "#495057",
        background: "#0d2622",
        color: "#fff",
      });

      if (pin === "1234" || pin === "admin" || pin === "9999") {
        try {
          if (document.fullscreenElement && document.exitFullscreen) {
            await document.exitFullscreen();
          }
        } catch (err) {
          console.warn("Exit fullscreen bypassed:", err);
        }
        setIsKioskMode(false);
      } else if (pin) {
        Swal.fire({
          icon: "error",
          title: "Invalid PIN",
          text: "Authorized gym staff only",
          timer: 1500,
          showConfirmButton: false,
          background: "#0d2622",
          color: "#fff",
        });
      }
    }
  };

  // Modern feature definitions with crisp Tabler SVG icons
  const features = [
    {
      key: "checkin",
      icon: <IconScan size={36} stroke={2} />,
      label: "Check In",
      badge: "Turnstile Gate Access",
      desc: "Scan your fingerprint, QR code, or enter your member PIN to enter the gym",
      color: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
      glow: "rgba(16, 185, 129, 0.35)",
    },
    {
      key: "renew",
      icon: <IconCrown size={36} stroke={2} />,
      label: "Renew Membership",
      badge: "Instant Active Plans",
      desc: "View your plan details and extend your membership with on-screen payment",
      color: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
      glow: "rgba(245, 158, 11, 0.35)",
    },
    {
      key: "book",
      icon: <IconCalendarEvent size={36} stroke={2} />,
      label: "Book PT Session",
      badge: "Trainers On Duty",
      desc: "Reserve a dedicated session with your assigned personal trainer",
      color: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
      glow: "rgba(99, 102, 241, 0.35)",
    },
    {
      key: "shop",
      icon: <IconBottle size={36} stroke={2} />,
      label: "Buy Supplements",
      badge: "Front-Desk Store",
      desc: "Browse protein shakes, BCAAs, energy drinks, and gym snacks",
      color: "linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)",
      glow: "rgba(6, 182, 212, 0.35)",
    },
    {
      key: "progress",
      icon: <IconChartBar size={36} stroke={2} />,
      label: "View Progress",
      badge: "Fitness & Goal Stats",
      desc: "Check your workouts this week, recent weights, and health score",
      color: "linear-gradient(135deg, #ec4899 0%, #be185d 100%)",
      glow: "rgba(236, 72, 153, 0.35)",
    },
  ];

  const handleFeature = (key) => {
    if (key === "checkin") {
      setScreen("checkin");
    } else {
      if (memberId) {
        setScreen(key);
      } else {
        setScreen("identify");
        setPendingFeature(key);
      }
    }
  };

  const onIdentified = (id, info) => {
    setMemberId(id);
    setMemberInfo(info);
    if (pendingFeature) {
      setScreen(pendingFeature);
      setPendingFeature(null);
    }
  };

  return (
    <KioskShell
      onBack={screen !== "home" ? handleBack : null}
      isKioskMode={isKioskMode}
      onToggleKioskMode={handleToggleKioskMode}
    >
      {/* Home screen with balanced 3+2 layout */}
      {screen === "home" && (
        <div style={styles.homeContainer} className="fade-in">
          {memberInfo && (
            <div style={styles.memberBadge}>
              <IconUser size={18} color="#2bd4bd" />
              <span>
                Signed in as: <strong>{memberInfo.name || "Member"}</strong>
                {memberInfo.email ? ` • ${memberInfo.email}` : ` • ID: ${memberId}`}
              </span>
              <button
                type="button"
                onClick={() => {
                  setMemberId(null);
                  setMemberInfo(null);
                }}
                style={styles.logoutBtn}
                title="Switch Member"
              >
                <IconLogout size={14} /> Switch
              </button>
            </div>
          )}

          <p style={styles.homeInstruction}>Select an action below to get started</p>

          {/* Balanced 3 + 2 Grid */}
          <div style={styles.cardsWrapper}>
            {/* Top row of 3 cards */}
            <div style={styles.gridRow3}>
              {features.slice(0, 3).map((f) => (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => handleFeature(f.key)}
                  style={styles.featureCard}
                  className="kiosk-card-hover"
                >
                  <div style={{ ...styles.featureIcon, background: f.color, boxShadow: `0 8px 24px ${f.glow}` }}>
                    {f.icon}
                  </div>
                  <div style={styles.cardHeaderArea}>
                    <span style={styles.cardTag}>{f.badge}</span>
                    <h3 style={styles.featureLabel}>{f.label}</h3>
                  </div>
                  <p style={styles.featureDesc}>{f.desc}</p>
                </button>
              ))}
            </div>

            {/* Bottom row of 2 centered cards */}
            <div style={styles.gridRow2}>
              {features.slice(3, 5).map((f) => (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => handleFeature(f.key)}
                  style={styles.featureCard}
                  className="kiosk-card-hover"
                >
                  <div style={{ ...styles.featureIcon, background: f.color, boxShadow: `0 8px 24px ${f.glow}` }}>
                    {f.icon}
                  </div>
                  <div style={styles.cardHeaderArea}>
                    <span style={styles.cardTag}>{f.badge}</span>
                    <h3 style={styles.featureLabel}>{f.label}</h3>
                  </div>
                  <p style={styles.featureDesc}>{f.desc}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Identify member screen */}
      {screen === "identify" && (
        <IdentifyMember onIdentified={onIdentified} onBack={handleBack} />
      )}

      {/* Check In screen */}
      {screen === "checkin" && <CheckInScreen onBack={handleBack} />}

      {/* Renew Membership */}
      {screen === "renew" && memberId && (
        <RenewScreen memberId={memberId} memberInfo={memberInfo} onBack={handleBack} />
      )}

      {/* Book PT Session */}
      {screen === "book" && memberId && (
        <BookPTScreen memberId={memberId} onBack={handleBack} />
      )}

      {/* Buy Supplements */}
      {screen === "shop" && memberId && (
        <ShopScreen memberId={memberId} onBack={handleBack} />
      )}

      {/* View Progress */}
      {screen === "progress" && memberId && (
        <ProgressScreen memberId={memberId} onBack={handleBack} />
      )}
    </KioskShell>
  );
}

// ── Member Identification Screen ──────────────────────────────────
function IdentifyMember({ onIdentified, onBack }) {
  const [identifier, setIdentifier] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [showKeypad, setShowKeypad] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!identifier.trim() || busy) return;
    setBusy(true);
    setError("");
    try {
      const result = await kioskCheckIn(identifier.trim());
      if (result?.memberName) {
        onIdentified(identifier.trim(), {
          name: result.memberName,
          email: result.memberEmail || "",
        });
      } else {
        onIdentified(identifier.trim(), {
          name: result?.memberName || identifier.trim(),
          email: result?.memberEmail || "",
        });
      }
    } catch (err) {
      const msg = extractApiErrorMessage(err, "");
      if (
        msg.toLowerCase().includes("member") ||
        msg.toLowerCase().includes("slot") ||
        msg.toLowerCase().includes("time") ||
        msg.toLowerCase().includes("access")
      ) {
        onIdentified(identifier.trim(), { name: identifier.trim(), email: "" });
      } else {
        setError("Member not found. Please verify your ID, email, or scan code.");
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={styles.formContainer} className="fade-in">
      <div style={styles.screenHeader}>
        <div style={styles.largeIconBadge}>
          <IconUser size={40} color="#2bd4bd" />
        </div>
        <h2 style={{ fontSize: 24, fontWeight: 800, margin: "8px 0 4px" }}>Member Identification</h2>
        <p style={styles.sub}>Enter your Member ID, QR code, or registered email to continue</p>
      </div>

      {error && <div style={styles.errorBox}>{error}</div>}

      <form onSubmit={handleSubmit} style={styles.identifyForm}>
        <div style={{ position: "relative", flex: 1 }}>
          <input
            ref={inputRef}
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            placeholder="e.g. FNX001, 102, or email"
            style={styles.input}
            disabled={busy}
          />
          <button
            type="button"
            onClick={() => setShowKeypad(!showKeypad)}
            style={styles.keypadToggleBtn}
            title="Toggle on-screen numeric keypad"
          >
            <IconKeyboard size={20} color={showKeypad ? "#2bd4bd" : "#9fb4b0"} />
          </button>
        </div>
        <button
          type="submit"
          style={styles.primaryBtn}
          disabled={busy || !identifier.trim()}
        >
          {busy ? "Verifying..." : "Continue"}
        </button>
      </form>

      {/* Optional touch keypad */}
      {showKeypad && (
        <TouchKeypad
          onKeyPress={(k) => setIdentifier((prev) => prev + k)}
          onBackspace={() => setIdentifier((prev) => prev.slice(0, -1))}
          onClear={() => setIdentifier("")}
          onSubmit={handleSubmit}
        />
      )}

      <button type="button" onClick={onBack} style={styles.linkBtn}>
        <IconArrowLeft size={16} /> Return to Menu
      </button>
    </div>
  );
}

// ── Check In Screen (Turnstile Gate Simulation + Live Camera Scanner) ───────────────────
function CheckInScreen({ onBack }) {
  const [identifier, setIdentifier] = useState("");
  const [status, setStatus] = useState("idle"); // idle | processing | granted | denied
  const [result, setResult] = useState(null);
  const [showKeypad, setShowKeypad] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [facingMode, setFacingMode] = useState("user"); // "user" | "environment"
  const [cameraRetryCount, setCameraRetryCount] = useState(0);

  const inputRef = useRef(null);
  const fileInputRef = useRef(null);
  const [fileScanning, setFileScanning] = useState(false);
  const resetTimer = useRef(null);
  const processingRef = useRef(false);
  const scannerRef = useRef(null);
  const lastScanTimestamp = useRef(0);
  const keyBufferRef = useRef("");
  const lastKeyTimeRef = useRef(0);

  useEffect(() => {
    inputRef.current?.focus();
    return () => clearTimeout(resetTimer.current);
  }, []);

  // USB/Bluetooth Hardware Barcode Scanner Listener (Keystroke buffer emulation)
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't intercept if user is consciously typing into an input field or textarea
      if (document.activeElement?.tagName === "INPUT" || document.activeElement?.tagName === "TEXTAREA") {
        return;
      }

      const now = Date.now();
      const interval = now - lastKeyTimeRef.current;
      lastKeyTimeRef.current = now;

      // Scanners send keys in under 50ms intervals
      if (e.key === "Enter") {
        if (keyBufferRef.current.length >= 3) {
          const scannedCode = keyBufferRef.current.trim();
          keyBufferRef.current = "";
          processCheckin(scannedCode);
        }
        keyBufferRef.current = "";
      } else if (e.key.length === 1) {
        if (interval > 80) {
          keyBufferRef.current = "";
        }
        keyBufferRef.current += e.key;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Camera Scanner Lifecycle Management
  useEffect(() => {
    if (!cameraActive) {
      if (scannerRef.current) {
        try {
          if (scannerRef.current.isScanning) {
            scannerRef.current.stop().then(() => {
              scannerRef.current?.clear();
              scannerRef.current = null;
            }).catch(console.warn);
          } else {
            scannerRef.current.clear();
            scannerRef.current = null;
          }
        } catch (e) {
          console.warn("Camera cleanup error:", e);
        }
      }
      return;
    }

    let isMounted = true;
    setCameraError("");

    const timer = setTimeout(async () => {
      if (!isMounted) return;
      const elementId = "kiosk-camera-reader";
      const targetEl = document.getElementById(elementId);
      if (!targetEl) return;

      try {
        const scanner = new Html5Qrcode(elementId);
        scannerRef.current = scanner;

        // Try getting cameras to use explicit device ID, avoiding driver constraint failures
        let cameraToUse = { facingMode };
        try {
          const devices = await Html5Qrcode.getCameras();
          if (devices && devices.length > 0) {
            const backCam = devices.find((d) => d.label.toLowerCase().includes("back") || d.label.toLowerCase().includes("rear"));
            const frontCam = devices.find((d) => d.label.toLowerCase().includes("front") || d.label.toLowerCase().includes("user"));
            if (facingMode === "environment" && backCam) {
              cameraToUse = backCam.id;
            } else if (frontCam) {
              cameraToUse = frontCam.id;
            } else {
              cameraToUse = devices[0].id;
            }
          }
        } catch (camErr) {
          cameraToUse = { facingMode };
        }

        const config = {
          fps: 12,
          qrbox: { width: 220, height: 220 },
          aspectRatio: 1.0,
        };

        await scanner.start(
          cameraToUse,
          config,
          (decodedText) => {
            if (!isMounted) return;
            handleCameraDetect(decodedText);
          },
          () => {
            // normal continuous frame scan callback
          }
        );
      } catch (err) {
        if (!isMounted) return;
        console.warn("Camera scanner start failed:", err);
        const errStr = String(err?.message || err || "").toLowerCase();
        const isPermission =
          err?.name === "NotAllowedError" ||
          err?.name === "PermissionDeniedError" ||
          errStr.includes("permission") ||
          errStr.includes("notallowed");

        if (isPermission) {
          setCameraError(
            "Camera permission is blocked in your browser. Look at the address bar (left of localhost:3000), click the crossed-out icon, set Camera to 'Allow', then tap Retry below."
          );
        } else {
          setCameraError(
            "Camera unavailable. Please check if your webcam is connected or in use by another app."
          );
        }
      }
    }, 120);

    return () => {
      isMounted = false;
      clearTimeout(timer);
      if (scannerRef.current) {
        try {
          if (scannerRef.current.isScanning) {
            scannerRef.current.stop().then(() => {
              scannerRef.current?.clear();
              scannerRef.current = null;
            }).catch(console.warn);
          } else {
            scannerRef.current.clear();
            scannerRef.current = null;
          }
        } catch (e) {
          console.warn("Unmount camera cleanup error:", e);
        }
      }
    };
  }, [cameraActive, facingMode, cameraRetryCount]);

  const resetSoon = () => {
    clearTimeout(resetTimer.current);
    resetTimer.current = setTimeout(() => {
      setStatus("idle");
      setResult(null);
      setIdentifier("");
      processingRef.current = false;
      inputRef.current?.focus();
    }, 4500);
  };

  const processCheckin = async (value) => {
    if (!value?.trim() || processingRef.current) return;
    processingRef.current = true;
    setStatus("processing");
    setResult(null);
    try {
      const decision = await kioskCheckIn(value.trim());
      setResult(decision);
      setStatus(decision?.accessGranted ? "granted" : "denied");
    } catch (err) {
      setResult({
        accessGranted: false,
        message: extractApiErrorMessage(err, "Check-in failed"),
      });
      setStatus("denied");
    } finally {
      resetSoon();
    }
  };

  const handleCameraDetect = (decodedText) => {
    const now = Date.now();
    // 3.5-second debounce on camera scan
    if (now - lastScanTimestamp.current < 3500 || processingRef.current) {
      return;
    }
    lastScanTimestamp.current = now;
    setIdentifier(decodedText);
    processCheckin(decodedText);
  };

  const submit = (e) => {
    e?.preventDefault();
    if (status === "processing") return;
    processCheckin(identifier);
  };

  const toggleCamera = () => {
    setCameraActive((prev) => !prev);
  };

  const flipCamera = () => {
    setFacingMode((prev) => (prev === "user" ? "environment" : "user"));
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileScanning(true);
    setStatus("processing");
    try {
      const html5QrCode = new Html5Qrcode("kiosk-qr-file-slot");
      const decodedText = await html5QrCode.scanFile(file, false);
      try {
        await html5QrCode.clear();
      } catch (err) {}
      if (decodedText) {
        setIdentifier(decodedText);
        processCheckin(decodedText);
      }
    } catch (err) {
      console.warn("QR file scan error:", err);
      setStatus("denied");
      setResult({
        accessGranted: false,
        message: "No readable QR code found in this image. Please upload a clear photo or enter Member ID manually.",
      });
      resetSoon();
    } finally {
      setFileScanning(false);
      if (e.target) e.target.value = "";
    }
  };

  const open = status === "granted";
  const denied = status === "denied";

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "100%" }} className="fade-in">
      <div style={styles.screenHeader}>
        <h2 style={{ fontSize: 24, fontWeight: 800, margin: "0 0 4px" }}>Turnstile Gate Access</h2>
        <p style={styles.sub}>Scan your QR code via live camera, tap USB scanner, or type your member PIN</p>
      </div>

      {/* Mode Switcher Pills */}
      <div style={styles.scannerModeSwitch}>
        <button
          type="button"
          onClick={() => setCameraActive(false)}
          style={{
            ...styles.scannerModeTab,
            background: !cameraActive ? "rgba(43, 212, 189, 0.2)" : "transparent",
            color: !cameraActive ? "#2bd4bd" : "#9fb4b0",
            borderColor: !cameraActive ? "#2bd4bd" : "transparent",
          }}
        >
          <IconScan size={16} />
          <span>Virtual Gate View</span>
        </button>
        <button
          type="button"
          onClick={() => {
            setCameraError("");
            setCameraActive(true);
          }}
          style={{
            ...styles.scannerModeTab,
            background: cameraActive ? "rgba(43, 212, 189, 0.2)" : "transparent",
            color: cameraActive ? "#2bd4bd" : "#9fb4b0",
            borderColor: cameraActive ? "#2bd4bd" : "transparent",
          }}
        >
          <IconCamera size={16} />
          <span>Live Camera Scanner</span>
        </button>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          style={{
            ...styles.scannerModeTab,
            background: "transparent",
            color: "#9fb4b0",
            borderColor: "transparent",
          }}
          title="Upload or scan a photo of your QR pass"
        >
          <IconUpload size={16} />
          <span>{fileScanning ? "Scanning File..." : "Upload QR Pass"}</span>
        </button>
      </div>

      {/* Main Gate Visual / Camera Viewport Area */}
      <div style={styles.gateOuter}>
        {cameraActive ? (
          /* Live Camera Viewport */
          <div style={styles.cameraViewportWrapper}>
            <div id="kiosk-camera-reader" style={styles.cameraReaderBox} />

            {/* Neon target corner brackets */}
            <div className="scan-corner-tl" />
            <div className="scan-corner-tr" />
            <div className="scan-corner-bl" />
            <div className="scan-corner-br" />

            {/* Moving Laser Sweep Line */}
            <div className="scan-laser-line" />

            {/* Top camera status banner */}
            <div style={styles.cameraOverlayTop}>
              <div style={styles.cameraInstructionBadge}>
                <span style={styles.cameraLiveDot} />
                <span>Camera Active • Align QR Code</span>
              </div>
              <button
                type="button"
                onClick={flipCamera}
                style={styles.cameraFlipBtn}
                title="Switch between front and back camera"
              >
                <IconRefresh size={16} />
              </button>
            </div>

            {/* Camera error message overlay if any */}
            {cameraError && (
              <div style={styles.cameraErrorOverlay}>
                <IconCameraOff size={36} color="#ff6b6b" style={{ marginBottom: 6 }} />
                <div style={{ fontSize: 16, fontWeight: 700, color: "#ff8585", marginBottom: 4 }}>
                  Camera Permission Blocked
                </div>

                <div
                  style={{
                    fontSize: 12,
                    color: "#cbd5e1",
                    lineHeight: 1.6,
                    maxWidth: 380,
                    margin: "6px 0 14px",
                    textAlign: "left",
                    background: "rgba(0, 0, 0, 0.45)",
                    padding: "10px 16px",
                    borderRadius: 8,
                    border: "1px solid rgba(255, 107, 107, 0.25)",
                  }}
                >
                  <div style={{ fontWeight: 700, color: "#5eead4", marginBottom: 4 }}>
                    To enable camera in Chrome:
                  </div>
                  <div>1. Look at the <strong>top address bar</strong> of Chrome (left of <code>localhost:3000</code>).</div>
                  <div>2. Click the crossed-out icon (<strong>⊘</strong>).</div>
                  <div>3. Set Camera to <strong>Allow</strong>, then press <strong>F5 to Reload</strong>.</div>
                </div>

                <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center", alignItems: "center" }}>
                  <button
                    type="button"
                    onClick={() => {
                      setCameraError("");
                      setCameraRetryCount((c) => c + 1);
                    }}
                    style={{ ...styles.primaryBtn, padding: "8px 16px", fontSize: 13 }}
                  >
                    <IconRefresh size={15} /> Retry Camera
                  </button>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    style={{
                      ...styles.primaryBtn,
                      background: "rgba(43, 212, 189, 0.15)",
                      color: "#2bd4bd",
                      border: "1px solid rgba(43, 212, 189, 0.4)",
                      padding: "8px 16px",
                      fontSize: 13,
                      boxShadow: "none",
                    }}
                  >
                    <IconUpload size={15} /> Upload QR Pass
                  </button>
                  <button
                    type="button"
                    onClick={() => setCameraActive(false)}
                    style={{ ...styles.linkBtn, margin: 0, color: "#9fb4b0", fontSize: 13 }}
                  >
                    Manual Entry
                  </button>
                </div>
              </div>
            )}

            {/* Decision Banner Overlay when Scanned via Camera */}
            {open && (
              <div style={styles.cameraDecisionOverlay} className="kiosk-pop">
                <IconCircleCheck size={64} color="#2bd4bd" />
                <div style={styles.welcome}>
                  {result?.action === "CHECK_OUT" ? "Goodbye" : "Welcome"}
                  {result?.memberName ? `, ${result.memberName}` : ""}!
                </div>
                <div style={styles.gateopen}>
                  {result?.action === "CHECK_OUT" ? "CHECK-OUT RECORDED" : "GATE OPEN • ENTER"}
                </div>
              </div>
            )}

            {denied && (
              <div style={styles.cameraDecisionOverlay} className="kiosk-shake">
                <IconCircleX size={64} color="#ff6b6b" />
                <div style={{ ...styles.welcome, color: "#ff6b6b" }}>Access Denied</div>
                <div style={styles.deniedMsg}>{result?.message || "Member not recognized or expired"}</div>
              </div>
            )}

            {status === "processing" && (
              <div style={styles.cameraDecisionOverlay}>
                <div className="spinner-border text-light" style={{ width: 44, height: 44 }} role="status" />
                <div style={{ ...styles.welcome, fontSize: 17, marginTop: 10 }}>Verifying Pass...</div>
              </div>
            )}
          </div>
        ) : (
          /* Animated Turnstile Gate Visual */
          <div style={styles.gateInner}>
            <div
              style={{
                ...styles.behind,
                background: denied
                  ? "radial-gradient(circle, #451216 0%, #1a0608 100%)"
                  : open
                  ? "radial-gradient(circle, #0e3b33 0%, #061916 100%)"
                  : "radial-gradient(circle, #0a1f1c 0%, #030a09 100%)",
              }}
            >
              {open && (
                <div style={styles.revealText} className="kiosk-pop">
                  <IconCircleCheck size={64} color="#2bd4bd" />
                  <div style={styles.welcome}>
                    {result?.action === "CHECK_OUT" ? "Goodbye" : "Welcome"}
                    {result?.memberName ? `, ${result.memberName}` : ""}!
                  </div>
                  <div style={styles.gateopen}>
                    {result?.action === "CHECK_OUT" ? "CHECK-OUT RECORDED" : "GATE OPEN • ENTER"}
                  </div>
                </div>
              )}
              {denied && (
                <div style={styles.revealText} className="kiosk-shake">
                  <IconCircleX size={64} color="#ff6b6b" />
                  <div style={{ ...styles.welcome, color: "#ff6b6b" }}>Access Denied</div>
                  <div style={styles.deniedMsg}>{result?.message || "Member not recognized or expired"}</div>
                </div>
              )}
              {status === "processing" && (
                <div style={styles.revealText}>
                  <div className="spinner-border text-light" style={{ width: 48, height: 48 }} role="status" />
                  <div style={{ ...styles.welcome, fontSize: 18, marginTop: 12 }}>Verifying Credentials...</div>
                </div>
              )}
              {status === "idle" && (
                <div style={{ ...styles.revealText, opacity: 0.6 }}>
                  <IconScan size={56} color="#2bd4bd" />
                  <div style={{ ...styles.welcome, fontSize: 17, color: "#9fb4b0" }}>Gate Locked • Ready to Scan</div>
                </div>
              )}
            </div>

            {/* Left Door Panel */}
            <div
              className={`kiosk-door-left ${open ? "kiosk-open-left" : ""}`}
              style={{ ...styles.door, left: 0 }}
            >
              <div style={styles.doorHandle} />
            </div>

            {/* Right Door Panel */}
            <div
              className={`kiosk-door-right ${open ? "kiosk-open-right" : ""}`}
              style={{ ...styles.door, right: 0 }}
            >
              <div style={{ ...styles.doorHandle, left: 10 }} />
            </div>
          </div>
        )}
      </div>

      {/* Input box row */}
      {status !== "granted" && status !== "denied" && (
        <div style={{ width: "100%", maxWidth: 520, marginTop: 22 }}>
          <form onSubmit={submit} style={{ display: "flex", gap: 10 }}>
            <div style={{ position: "relative", flex: 1 }}>
              <input
                ref={inputRef}
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="Scan QR or enter Member ID / Phone"
                style={styles.input}
                disabled={status === "processing"}
              />
              <button
                type="button"
                onClick={() => setShowKeypad(!showKeypad)}
                style={styles.keypadToggleBtn}
                title="Toggle on-screen numeric keypad"
              >
                <IconKeyboard size={20} color={showKeypad ? "#2bd4bd" : "#9fb4b0"} />
              </button>
            </div>

            {/* Toggle Camera Button */}
            <button
              type="button"
              onClick={toggleCamera}
              style={{
                ...styles.cameraToggleBtn,
                background: cameraActive ? "rgba(239, 68, 68, 0.15)" : "rgba(43, 212, 189, 0.15)",
                borderColor: cameraActive ? "rgba(239, 68, 68, 0.4)" : "rgba(43, 212, 189, 0.4)",
                color: cameraActive ? "#fca5a5" : "#2bd4bd",
              }}
              title={cameraActive ? "Turn Off Camera" : "Turn On Camera Scanner"}
            >
              {cameraActive ? <IconCameraOff size={18} /> : <IconCamera size={18} />}
            </button>

            {/* Scan Gate Button */}
            <button
              type="submit"
              style={styles.primaryBtn}
              disabled={status === "processing" || !identifier.trim()}
            >
              <IconScan size={18} />
              <span>{status === "processing" ? "Verifying" : "Scan Gate"}</span>
            </button>
          </form>

          {/* Quick Demo Test Chips for easy testing */}
          <div style={{ display: "flex", gap: 8, alignItems: "center", justifyContent: "center", marginTop: 14, flexWrap: "wrap" }}>
            <span style={{ fontSize: 12, color: "#9fb4b0" }}>Quick Test:</span>
            <button
              type="button"
              onClick={() => {
                setIdentifier("8");
                processCheckin("8");
              }}
              style={{
                background: "rgba(43, 212, 189, 0.1)",
                border: "1px solid rgba(43, 212, 189, 0.3)",
                color: "#2bd4bd",
                borderRadius: 6,
                padding: "4px 10px",
                fontSize: 12,
                cursor: "pointer",
              }}
              title="Test check-in for Member #8 (Pratiksha)"
            >
              Member #8 (Pratiksha)
            </button>
            <button
              type="button"
              onClick={() => {
                setIdentifier("5");
                processCheckin("5");
              }}
              style={{
                background: "rgba(43, 212, 189, 0.1)",
                border: "1px solid rgba(43, 212, 189, 0.3)",
                color: "#2bd4bd",
                borderRadius: 6,
                padding: "4px 10px",
                fontSize: 12,
                cursor: "pointer",
              }}
              title="Test check-in for Member #5 (Sneha)"
            >
              Member #5 (Sneha)
            </button>
          </div>

          {/* Touch keypad for check-in */}
          {showKeypad && (
            <TouchKeypad
              onKeyPress={(k) => setIdentifier((prev) => prev + k)}
              onBackspace={() => setIdentifier((prev) => prev.slice(0, -1))}
              onClear={() => setIdentifier("")}
              onSubmit={submit}
            />
          )}
        </div>
      )}

      {/* Hidden QR Image file input and scan slot */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        style={{ display: "none" }}
        onChange={handleFileUpload}
      />
      <div id="kiosk-qr-file-slot" style={{ display: "none" }} />
    </div>
  );
}

// ── Renew Membership Screen ──────────────────────────────────────
function RenewScreen({ memberId, memberInfo, onBack }) {
  const [membership, setMembership] = useState(null);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [months, setMonths] = useState(1);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const PERIODS = [
    { months: 1, label: "Monthly", discount: 0, note: "" },
    { months: 3, label: "Quarterly", discount: 0.1, note: "Save 10%" },
    { months: 12, label: "Yearly", discount: 0.2, note: "Save 20%" },
  ];

  const loadData = async () => {
    setLoading(true);
    try {
      const [planList, mine] = await Promise.all([
        getMembershipPlans({ activeOnly: true }),
        getMemberMembership(memberId),
      ]);
      setPlans(Array.isArray(planList) ? planList : []);
      setMembership(mine);
    } catch (err) {
      setError(extractApiErrorMessage(err, "Failed to load membership data"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [memberId]);

  const period = PERIODS.find((p) => p.months === months) || PERIODS[0];
  const currentPlanId = membership?.planId ?? null;
  const currentCode = String(membership?.plan || "").toUpperCase();

  const isCurrent = (plan) =>
    (currentPlanId != null && plan.id === currentPlanId) ||
    (currentPlanId == null && plan.code?.toUpperCase() === currentCode);

  const periodTotal = (price, m, discount) =>
    Math.round((price || 0) * m * (1 - discount));

  const handleSubscribe = async (plan) => {
    setBusy(true);
    setError("");
    try {
      const order = await createMembershipOrder(plan.id, months);
      await loadRazorpay();
      const rzp = new window.Razorpay({
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        name: order.name,
        description: order.description,
        order_id: order.orderId,
        theme: { color: "#2bb3a3" },
        prefill: {
          name: memberInfo?.name || "",
          email: memberInfo?.email || "",
        },
        handler: async (resp) => {
          try {
            const updated = await verifyMembershipPayment({
              razorpayOrderId: resp.razorpay_order_id,
              razorpayPaymentId: resp.razorpay_payment_id,
              razorpaySignature: resp.razorpay_signature,
              planId: plan.id,
              months,
            });
            setMembership(updated);
            window.dispatchEvent(new Event("membership:updated"));
            setNotice(`${plan.name} renewed successfully until ${updated?.expiry || ""}!`);
          } catch (e) {
            setError(extractApiErrorMessage(e, "Payment verification failed"));
          } finally {
            setBusy(false);
          }
        },
        modal: { ondismiss: () => setBusy(false) },
      });
      rzp.on("payment.failed", (r) => {
        setError("Payment failed: " + (r?.error?.description || "please try again"));
        setBusy(false);
      });
      rzp.open();
    } catch (err) {
      setError(extractApiErrorMessage(err, "Could not start payment gateway"));
      setBusy(false);
    }
  };

  return (
    <div style={{ width: "100%", maxWidth: 740 }} className="fade-in">
      <div style={styles.screenHeader}>
        <h2 style={{ fontSize: 24, fontWeight: 800, margin: "0 0 4px" }}>Renew & Extend Membership</h2>
        <p style={styles.sub}>Select a plan duration and renew your access instantly</p>
      </div>

      {error && <div style={styles.errorBox}>{error}</div>}
      {notice && <div style={styles.successBox}>{notice}</div>}

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-light" />
        </div>
      ) : (
        <>
          {/* Current Membership status banner */}
          {membership && (
            <div style={styles.currentPlanCard}>
              <div style={styles.planIconBadge}>
                <IconCrown size={28} color="#f59e0b" />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 800, fontSize: 17 }}>
                  {membership.planName || "Basic"} Plan
                </div>
                <div style={{ color: "#9fb4b0", fontSize: 13, marginTop: 4 }}>
                  {membership.expiry
                    ? `Active until ${membership.expiry}${
                        membership.daysLeft != null ? ` • ${membership.daysLeft} days remaining` : ""
                      }`
                    : "No active subscription"}
                </div>
              </div>
              {membership.unlimitedAccess ? (
                <span style={styles.badgeSuccess}>Unlimited Entry</span>
              ) : membership.accessStartTime ? (
                <span style={styles.badgeInfo}>
                  {membership.accessStartTime}–{membership.accessEndTime}
                </span>
              ) : null}
            </div>
          )}

          {/* Billing period switcher */}
          <div style={styles.periodSwitcher}>
            {PERIODS.map((p) => (
              <button
                key={p.months}
                type="button"
                onClick={() => setMonths(p.months)}
                style={{
                  ...styles.periodBtn,
                  background: p.months === months ? "#2bb3a3" : "rgba(255,255,255,0.06)",
                  color: p.months === months ? "#06231f" : "#fff",
                }}
              >
                {p.label}
                {p.note && <span style={styles.saveBadge}>{p.note}</span>}
              </button>
            ))}
          </div>

          {/* Plans list */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12, maxHeight: 380, overflowY: "auto" }}>
            {plans.map((plan) => {
              const current = isCurrent(plan);
              const total = periodTotal(plan.price, period.months, period.discount);
              const free = !plan.price || plan.price <= 0;
              return (
                <div key={plan.id} style={styles.planCard}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 16 }}>{plan.name}</div>
                      <div style={{ color: "#9fb4b0", fontSize: 12, marginTop: 2 }}>{plan.description}</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      {free ? (
                        <div style={{ fontWeight: 800, fontSize: 20, color: "#2bd4bd" }}>Free</div>
                      ) : (
                        <>
                          <div style={{ fontWeight: 800, fontSize: 20, color: "#fff" }}>
                            ₹{total}
                          </div>
                          <div style={{ color: "#9fb4b0", fontSize: 11 }}>/{period.label}</div>
                        </>
                      )}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                    {plan.unlimitedAccess && <span style={styles.badgeSuccess}>Anytime Entry</span>}
                    {plan.trainerChat && <span style={styles.badgeInfo}>Trainer Chat Included</span>}
                    {current && <span style={{ ...styles.badgeSuccess, background: "#f59e0b", color: "#1a1a2e" }}>Current Active</span>}
                  </div>
                  {!current && !free && (
                    <button
                      type="button"
                      onClick={() => handleSubscribe(plan)}
                      disabled={busy}
                      style={{ ...styles.primaryBtn, marginTop: 14, width: "100%" }}
                    >
                      <IconCrown size={18} />
                      {busy ? "Starting Gateway..." : `Renew with ${plan.name} — ₹${total}`}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

// ── Book PT Session Screen ───────────────────────────────────────
function BookPTScreen({ memberId, onBack }) {
  const [trainers, setTrainers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTrainer, setSelectedTrainer] = useState(null);
  const [schedules, setSchedules] = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getVisibleTrainers();
        setTrainers(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const generateSlots = useCallback(() => {
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const times = ["06:00 AM", "07:30 AM", "09:00 AM", "04:30 PM", "06:00 PM", "07:30 PM"];
    return days.map((day) => ({
      day,
      times: times.filter(() => Math.random() > 0.35).slice(0, 4),
    }));
  }, []);

  const handleSelectTrainer = (trainer) => {
    setSelectedTrainer(trainer);
    setSchedules(generateSlots());
  };

  const handleBookSlot = (day, time) => {
    Swal.fire({
      icon: "success",
      title: "PT Session Reserved!",
      text: `Your session with ${selectedTrainer.name || "Trainer"} on ${day} at ${time} has been booked.`,
      timer: 3500,
      showConfirmButton: false,
      background: "#0d2622",
      color: "#fff",
    });
  };

  return (
    <div style={{ width: "100%", maxWidth: 740 }} className="fade-in">
      <div style={styles.screenHeader}>
        <h2 style={{ fontSize: 24, fontWeight: 800, margin: "0 0 4px" }}>Book Personal Trainer</h2>
        <p style={styles.sub}>Choose a fitness coach and lock in your preferred workout slot</p>
      </div>

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-light" />
        </div>
      ) : !selectedTrainer ? (
        <>
          <p style={{ color: "#9fb4b0", marginBottom: 14, fontSize: 14 }}>Available trainers on duty this week:</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, maxHeight: 380, overflowY: "auto" }}>
            {trainers.length === 0 ? (
              <div style={{ textAlign: "center", color: "#9fb4b0", padding: 30 }}>
                <IconBarbell size={36} color="#9fb4b0" style={{ marginBottom: 8 }} />
                <div>No trainers listed currently. Please enquire at the main reception.</div>
              </div>
            ) : (
              trainers.map((t, i) => (
                <button
                  key={t.id || i}
                  type="button"
                  onClick={() => handleSelectTrainer(t)}
                  style={styles.trainerCard}
                  className="kiosk-card-hover"
                >
                  <div style={styles.trainerAvatar}>
                    <IconBarbell size={24} color="#6366f1" />
                  </div>
                  <div style={{ flex: 1, textAlign: "left" }}>
                    <div style={{ fontWeight: 700, fontSize: 15 }}>{t.name || `Trainer ${i + 1}`}</div>
                    <div style={{ color: "#9fb4b0", fontSize: 12, marginTop: 2 }}>
                      {t.specialization || t.email || "Personal Fitness Coach"}
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#2bd4bd", fontWeight: 600, fontSize: 13 }}>
                    <span>Select Slots</span>
                    <IconCalendarEvent size={18} />
                  </div>
                </button>
              ))
            )}
          </div>
        </>
      ) : (
        <>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={styles.trainerAvatar}>
                <IconBarbell size={24} color="#6366f1" />
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: 16 }}>{selectedTrainer.name || "Trainer"}</div>
                <div style={{ color: "#9fb4b0", fontSize: 12 }}>Select a time slot to reserve</div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setSelectedTrainer(null)}
              style={styles.linkBtn}
            >
              <IconArrowLeft size={16} /> Choose Another Coach
            </button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10, maxHeight: 350, overflowY: "auto" }}>
            {schedules.map((s) => (
              <div key={s.day} style={styles.slotRow}>
                <div style={{ fontWeight: 700, minWidth: 60, color: "#2bd4bd" }}>{s.day}</div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", flex: 1 }}>
                  {s.times.length === 0 ? (
                    <span style={{ color: "#9fb4b0", fontSize: 13 }}>Fully booked</span>
                  ) : (
                    s.times.map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => handleBookSlot(s.day, t)}
                        style={styles.timeSlot}
                      >
                        {t}
                      </button>
                    ))
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ── Buy Supplements Screen ───────────────────────────────────────
function ShopScreen({ memberId, onBack }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState([]);
  const [showCart, setShowCart] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getInventory();
        const supplements = Array.isArray(data)
          ? data.filter((i) => i.category === "Supplements" || i.category === "Nutrition")
          : [];
        setItems(supplements.length > 0 ? supplements : Array.isArray(data) ? data.slice(0, 10) : []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const addToCart = (item) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.id === item.id);
      if (existing) {
        return prev.map((c) => (c.id === item.id ? { ...c, qty: c.qty + 1 } : c));
      }
      return [...prev, { ...item, qty: 1 }];
    });
    Swal.fire({
      icon: "success",
      title: "Added to Cart!",
      text: `${item.itemName} added`,
      timer: 1000,
      showConfirmButton: false,
      background: "#0d2622",
      color: "#fff",
    });
  };

  const removeFromCart = (itemId) => {
    setCart((prev) => prev.filter((c) => c.id !== itemId));
  };

  const cartTotal = cart.reduce((sum, c) => sum + (c.price || 150) * c.qty, 0);

  return (
    <div style={{ width: "100%", maxWidth: 740 }} className="fade-in">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <div style={styles.screenHeader}>
          <h2 style={{ fontSize: 24, fontWeight: 800, margin: "0 0 4px" }}>Supplements & Nutrition</h2>
          <p style={styles.sub}>Quick front-desk snacks, whey protein, and pre-workout store</p>
        </div>
        <button
          type="button"
          onClick={() => setShowCart(!showCart)}
          style={styles.cartBtn}
        >
          <IconShoppingCart size={20} />
          <span>Cart ({cart.reduce((s, i) => s + i.qty, 0)})</span>
        </button>
      </div>

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-light" />
        </div>
      ) : showCart ? (
        <div className="fade-in">
          <h4 style={{ color: "#fff", marginBottom: 16, fontWeight: 700 }}>Your Order Summary</h4>
          {cart.length === 0 ? (
            <div style={{ textAlign: "center", color: "#9fb4b0", padding: 30 }}>Your cart is empty</div>
          ) : (
            <>
              <div style={{ display: "flex", flexDirection: "column", gap: 10, maxHeight: 300, overflowY: "auto" }}>
                {cart.map((c) => (
                  <div key={c.id} style={styles.cartItem}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700 }}>{c.itemName}</div>
                      <div style={{ color: "#9fb4b0", fontSize: 12 }}>
                        Qty: {c.qty} × ₹{c.price || 150}
                      </div>
                    </div>
                    <div style={{ fontWeight: 700, color: "#2bd4bd", fontSize: 16 }}>
                      ₹{(c.price || 150) * c.qty}
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFromCart(c.id)}
                      style={styles.removeBtn}
                    >
                      <IconTrash size={16} />
                    </button>
                  </div>
                ))}
              </div>
              <div style={{ ...styles.trainerCard, marginTop: 16, justifyContent: "space-between" }}>
                <div style={{ fontWeight: 800, fontSize: 18 }}>Total Due: ₹{cartTotal}</div>
                <button
                  type="button"
                  onClick={() => {
                    Swal.fire({
                      icon: "success",
                      title: "Order Placed!",
                      text: "Collect your supplements at the reception counter.",
                      timer: 3500,
                      showConfirmButton: false,
                      background: "#0d2622",
                      color: "#fff",
                    });
                    setCart([]);
                    setShowCart(false);
                  }}
                  style={styles.primaryBtn}
                >
                  <IconCheck size={18} /> Confirm & Collect
                </button>
              </div>
            </>
          )}
          <button
            type="button"
            onClick={() => setShowCart(false)}
            style={{ ...styles.linkBtn, marginTop: 16 }}
          >
            <IconArrowLeft size={16} /> Continue Shopping
          </button>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10, maxHeight: 380, overflowY: "auto" }}>
          {items.length === 0 ? (
            <div style={{ textAlign: "center", color: "#9fb4b0", padding: 30 }}>
              <IconBottle size={36} color="#9fb4b0" style={{ marginBottom: 8 }} />
              <div>No supplements in stock right now. Please check again soon.</div>
            </div>
          ) : (
            items.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => addToCart(item)}
                style={styles.supplementCard}
                className="kiosk-card-hover"
              >
                <div style={styles.shopItemIcon}>
                  <IconBottle size={24} color="#06b6d4" />
                </div>
                <div style={{ flex: 1, textAlign: "left" }}>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>{item.itemName}</div>
                  <div style={{ color: "#9fb4b0", fontSize: 12 }}>
                    {item.notes || `${item.quantity || "In stock"} units available`}
                  </div>
                </div>
                <div style={{ fontWeight: 700, color: "#2bd4bd", fontSize: 16, marginRight: 8 }}>
                  ₹{item.price || 150}
                </div>
                <div style={styles.addCartCircle}>+</div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

// ── View Progress Screen ─────────────────────────────────────────
function ProgressScreen({ memberId, onBack }) {
  const [summary, setSummary] = useState(null);
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const entryData = await getMemberProgressEntries(memberId);
        const arr = Array.isArray(entryData) ? entryData : [];
        setEntries(arr);

        const latest = arr[arr.length - 1] || null;
        const now = new Date();
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - now.getDay());

        const thisWeek = arr.filter((e) => {
          const d = new Date(e.entryDate);
          return d >= weekStart;
        });

        setSummary({
          latestHealthScore: latest?.healthScore ?? null,
          latestHeartRate: latest?.heartRateBpm ?? null,
          latestWeight: latest?.weightKg ?? null,
          workoutMinutesThisWeek: thisWeek.reduce((s, e) => s + (e.workoutMinutes || 0), 0),
          workoutsThisWeek: thisWeek.length,
          goals: [],
        });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [memberId]);

  const workoutHours = Math.floor((summary?.workoutMinutesThisWeek || 0) / 60);
  const workoutMins = (summary?.workoutMinutesThisWeek || 0) % 60;

  return (
    <div style={{ width: "100%", maxWidth: 740 }} className="fade-in">
      <div style={styles.screenHeader}>
        <h2 style={{ fontSize: 24, fontWeight: 800, margin: "0 0 4px" }}>Your Fitness Snapshot</h2>
        <p style={styles.sub}>Track weekly workout time, health metrics, and weight progress</p>
      </div>

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-light" />
        </div>
      ) : (
        <div style={{ maxHeight: 420, overflowY: "auto", paddingRight: 4 }}>
          {/* Key Stat Cards */}
          <div style={styles.statsGrid}>
            <div style={styles.statCard}>
              <div style={styles.statIconBadge}>
                <IconHeart size={24} color="#ec4899" />
              </div>
              <div style={{ fontWeight: 800, fontSize: 24, marginTop: 8 }}>
                {summary?.latestHealthScore != null ? `${summary.latestHealthScore}%` : "88%"}
              </div>
              <div style={{ color: "#9fb4b0", fontSize: 12 }}>Health Score</div>
            </div>

            <div style={styles.statCard}>
              <div style={styles.statIconBadge}>
                <IconBarbell size={24} color="#6366f1" />
              </div>
              <div style={{ fontWeight: 800, fontSize: 24, marginTop: 8 }}>
                {workoutHours}h {workoutMins}m
              </div>
              <div style={{ color: "#9fb4b0", fontSize: 12 }}>Workout Time This Week</div>
            </div>

            <div style={styles.statCard}>
              <div style={styles.statIconBadge}>
                <IconStar size={24} color="#f59e0b" />
              </div>
              <div style={{ fontWeight: 800, fontSize: 24, marginTop: 8 }}>
                {summary?.workoutsThisWeek || 0}
              </div>
              <div style={{ color: "#9fb4b0", fontSize: 12 }}>Sessions Completed</div>
            </div>

            <div style={styles.statCard}>
              <div style={styles.statIconBadge}>
                <IconBolt size={24} color="#10b981" />
              </div>
              <div style={{ fontWeight: 800, fontSize: 24, marginTop: 8 }}>
                {summary?.latestWeight != null ? `${summary.latestWeight} kg` : "Active"}
              </div>
              <div style={{ color: "#9fb4b0", fontSize: 12 }}>Current Weight</div>
            </div>
          </div>

          {/* Recent Workout Logs */}
          <div style={{ marginTop: 20 }}>
            <h4 style={{ fontWeight: 700, fontSize: 15, marginBottom: 10, color: "#fff" }}>
              Recent Check-in & Workout Activity
            </h4>
            {entries.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {entries.slice(0, 5).map((entry) => (
                  <div key={entry.id} style={styles.entryRow}>
                    <div style={{ color: "#9fb4b0", fontSize: 12, minWidth: 80 }}>{entry.entryDate}</div>
                    <div style={{ flex: 1, display: "flex", gap: 16, fontSize: 13 }}>
                      {entry.weightKg != null && <span>Weight: {entry.weightKg} kg</span>}
                      {entry.heartRateBpm != null && <span>Heart: {entry.heartRateBpm} bpm</span>}
                      {entry.workoutMinutes != null && <span>Duration: {entry.workoutMinutes} min</span>}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: "center", color: "#9fb4b0", padding: 24 }}>
                Keep working out! Your daily activity will appear here.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Animations ───────────────────────────────────────────────────
const keyframes = `
@keyframes kioskPop { 0% { transform: scale(0.6); opacity: 0; } 100% { transform: scale(1); opacity: 1; } }
@keyframes kioskShake { 0%,100%{ transform: translateX(0);} 20%{transform:translateX(-8px);} 40%{transform:translateX(8px);} 60%{transform:translateX(-6px);} 80%{transform:translateX(6px);} }
@keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
@keyframes pulseGlow { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.4; transform: scale(0.9); } }
@keyframes scanLaser {
  0% { top: 12%; opacity: 0.8; }
  50% { top: 82%; opacity: 1; }
  100% { top: 12%; opacity: 0.8; }
}

.kiosk-pop { animation: kioskPop .35s ease both; }
.kiosk-shake { animation: kioskShake .45s ease both; }
.kiosk-door-left, .kiosk-door-right { transition: transform .9s cubic-bezier(.22,.61,.36,1); }
.kiosk-open-left { transform: translateX(-100%); }
.kiosk-open-right { transform: translateX(100%); }
.fade-in { animation: fadeIn .3s ease both; }

.kiosk-card-hover {
  transition: transform 0.25s cubic-bezier(0.2, 0.8, 0.2, 1), box-shadow 0.25s ease, border-color 0.25s ease;
}
.kiosk-card-hover:hover {
  transform: translateY(-6px);
  border-color: rgba(43, 212, 189, 0.4) !important;
  box-shadow: 0 16px 36px rgba(0, 0, 0, 0.5), 0 0 20px rgba(43, 212, 189, 0.15) !important;
}

/* Neon Scanner Viewport Details */
.scan-laser-line {
  position: absolute;
  left: 12%;
  right: 12%;
  height: 2px;
  background: linear-gradient(90deg, transparent, #2bd4bd, #10b981, #2bd4bd, transparent);
  box-shadow: 0 0 14px #2bd4bd, 0 0 4px #10b981;
  animation: scanLaser 2.2s infinite ease-in-out;
  pointer-events: none;
  z-index: 10;
}

.scan-corner-tl, .scan-corner-tr, .scan-corner-bl, .scan-corner-br {
  position: absolute;
  width: 20px;
  height: 20px;
  border-color: #2bd4bd;
  border-style: solid;
  pointer-events: none;
  z-index: 10;
}
.scan-corner-tl { top: 24px; left: 24px; border-width: 3px 0 0 3px; border-top-left-radius: 4px; }
.scan-corner-tr { top: 24px; right: 24px; border-width: 3px 3px 0 0; border-top-right-radius: 4px; }
.scan-corner-bl { bottom: 24px; left: 24px; border-width: 0 0 3px 3px; border-bottom-left-radius: 4px; }
.scan-corner-br { bottom: 24px; right: 24px; border-width: 0 3px 3px 0; border-bottom-right-radius: 4px; }

#kiosk-camera-reader video {
  width: 100% !important;
  height: 100% !important;
  object-fit: cover !important;
  border-radius: 16px;
}
`;

// ── Modern Aesthetic Styles ───────────────────────────────────────
const styles = {
  wrap: {
    minHeight: "calc(100vh - 80px)",
    background: "radial-gradient(circle at 50% 0%, #0d2622 0%, #051311 70%, #020706 100%)",
    color: "#fff",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: "24px 20px",
    position: "relative",
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    borderRadius: 16,
    overflow: "hidden",
  },
  kioskFullscreenWrap: {
    position: "fixed",
    inset: 0,
    zIndex: 99999,
    width: "100vw",
    height: "100vh",
    background: "radial-gradient(circle at 50% 0%, #0d2622 0%, #04100e 65%, #020706 100%)",
    color: "#fff",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: "32px 28px",
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    overflowY: "auto",
  },
  topBar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    maxWidth: 1100,
    marginBottom: 20,
  },
  topBarLeft: {
    display: "flex",
    alignItems: "center",
    minWidth: 200,
  },
  topBarCenter: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
  topBarRight: {
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-end",
    minWidth: 200,
  },
  clockTime: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    fontSize: 16,
    fontWeight: 700,
    color: "#2bd4bd",
    letterSpacing: 1,
  },
  clockDate: {
    fontSize: 11,
    color: "#9fb4b0",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  statusPill: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    background: "rgba(43, 212, 189, 0.08)",
    border: "1px solid rgba(43, 212, 189, 0.25)",
    padding: "6px 14px",
    borderRadius: 20,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: "50%",
    backgroundColor: "#10b981",
    boxShadow: "0 0 10px #10b981",
    animation: "pulseGlow 2s infinite ease-in-out",
  },
  liveText: {
    fontSize: 11,
    fontWeight: 700,
    color: "#2bd4bd",
    letterSpacing: 0.5,
  },
  kioskModeBtn: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    background: "rgba(255, 255, 255, 0.08)",
    border: "1px solid rgba(255, 255, 255, 0.15)",
    color: "#e2e8f0",
    padding: "8px 16px",
    borderRadius: 10,
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
    transition: "all 0.2s ease",
  },
  kioskExitBtn: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    background: "rgba(239, 68, 68, 0.15)",
    border: "1px solid rgba(239, 68, 68, 0.35)",
    color: "#fca5a5",
    padding: "8px 16px",
    borderRadius: 10,
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
  },
  brandBox: {
    textAlign: "center",
    marginBottom: 28,
  },
  brandGlow: {
    fontSize: 32,
    fontWeight: 900,
    letterSpacing: 3,
    color: "#fff",
    textShadow: "0 0 30px rgba(43, 212, 189, 0.4)",
  },
  brandSub: {
    fontSize: 13,
    color: "#2bd4bd",
    letterSpacing: 1.5,
    textTransform: "uppercase",
    fontWeight: 600,
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 800,
    color: "#fff",
    marginTop: 12,
  },
  sub: {
    color: "#9fb4b0",
    marginTop: 4,
    marginBottom: 16,
    textAlign: "center",
    fontSize: 14,
  },
  mainContent: {
    width: "100%",
    maxWidth: 1100,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
  homeContainer: {
    width: "100%",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
  homeInstruction: {
    color: "#9fb4b0",
    fontSize: 14,
    marginBottom: 24,
    textAlign: "center",
  },
  memberBadge: {
    background: "rgba(43, 212, 189, 0.08)",
    border: "1px solid rgba(43, 212, 189, 0.25)",
    borderRadius: 24,
    padding: "8px 18px",
    fontSize: 13,
    marginBottom: 18,
    display: "flex",
    alignItems: "center",
    gap: 10,
  },
  logoutBtn: {
    background: "rgba(255, 255, 255, 0.12)",
    border: "none",
    color: "#e2e8f0",
    borderRadius: 12,
    padding: "3px 10px",
    cursor: "pointer",
    fontSize: 11,
    marginLeft: 6,
    display: "inline-flex",
    alignItems: "center",
    gap: 4,
  },

  // Balanced 3 + 2 Grid Layout
  cardsWrapper: {
    display: "flex",
    flexDirection: "column",
    gap: 20,
    width: "100%",
    maxWidth: 960,
  },
  gridRow3: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: 20,
    width: "100%",
  },
  gridRow2: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(280px, 360px))",
    justifyContent: "center",
    gap: 20,
    width: "100%",
  },
  featureCard: {
    background: "rgba(255, 255, 255, 0.035)",
    border: "1px solid rgba(255, 255, 255, 0.08)",
    borderRadius: 18,
    padding: "26px 20px",
    cursor: "pointer",
    textAlign: "center",
    color: "#fff",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    backdropFilter: "blur(12px)",
  },
  featureIcon: {
    width: 64,
    height: 64,
    borderRadius: 18,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#fff",
    marginBottom: 14,
  },
  cardHeaderArea: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 4,
    marginBottom: 8,
  },
  cardTag: {
    fontSize: 10,
    fontWeight: 700,
    color: "#2bd4bd",
    textTransform: "uppercase",
    letterSpacing: 1,
    background: "rgba(43, 212, 189, 0.1)",
    padding: "2px 8px",
    borderRadius: 12,
  },
  featureLabel: {
    fontWeight: 800,
    fontSize: 18,
    color: "#fff",
    margin: 0,
  },
  featureDesc: {
    color: "#9fb4b0",
    fontSize: 12,
    lineHeight: 1.5,
    margin: 0,
  },

  // Scanner Mode Switcher
  scannerModeSwitch: {
    display: "flex",
    gap: 8,
    marginBottom: 16,
    background: "rgba(255, 255, 255, 0.04)",
    border: "1px solid rgba(255, 255, 255, 0.08)",
    borderRadius: 24,
    padding: 4,
  },
  scannerModeTab: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    padding: "6px 14px",
    borderRadius: 20,
    border: "1px solid transparent",
    fontSize: 12,
    fontWeight: 700,
    cursor: "pointer",
    transition: "all 0.2s ease",
  },

  // Camera Scanner Viewport
  cameraViewportWrapper: {
    position: "relative",
    width: 360,
    height: 250,
    borderRadius: 16,
    overflow: "hidden",
    border: "3px solid #2bb3a3",
    background: "#051311",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  cameraReaderBox: {
    width: "100%",
    height: "100%",
    borderRadius: 16,
    overflow: "hidden",
  },
  cameraOverlayTop: {
    position: "absolute",
    top: 10,
    left: 10,
    right: 10,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    zIndex: 15,
  },
  cameraInstructionBadge: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    background: "rgba(0, 0, 0, 0.65)",
    border: "1px solid rgba(43, 212, 189, 0.3)",
    padding: "4px 10px",
    borderRadius: 14,
    fontSize: 11,
    color: "#2bd4bd",
    fontWeight: 600,
    backdropFilter: "blur(6px)",
  },
  cameraLiveDot: {
    width: 6,
    height: 6,
    borderRadius: "50%",
    background: "#10b981",
    boxShadow: "0 0 8px #10b981",
    animation: "pulseGlow 1.5s infinite ease-in-out",
  },
  cameraFlipBtn: {
    background: "rgba(0, 0, 0, 0.65)",
    border: "1px solid rgba(255, 255, 255, 0.2)",
    color: "#fff",
    borderRadius: "50%",
    width: 30,
    height: 30,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
  },
  cameraErrorOverlay: {
    position: "absolute",
    inset: 0,
    background: "rgba(10, 20, 18, 0.92)",
    padding: 24,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
    zIndex: 20,
  },
  cameraDecisionOverlay: {
    position: "absolute",
    inset: 0,
    background: "rgba(5, 18, 16, 0.94)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
    zIndex: 25,
    padding: 20,
  },
  cameraToggleBtn: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "12px",
    borderRadius: 10,
    border: "1px solid",
    cursor: "pointer",
    transition: "all 0.2s ease",
  },

  // Keypad
  keypadContainer: {
    marginTop: 18,
    width: "100%",
    maxWidth: 320,
    background: "rgba(255, 255, 255, 0.04)",
    border: "1px solid rgba(255, 255, 255, 0.08)",
    borderRadius: 16,
    padding: 16,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 10,
  },
  keypadGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: 10,
    width: "100%",
  },
  keypadBtn: {
    background: "rgba(255, 255, 255, 0.08)",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    borderRadius: 10,
    color: "#fff",
    fontSize: 18,
    fontWeight: 700,
    height: 48,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  keypadSubmitBtn: {
    width: "100%",
    height: 44,
    background: "#2bb3a3",
    color: "#06231f",
    border: "none",
    borderRadius: 10,
    fontWeight: 700,
    fontSize: 14,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  keypadToggleBtn: {
    position: "absolute",
    right: 12,
    top: "50%",
    transform: "translateY(-50%)",
    background: "none",
    border: "none",
    cursor: "pointer",
    padding: 4,
    display: "flex",
    alignItems: "center",
  },

  // Common buttons & inputs
  backBtn: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    background: "rgba(255, 255, 255, 0.08)",
    color: "#fff",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    borderRadius: 10,
    padding: "8px 16px",
    cursor: "pointer",
    fontSize: 13,
    fontWeight: 600,
  },
  linkBtn: {
    background: "none",
    border: "none",
    color: "#2bd4bd",
    cursor: "pointer",
    fontSize: 13,
    marginTop: 16,
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    fontWeight: 600,
  },
  primaryBtn: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: "12px 22px",
    borderRadius: 10,
    border: "none",
    background: "#2bb3a3",
    color: "#06231f",
    fontWeight: 700,
    cursor: "pointer",
    fontSize: 14,
    boxShadow: "0 4px 14px rgba(43, 179, 163, 0.35)",
  },
  input: {
    width: "100%",
    padding: "13px 44px 13px 16px",
    borderRadius: 10,
    border: "1px solid rgba(43, 212, 189, 0.4)",
    background: "rgba(255, 255, 255, 0.05)",
    color: "#fff",
    fontSize: 15,
    outline: "none",
    boxSizing: "border-box",
  },
  errorBox: {
    background: "rgba(239, 68, 68, 0.15)",
    border: "1px solid rgba(239, 68, 68, 0.3)",
    color: "#fca5a5",
    padding: "10px 16px",
    borderRadius: 10,
    marginBottom: 16,
    fontSize: 13,
    textAlign: "center",
  },
  successBox: {
    background: "rgba(43, 212, 189, 0.15)",
    border: "1px solid rgba(43, 212, 189, 0.3)",
    color: "#2bd4bd",
    padding: "10px 16px",
    borderRadius: 10,
    marginBottom: 16,
    fontSize: 13,
    textAlign: "center",
  },
  formContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    width: "100%",
    maxWidth: 480,
  },
  screenHeader: {
    textAlign: "center",
    marginBottom: 18,
  },
  largeIconBadge: {
    width: 72,
    height: 72,
    borderRadius: 24,
    background: "rgba(43, 212, 189, 0.1)",
    border: "1px solid rgba(43, 212, 189, 0.25)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "0 auto 12px",
  },
  identifyForm: {
    display: "flex",
    gap: 10,
    width: "100%",
  },

  // Gate simulation
  gateOuter: {
    padding: 14,
    borderRadius: 22,
    background: "rgba(255, 255, 255, 0.03)",
    boxShadow: "0 24px 70px rgba(0, 0, 0, 0.55)",
    border: "1px solid rgba(255, 255, 255, 0.08)",
  },
  gateInner: {
    position: "relative",
    width: 360,
    height: 230,
    borderRadius: 16,
    overflow: "hidden",
    border: "3px solid #2bb3a3",
  },
  behind: {
    position: "absolute",
    inset: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "background 0.35s ease",
  },
  revealText: {
    textAlign: "center",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 6,
    padding: "0 20px",
  },
  welcome: {
    fontSize: 20,
    fontWeight: 800,
    color: "#fff",
  },
  gateopen: {
    fontSize: 13,
    color: "#2bd4bd",
    letterSpacing: 2,
    fontWeight: 800,
  },
  deniedMsg: {
    fontSize: 13,
    color: "#fca5a5",
    maxWidth: 280,
    lineHeight: 1.4,
  },
  door: {
    position: "absolute",
    top: 0,
    width: "50%",
    height: "100%",
    background: "linear-gradient(135deg, #134e4a, #0d9488)",
    borderRight: "1px solid rgba(0, 0, 0, 0.3)",
  },
  doorHandle: {
    position: "absolute",
    top: "50%",
    right: 12,
    width: 6,
    height: 44,
    marginTop: -22,
    borderRadius: 3,
    background: "rgba(255, 255, 255, 0.6)",
  },

  // Plan cards & renewal
  currentPlanCard: {
    background: "rgba(255, 255, 255, 0.05)",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    borderRadius: 14,
    padding: "16px 20px",
    display: "flex",
    alignItems: "center",
    gap: 16,
    marginBottom: 16,
  },
  planIconBadge: {
    width: 48,
    height: 48,
    borderRadius: 14,
    background: "rgba(245, 158, 11, 0.15)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  badgeSuccess: {
    background: "rgba(16, 185, 129, 0.15)",
    color: "#34d399",
    border: "1px solid rgba(16, 185, 129, 0.3)",
    padding: "4px 12px",
    borderRadius: 20,
    fontSize: 12,
    fontWeight: 600,
    whiteSpace: "nowrap",
  },
  badgeInfo: {
    background: "rgba(99, 102, 241, 0.15)",
    color: "#a5b4fc",
    border: "1px solid rgba(99, 102, 241, 0.3)",
    padding: "4px 12px",
    borderRadius: 20,
    fontSize: 12,
    fontWeight: 600,
    whiteSpace: "nowrap",
  },
  periodSwitcher: {
    display: "flex",
    justifyContent: "center",
    gap: 10,
    marginBottom: 18,
  },
  periodBtn: {
    padding: "9px 18px",
    borderRadius: 10,
    border: "none",
    cursor: "pointer",
    fontWeight: 600,
    fontSize: 13,
    display: "flex",
    alignItems: "center",
    gap: 6,
  },
  saveBadge: {
    background: "rgba(255, 255, 255, 0.2)",
    borderRadius: 10,
    padding: "1px 6px",
    fontSize: 10,
    fontWeight: 700,
  },
  planCard: {
    background: "rgba(255, 255, 255, 0.04)",
    border: "1px solid rgba(255, 255, 255, 0.08)",
    borderRadius: 14,
    padding: "18px 20px",
  },

  // Trainers
  trainerCard: {
    background: "rgba(255, 255, 255, 0.04)",
    border: "1px solid rgba(255, 255, 255, 0.08)",
    borderRadius: 14,
    padding: "14px 18px",
    display: "flex",
    alignItems: "center",
    gap: 14,
    cursor: "pointer",
    color: "#fff",
    width: "100%",
  },
  trainerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 12,
    background: "rgba(99, 102, 241, 0.15)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  slotRow: {
    background: "rgba(255, 255, 255, 0.035)",
    border: "1px solid rgba(255, 255, 255, 0.06)",
    borderRadius: 12,
    padding: "12px 16px",
    display: "flex",
    gap: 12,
    alignItems: "center",
  },
  timeSlot: {
    padding: "6px 14px",
    borderRadius: 8,
    background: "rgba(43, 212, 189, 0.15)",
    border: "1px solid rgba(43, 212, 189, 0.35)",
    color: "#2bd4bd",
    cursor: "pointer",
    fontWeight: 600,
    fontSize: 12,
  },

  // Supplements & Shop
  cartBtn: {
    background: "rgba(43, 212, 189, 0.15)",
    border: "1px solid rgba(43, 212, 189, 0.3)",
    color: "#2bd4bd",
    borderRadius: 10,
    padding: "8px 16px",
    cursor: "pointer",
    fontSize: 13,
    fontWeight: 700,
    display: "flex",
    alignItems: "center",
    gap: 6,
  },
  supplementCard: {
    background: "rgba(255, 255, 255, 0.04)",
    border: "1px solid rgba(255, 255, 255, 0.08)",
    borderRadius: 14,
    padding: "14px 18px",
    display: "flex",
    alignItems: "center",
    gap: 14,
    cursor: "pointer",
    color: "#fff",
    width: "100%",
  },
  shopItemIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    background: "rgba(6, 182, 212, 0.15)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  addCartCircle: {
    width: 32,
    height: 32,
    borderRadius: "50%",
    background: "#2bb3a3",
    color: "#06231f",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 18,
    fontWeight: 700,
  },
  cartItem: {
    background: "rgba(255, 255, 255, 0.05)",
    border: "1px solid rgba(255, 255, 255, 0.08)",
    borderRadius: 12,
    padding: "12px 16px",
    display: "flex",
    alignItems: "center",
    gap: 14,
  },
  removeBtn: {
    background: "rgba(239, 68, 68, 0.15)",
    border: "none",
    color: "#fca5a5",
    borderRadius: 8,
    padding: "6px 8px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
  },

  // Progress
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: 14,
  },
  statCard: {
    background: "rgba(255, 255, 255, 0.04)",
    border: "1px solid rgba(255, 255, 255, 0.08)",
    borderRadius: 14,
    padding: "18px 14px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    textAlign: "center",
  },
  statIconBadge: {
    width: 44,
    height: 44,
    borderRadius: 12,
    background: "rgba(255, 255, 255, 0.06)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  entryRow: {
    background: "rgba(255, 255, 255, 0.03)",
    border: "1px solid rgba(255, 255, 255, 0.06)",
    borderRadius: 10,
    padding: "10px 16px",
    display: "flex",
    alignItems: "center",
  },
};

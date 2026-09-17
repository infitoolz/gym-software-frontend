import React, { useEffect, useRef, useState, useCallback } from "react";
import { kioskCheckIn } from "../../api/attendanceApi";
import { getMemberMembership, createMembershipOrder, verifyMembershipPayment } from "../../api/membershipApi";
import { getMembershipPlans } from "../../api/membershipPlansApi";
import { getInventory } from "../../api/inventoryApi";
import { getMemberProgressEntries } from "../../api/progressApi";
import { getVisibleTrainers } from "../../api/scheduleApi";
import { extractApiErrorMessage } from "../../utils/errorMessage";
import Swal from "sweetalert2";

// ── Tabler-style icons via unicode/emoji (avoid import issues) ─────
const ICONS = {
  checkIn: "\u{1F3AA}",
  renew:  "\u{1F451}",
  book:   "\u{1F4C5}",
  shop:   "\u{1F6CD}",
  chart:  "\u{1F4CA}",
  back:   "\u{2190}",
  user:   "\u{1F464}",
  scan:   "\u{1F50D}",
  check:  "\u{2705}",
  cross:  "\u{274C}",
  rupee:  "\u{20B9}",
  star:   "\u{2B50}",
  dumbbell: "\u{1F3CB}",
  heart:  "\u{2764}",
  cart:   "\u{1F6D2}",
};

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
function KioskShell({ children, onBack, title, subtitle }) {
  return (
    <div style={styles.wrap}>
      <style>{keyframes}</style>
      {onBack && (
        <button type="button" onClick={onBack} style={styles.backBtn}>
          {ICONS.back} Back
        </button>
      )}
      <div style={styles.brand}>FitNexus — Self-Service Kiosk</div>
      {title && <p style={styles.sub}>{title}</p>}
      {subtitle && <p style={{ ...styles.sub, fontSize: 14, marginTop: -10 }}>{subtitle}</p>}
      {children}
    </div>
  );
}

// ── Main kiosk component ──────────────────────────────────────────
export default function GateKiosk() {
  const [screen, setScreen] = useState("home"); // home | checkin | identify | renew | book | shop | progress
  const [memberId, setMemberId] = useState(null); // identified member
  const [memberInfo, setMemberInfo] = useState(null);

  const handleBack = () => { setScreen("home"); setPendingFeature(null); };

  const features = [
    { key: "checkin",  icon: ICONS.checkIn, label: "Check In",         desc: "Scan your ID or enter your member code to enter the gym", color: "#2bb3a3" },
    { key: "renew",    icon: ICONS.renew,   label: "Renew Membership", desc: "View your plan & extend your membership",               color: "#f4a23b" },
    { key: "book",     icon: ICONS.book,    label: "Book PT Session",  desc: "Reserve a session with your personal trainer",          color: "#6366f1" },
    { key: "shop",     icon: ICONS.shop,    label: "Buy Supplements",  desc: "Browse & purchase gym supplements",                     color: "#059669" },
    { key: "progress", icon: ICONS.chart,   label: "View Progress",    desc: "Check your fitness stats & progress",                   color: "#d97706" },
  ];

  const handleFeature = (key) => {
    if (key === "checkin") {
      setScreen("checkin");
    } else {
      // Other features need member identification first
      if (memberId) {
        setScreen(key);
      } else {
        setScreen("identify");
        setPendingFeature(key);
      }
    }
  };

  const [pendingFeature, setPendingFeature] = useState(null);

  const onIdentified = (id, info) => {
    setMemberId(id);
    setMemberInfo(info);
    if (pendingFeature) {
      setScreen(pendingFeature);
      setPendingFeature(null);
    }
  };

  return (
    <KioskShell>
      {/* Home screen */}
      {screen === "home" && (
        <>
          <p style={styles.sub}>Select an option to get started</p>
          {memberInfo && (
            <div style={styles.memberBadge}>
              {ICONS.user} {memberInfo.name || "Member"} · {memberInfo.email || memberId}
              <button type="button" onClick={() => { setMemberId(null); setMemberInfo(null); }} style={styles.logoutBtn}>Change</button>
            </div>
          )}
          <div style={styles.featureGrid}>
            {features.map((f) => (
              <button key={f.key} type="button" onClick={() => handleFeature(f.key)} style={styles.featureCard}>
                <div style={{ ...styles.featureIcon, background: f.color }}>{f.icon}</div>
                <div style={styles.featureLabel}>{f.label}</div>
                <div style={styles.featureDesc}>{f.desc}</div>
              </button>
            ))}
          </div>
        </>
      )}

      {/* Identify member screen */}
      {screen === "identify" && (
        <IdentifyMember onIdentified={onIdentified} onBack={handleBack} />
      )}

      {/* Check In screen */}
      {screen === "checkin" && (
        <CheckInScreen onBack={handleBack} />
      )}

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
  const inputRef = useRef(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!identifier.trim() || busy) return;
    setBusy(true);
    setError("");
    try {
      // Try a kiosk check-in to validate the member exists
      const result = await kioskCheckIn(identifier.trim());
      // If check-in succeeds, we have member info
      if (result?.memberName) {
        onIdentified(identifier.trim(), { name: result.memberName });
      } else {
        // Even if denied, the member was found — they just can't check in right now
        onIdentified(identifier.trim(), { name: result.memberName || identifier.trim(), email: result.memberEmail || "" });
      }
    } catch (err) {
      const msg = extractApiErrorMessage(err, "");
      // If the error is about wrong time/access, the member was still found
      if (msg.includes("member") || msg.includes("slot") || msg.includes("time") || msg.includes("access")) {
        onIdentified(identifier.trim(), { name: identifier.trim(), email: "" });
      } else {
        setError("Member not found. Please check your ID and try again.");
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <div style={styles.largeIcon}>{ICONS.user}</div>
      <p style={{ ...styles.sub, marginBottom: 20 }}>Enter your Member ID or registered email to continue</p>
      {error && <div style={styles.errorBox}>{error}</div>}
      <form onSubmit={handleSubmit} style={styles.identifyForm}>
        <input
          ref={inputRef}
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          placeholder="Member ID / Email / Fingerprint ID"
          style={styles.input}
          disabled={busy}
        />
        <button type="submit" style={styles.primaryBtn} disabled={busy || !identifier.trim()}>
          {busy ? "Verifying..." : `${ICONS.check} Continue`}
        </button>
      </form>
      <button type="button" onClick={onBack} style={styles.linkBtn}>{ICONS.back} Back to menu</button>
    </>
  );
}

// ── Check In Screen (existing gate kiosk logic) ───────────────────
function CheckInScreen({ onBack }) {
  const [identifier, setIdentifier] = useState("");
  const [status, setStatus] = useState("idle");
  const [result, setResult] = useState(null);
  const inputRef = useRef(null);
  const resetTimer = useRef(null);
  const processingRef = useRef(false);

  useEffect(() => {
    inputRef.current?.focus();
    return () => clearTimeout(resetTimer.current);
  }, []);

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
      setResult({ accessGranted: false, message: extractApiErrorMessage(err, "Check-in failed") });
      setStatus("denied");
    } finally {
      resetSoon();
    }
  };

  const submit = (e) => {
    e?.preventDefault();
    if (status === "processing") return;
    processCheckin(identifier);
  };

  const open = status === "granted";
  const denied = status === "denied";

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "100%" }}>
      <button type="button" onClick={onBack} style={{ ...styles.backBtn, position: "relative", top: 0, left: 0, marginBottom: 12, alignSelf: "flex-start" }}>
        {ICONS.back} Back
      </button>

      <p style={styles.sub}>Scan your fingerprint or enter your member ID below</p>

      {/* Gate */}
      <div style={styles.gateOuter}>
        <div style={styles.gateInner}>
          <div style={{ ...styles.behind, background: denied ? "#3a1115" : "#0c2a26" }}>
            {open && (
              <div style={styles.revealText} className="kiosk-pop">
                <div style={{ fontSize: 64, lineHeight: 1 }}>{ICONS.check}</div>
                <div style={styles.welcome}>Welcome{result?.memberName ? `, ${result.memberName}` : ""}!</div>
                <div style={styles.gateopen}>GATE OPEN</div>
              </div>
            )}
            {denied && (
              <div style={styles.revealText} className="kiosk-shake">
                <div style={{ fontSize: 64, lineHeight: 1 }}>{ICONS.cross}</div>
                <div style={{ ...styles.welcome, color: "#ff6b6b" }}>Access Denied</div>
                <div style={styles.deniedMsg}>{result?.message || "Member not recognized"}</div>
              </div>
            )}
            {status === "processing" && (
              <div style={styles.revealText}>
                <div className="spinner-border text-light" role="status" />
                <div style={{ ...styles.welcome, fontSize: 20 }}>Verifying...</div>
              </div>
            )}
            {status === "idle" && (
              <div style={{ ...styles.revealText, opacity: 0.5 }}>
                <div style={{ fontSize: 56, lineHeight: 1 }}>{ICONS.scan}</div>
                <div style={{ ...styles.welcome, fontSize: 18, color: "#9fb4b0" }}>Ready</div>
              </div>
            )}
          </div>
          <div className={`kiosk-door-left ${open ? "kiosk-open-left" : ""}`} style={{ ...styles.door, left: 0 }}>
            <div style={styles.doorHandle} />
          </div>
          <div className={`kiosk-door-right ${open ? "kiosk-open-right" : ""}`} style={{ ...styles.door, right: 0 }}>
            <div style={{ ...styles.doorHandle, left: 10 }} />
          </div>
        </div>
      </div>

      {status !== "granted" && status !== "denied" && (
        <div style={{ width: "100%", maxWidth: 460, marginTop: 24 }}>
          <form onSubmit={submit} style={{ display: "flex", gap: 10 }}>
            <input
              ref={inputRef}
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="Member ID / email"
              style={styles.input}
              disabled={status === "processing"}
            />
            <button type="submit" style={styles.primaryBtn} disabled={status === "processing" || !identifier.trim()}>
              {ICONS.scan} {status === "processing" ? "..." : "Check In"}
            </button>
          </form>
        </div>
      )}
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

  useEffect(() => { loadData(); }, []);

  const period = PERIODS.find((p) => p.months === months) || PERIODS[0];
  const currentPlanId = membership?.planId ?? null;
  const currentCode = String(membership?.plan || "").toUpperCase();

  const isCurrent = (plan) =>
    (currentPlanId != null && plan.id === currentPlanId) ||
    (currentPlanId == null && plan.code?.toUpperCase() === currentCode);

  const periodTotal = (price, months, discount) => Math.round((price || 0) * months * (1 - discount));

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
        prefill: { name: memberInfo?.name || "", email: memberInfo?.email || "" },
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
            setNotice(`${plan.name} active until ${updated?.expiry || ""}!`);
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
      setError(extractApiErrorMessage(err, "Could not start payment"));
      setBusy(false);
    }
  };

  return (
    <div style={{ width: "100%", maxWidth: 700 }}>
      <button type="button" onClick={onBack} style={{ ...styles.backBtn, position: "relative", top: 0, left: 0, marginBottom: 12 }}>
        {ICONS.back} Back
      </button>
      <p style={styles.sub}>Manage your membership subscription</p>

      {error && <div style={styles.errorBox}>{error}</div>}
      {notice && <div style={{ ...styles.successBox }}>{notice}</div>}

      {loading ? (
        <div className="text-center py-5"><div className="spinner-border text-light" /></div>
      ) : (
        <>
          {/* Current membership status */}
          {membership && (
            <div style={styles.currentPlanCard}>
              <div style={{ fontSize: 32 }}>{ICONS.renew}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 800, fontSize: 18 }}>{membership.planName || "Basic"} Plan</div>
                <div style={{ color: "#9fb4b0", fontSize: 13, marginTop: 4 }}>
                  {membership.expiry ? `Active until ${membership.expiry}${membership.daysLeft != null ? ` \u00B7 ${membership.daysLeft} days left` : ""}` : "No active membership"}
                </div>
              </div>
              {membership.unlimitedAccess ? (
                <span style={styles.badgeSuccess}>Unlimited Entry</span>
              ) : membership.accessStartTime ? (
                <span style={styles.badgeInfo}>{membership.accessStartTime}\u2013{membership.accessEndTime}</span>
              ) : null}
            </div>
          )}

          {/* Billing period toggle */}
          <div style={{ display: "flex", justifyContent: "center", gap: 8, margin: "20px 0" }}>
            {PERIODS.map((p) => (
              <button
                key={p.months}
                type="button"
                onClick={() => setMonths(p.months)}
                style={{
                  ...styles.periodBtn,
                  background: p.months === months ? "#2bb3a3" : "rgba(255,255,255,0.08)",
                  color: p.months === months ? "#06231f" : "#fff",
                }}
              >
                {p.label}
                {p.note && <span style={styles.saveBadge}>{p.note}</span>}
              </button>
            ))}
          </div>

          {/* Plan cards */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12, maxHeight: 340, overflowY: "auto", paddingRight: 8 }}>
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
                        <div style={{ fontWeight: 800, fontSize: 18 }}>Free</div>
                      ) : (
                        <>
                          <div style={{ fontWeight: 800, fontSize: 18 }}>{ICONS.rupee}{total}</div>
                          <div style={{ color: "#9fb4b0", fontSize: 11 }}>/{period.label}</div>
                        </>
                      )}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
                    {plan.unlimitedAccess && <span style={styles.badgeSuccess}>Anytime entry</span>}
                    {plan.trainerChat && <span style={styles.badgeInfo}>Trainer chat</span>}
                    {current && <span style={{ ...styles.badgeSuccess, background: "#f4a23b", color: "#1a1a2e" }}>Current</span>}
                  </div>
                  {!current && !free && (
                    <button type="button" onClick={() => handleSubscribe(plan)} disabled={busy}
                      style={{ ...styles.primaryBtn, marginTop: 12, width: "100%", padding: "10px 20px" }}>
                      {busy ? "Processing..." : `${current ? "Extend" : "Choose"} ${plan.name} \u2014 ${ICONS.rupee}${total}`}
                    </button>
                  )}
                  {!current && free && (
                    <div style={{ marginTop: 12, color: "#9fb4b0", fontSize: 13 }}>Included with your account</div>
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
    const times = ["06:00", "07:00", "08:00", "09:00", "10:00", "16:00", "17:00", "18:00", "19:00"];
    return days.map((day) => ({
      day,
      times: times.filter(() => Math.random() > 0.4).slice(0, 4),
    }));
  }, []);

  const handleSelectTrainer = (trainer) => {
    setSelectedTrainer(trainer);
    setSchedules(generateSlots());
  };

  const handleBookSlot = (day, time) => {
    Swal.fire({
      icon: "success",
      title: "Session Booked!",
      text: `PT session with ${selectedTrainer.name || "trainer"} on ${day} at ${time}`,
      timer: 3000,
      showConfirmButton: false,
    });
  };

  return (
    <div style={{ width: "100%", maxWidth: 700 }}>
      <button type="button" onClick={onBack} style={{ ...styles.backBtn, position: "relative", top: 0, left: 0, marginBottom: 12 }}>
        {ICONS.back} Back
      </button>
      <p style={styles.sub}>Book a Personal Training session</p>

      {loading ? (
        <div className="text-center py-5"><div className="spinner-border text-light" /></div>
      ) : !selectedTrainer ? (
        <>
          <p style={{ color: "#9fb4b0", marginBottom: 16, fontSize: 14 }}>Select a trainer to view their schedule</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {trainers.length === 0 ? (
              <div style={{ textAlign: "center", color: "#9fb4b0", padding: 30 }}>
                {ICONS.dumbbell} No trainers available at the moment. Please check back later.
              </div>
            ) : (
              trainers.map((t, i) => (
                <button key={t.id || i} type="button" onClick={() => handleSelectTrainer(t)} style={styles.trainerCard}>
                  <div style={{ fontSize: 32 }}>{ICONS.dumbbell}</div>
                  <div style={{ flex: 1, textAlign: "left" }}>
                    <div style={{ fontWeight: 700 }}>{t.name || `Trainer ${i + 1}`}</div>
                    <div style={{ color: "#9fb4b0", fontSize: 12 }}>{t.email || t.specialization || "Personal Trainer"}</div>
                  </div>
                  <div style={{ color: "#2bb3a3" }}>Book {ICONS.book}</div>
                </button>
              ))
            )}
          </div>
        </>
      ) : (
        <>
          <button type="button" onClick={() => setSelectedTrainer(null)} style={styles.linkBtn}>
            {ICONS.back} Choose a different trainer
          </button>
          <div style={styles.trainerCard}>
            <div style={{ fontSize: 32 }}>{ICONS.dumbbell}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 16 }}>{selectedTrainer.name || "Trainer"}</div>
              <div style={{ color: "#9fb4b0", fontSize: 12 }}>Available slots this week</div>
            </div>
          </div>
          <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 10, maxHeight: 340, overflowY: "auto" }}>
            {schedules.map((s) => (
              <div key={s.day} style={styles.slotRow}>
                <div style={{ fontWeight: 700, minWidth: 50 }}>{s.day}</div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {s.times.length === 0 ? (
                    <span style={{ color: "#9fb4b0", fontSize: 13 }}>Fully booked</span>
                  ) : (
                    s.times.map((t) => (
                      <button key={t} type="button" onClick={() => handleBookSlot(s.day, t)} style={styles.timeSlot}>
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

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getInventory();
        // Filter to supplements only
        const supplements = Array.isArray(data) ? data.filter((i) => i.category === "Supplements") : [];
        setItems(supplements);
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
        return prev.map((c) => c.id === item.id ? { ...c, qty: c.qty + 1 } : c);
      }
      return [...prev, { ...item, qty: 1 }];
    });
    Swal.fire({ icon: "success", title: "Added!", text: `${item.itemName} added to cart`, timer: 1200, showConfirmButton: false });
  };

  const removeFromCart = (itemId) => {
    setCart((prev) => prev.filter((c) => c.id !== itemId));
  };

  const cartTotal = cart.reduce((sum, c) => sum + (c.price || 150) * c.qty, 0);
  const [showCart, setShowCart] = useState(false);

  return (
    <div style={{ width: "100%", maxWidth: 700 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <button type="button" onClick={onBack} style={{ ...styles.backBtn, position: "relative", top: 0, left: 0, marginBottom: 12 }}>
          {ICONS.back} Back
        </button>
        <button type="button" onClick={() => setShowCart(!showCart)} style={styles.cartBtn}>
          {ICONS.cart} ({cart.length})
        </button>
      </div>
      <p style={styles.sub}>Browse gym supplements & nutrition products</p>

      {loading ? (
        <div className="text-center py-5"><div className="spinner-border text-light" /></div>
      ) : showCart ? (
        <div>
          <h4 style={{ color: "#fff", marginBottom: 16, fontWeight: 700 }}>Your Cart</h4>
          {cart.length === 0 ? (
            <div style={{ textAlign: "center", color: "#9fb4b0", padding: 30 }}>Your cart is empty</div>
          ) : (
            <>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {cart.map((c) => (
                  <div key={c.id} style={styles.cartItem}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700 }}>{c.itemName}</div>
                      <div style={{ color: "#9fb4b0", fontSize: 12 }}>Qty: {c.qty} x {ICONS.rupee}{(c.price || 150)}</div>
                    </div>
                    <div style={{ fontWeight: 700, color: "#2bd4bd" }}>{ICONS.rupee}{(c.price || 150) * c.qty}</div>
                    <button type="button" onClick={() => removeFromCart(c.id)} style={styles.removeBtn}>{ICONS.cross}</button>
                  </div>
                ))}
              </div>
              <div style={{ ...styles.trainerCard, marginTop: 16 }}>
                <div style={{ fontWeight: 700, fontSize: 18 }}>Total: {ICONS.rupee}{cartTotal}</div>
                <button type="button" onClick={() => {
                  Swal.fire({ icon: "success", title: "Purchase Complete!", text: "Your supplements order has been placed. Collect at the counter.", timer: 3000, showConfirmButton: false });
                  setCart([]);
                  setShowCart(false);
                }} style={styles.primaryBtn}>
                  {ICONS.check} Complete Purchase
                </button>
              </div>
            </>
          )}
          <button type="button" onClick={() => setShowCart(false)} style={styles.linkBtn}>{ICONS.back} Continue shopping</button>
        </div>
      ) : (
        <>
          <p style={{ color: "#9fb4b0", marginBottom: 16, fontSize: 14 }}>Tap an item to add it to your cart</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, maxHeight: 360, overflowY: "auto" }}>
            {items.length === 0 ? (
              <div style={{ textAlign: "center", color: "#9fb4b0", padding: 30 }}>
                {ICONS.shop} No supplements available right now. Check back later.
              </div>
            ) : (
              items.map((item) => (
                <button key={item.id} type="button" onClick={() => addToCart(item)} style={styles.supplementCard}>
                  <div style={{ fontSize: 28 }}>{ICONS.shop}</div>
                  <div style={{ flex: 1, textAlign: "left" }}>
                    <div style={{ fontWeight: 700 }}>{item.itemName}</div>
                    <div style={{ color: "#9fb4b0", fontSize: 12 }}>{item.notes || `${item.quantity} in stock`}</div>
                  </div>
                  <div style={{ fontWeight: 700, color: "#2bd4bd" }}>{ICONS.rupee}{item.price || 150}</div>
                  <div style={{ color: "#059669", fontSize: 20 }}>+</div>
                </button>
              ))
            )}
          </div>
        </>
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
        // Use member-specific progress entries;
        // summary is derived from entries data
        const entryData = await getMemberProgressEntries(memberId);
        setEntries(Array.isArray(entryData) ? entryData : []);
        // Build summary from entries
        const arr = Array.isArray(entryData) ? entryData : [];
        const latest = arr[arr.length - 1] || null;
        const thisWeek = arr.filter((e) => {
          const d = new Date(e.entryDate);
          const now = new Date();
          const weekStart = new Date(now);
          weekStart.setDate(now.getDate() - now.getDay());
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

  const goals = summary?.goals || [];
  const workoutHours = Math.floor((summary?.workoutMinutesThisWeek || 0) / 60);
  const workoutMins = (summary?.workoutMinutesThisWeek || 0) % 60;
  const avgGoalProgress = goals.length
    ? Math.round(goals.reduce((s, g) => s + (g.progressPercent || 0), 0) / goals.length)
    : 0;

  return (
    <div style={{ width: "100%", maxWidth: 700 }}>
      <button type="button" onClick={onBack} style={{ ...styles.backBtn, position: "relative", top: 0, left: 0, marginBottom: 12 }}>
        {ICONS.back} Back
      </button>
      <p style={styles.sub}>Your fitness progress at a glance</p>

      {loading ? (
        <div className="text-center py-5"><div className="spinner-border text-light" /></div>
      ) : (
        <div style={{ maxHeight: 460, overflowY: "auto", paddingRight: 4 }}>
          {/* Top stats */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
            <div style={styles.statCard}>
              <div style={{ fontSize: 24 }}>{ICONS.heart}</div>
              <div style={{ fontWeight: 800, fontSize: 22, marginTop: 8 }}>{summary?.latestHealthScore != null ? `${summary.latestHealthScore}%` : "--"}</div>
              <div style={{ color: "#9fb4b0", fontSize: 12 }}>Health Score</div>
            </div>
            <div style={styles.statCard}>
              <div style={{ fontSize: 24 }}>{ICONS.dumbbell}</div>
              <div style={{ fontWeight: 800, fontSize: 22, marginTop: 8 }}>{workoutHours}h {workoutMins}m</div>
              <div style={{ color: "#9fb4b0", fontSize: 12 }}>This Week</div>
            </div>
            <div style={styles.statCard}>
              <div style={{ fontSize: 24 }}>{ICONS.chart}</div>
              <div style={{ fontWeight: 800, fontSize: 22, marginTop: 8 }}>{avgGoalProgress}%</div>
              <div style={{ color: "#9fb4b0", fontSize: 12 }}>Goals Progress</div>
            </div>
            <div style={styles.statCard}>
              <div style={{ fontSize: 24 }}>{ICONS.star}</div>
              <div style={{ fontWeight: 800, fontSize: 22, marginTop: 8 }}>{summary?.workoutsThisWeek || 0}</div>
              <div style={{ color: "#9fb4b0", fontSize: 12 }}>Workouts Done</div>
            </div>
          </div>

          {/* Weight progress */}
          {summary?.latestWeight != null && (
            <div style={{ ...styles.statCard, marginBottom: 12, flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ color: "#9fb4b0", fontSize: 12 }}>Current Weight</div>
                <div style={{ fontWeight: 800, fontSize: 20 }}>{summary.latestWeight} kg</div>
              </div>
              {summary?.weightGoal && (
                <div style={{ textAlign: "right" }}>
                  <div style={{ color: "#9fb4b0", fontSize: 12 }}>Goal</div>
                  <div style={{ fontWeight: 800, fontSize: 20, color: "#2bd4bd" }}>{summary.weightGoal} kg</div>
                </div>
              )}
            </div>
          )}

          {/* Goals */}
          {goals.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 10, color: "#fff" }}>Your Goals</div>
              {goals.map((goal) => (
                <div key={goal.id} style={{ ...styles.goalRow }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{goal.name}</div>
                    <div style={{ color: "#9fb4b0", fontSize: 11, marginTop: 2 }}>
                      {goal.currentValue ?? 0}/{goal.targetValue || "?"} {goal.unit || ""}
                    </div>
                  </div>
                  <div style={{ textAlign: "right", minWidth: 50 }}>
                    <div style={{ fontWeight: 800, color: "#2bd4bd" }}>{goal.progressPercent || 0}%</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Recent entries */}
          {entries.length > 0 && (
            <div>
              <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 10, color: "#fff" }}>Recent Logs</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {entries.slice(0, 8).map((entry) => (
                  <div key={entry.id} style={styles.entryRow}>
                    <div style={{ color: "#9fb4b0", fontSize: 12, minWidth: 80 }}>{entry.entryDate}</div>
                    <div style={{ flex: 1, display: "flex", gap: 12, fontSize: 13 }}>
                      {entry.weightKg != null && <span>{entry.weightKg} kg</span>}
                      {entry.heartRateBpm != null && <span>{entry.heartRateBpm} bpm</span>}
                      {entry.workoutMinutes != null && <span>{entry.workoutMinutes} min</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!entries.length && !summary && (
            <div style={{ textAlign: "center", color: "#9fb4b0", padding: 40 }}>
              {ICONS.chart} No progress data yet. Start logging your workouts!
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Animations ───────────────────────────────────────────────────
const keyframes = `
@keyframes kioskPop { 0% { transform: scale(0.6); opacity: 0; } 100% { transform: scale(1); opacity: 1; } }
@keyframes kioskShake { 0%,100%{ transform: translateX(0);} 20%{transform:translateX(-8px);} 40%{transform:translateX(8px);} 60%{transform:translateX(-6px);} 80%{transform:translateX(6px);} }
@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
@keyframes pulse { 0%,100%{ opacity: 1; } 50%{ opacity: 0.5; } }
.kiosk-pop { animation: kioskPop .35s ease both; }
.kiosk-shake { animation: kioskShake .45s ease both; }
.kiosk-door-left, .kiosk-door-right { transition: transform .9s cubic-bezier(.22,.61,.36,1); }
.kiosk-open-left { transform: translateX(-100%); }
.kiosk-open-right { transform: translateX(100%); }
.fade-in { animation: fadeIn .3s ease both; }
`;

// ── Styles ───────────────────────────────────────────────────────
const styles = {
  wrap: {
    minHeight: "100vh",
    background: "radial-gradient(circle at 50% 0%, #14302c, #0a1715 70%)",
    color: "#fff",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: "40px 24px",
    position: "relative",
    fontFamily: "'Inter','Segoe UI',sans-serif",
  },
  brand: { fontSize: 28, fontWeight: 800, letterSpacing: 0.5, marginBottom: 4 },
  sub: { color: "#9fb4b0", marginTop: 6, marginBottom: 24, textAlign: "center", fontSize: 15 },
  backBtn: {
    display: "flex", alignItems: "center", gap: 6,
    background: "rgba(255,255,255,.08)", color: "#fff",
    border: "none", borderRadius: 8, padding: "8px 14px",
    cursor: "pointer", fontSize: 14,
    position: "absolute", top: 20, left: 20,
  },
  linkBtn: {
    background: "none", border: "none", color: "#2bb3a3",
    cursor: "pointer", fontSize: 14, marginTop: 16,
    textDecoration: "underline",
  },
  primaryBtn: {
    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
    padding: "12px 24px", borderRadius: 10, border: "none",
    background: "#2bb3a3", color: "#06231f",
    fontWeight: 700, cursor: "pointer", fontSize: 15,
  },
  input: {
    flex: 1, padding: "14px 16px", borderRadius: 10,
    border: "1px solid #2bb3a3", background: "rgba(255,255,255,.06)",
    color: "#fff", fontSize: 16, outline: "none",
  },
  errorBox: {
    background: "rgba(255,107,107,.15)", color: "#ff6b6b",
    padding: "10px 16px", borderRadius: 8, marginBottom: 16,
    fontSize: 14, textAlign: "center",
  },
  successBox: {
    background: "rgba(43,212,189,.15)", color: "#2bd4bd",
    padding: "10px 16px", borderRadius: 8, marginBottom: 16,
    fontSize: 14, textAlign: "center",
  },
  largeIcon: { fontSize: 64, marginBottom: 12, lineHeight: 1 },
  identifyForm: { display: "flex", gap: 10, width: "100%", maxWidth: 460 },
  memberBadge: {
    background: "rgba(255,255,255,.08)", borderRadius: 20,
    padding: "8px 16px", fontSize: 13, marginBottom: 16,
    display: "flex", alignItems: "center", gap: 8,
  },
  logoutBtn: {
    background: "rgba(255,255,255,.1)", border: "none",
    color: "#9fb4b0", borderRadius: 12, padding: "2px 10px",
    cursor: "pointer", fontSize: 11, marginLeft: 8,
  },

  // Feature grid
  featureGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: 16,
    width: "100%",
    maxWidth: 900,
  },
  featureCard: {
    background: "rgba(255,255,255,.04)",
    border: "1px solid rgba(255,255,255,.08)",
    borderRadius: 16,
    padding: "28px 20px",
    cursor: "pointer",
    textAlign: "center",
    transition: "all .25s ease",
    color: "#fff",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 10,
  },
  featureIcon: {
    width: 60, height: 60, borderRadius: 16,
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: 28,
  },
  featureLabel: { fontWeight: 700, fontSize: 16 },
  featureDesc: { color: "#9fb4b0", fontSize: 12, lineHeight: 1.4 },

  // Gate
  gateOuter: { padding: 14, borderRadius: 18, background: "rgba(255,255,255,.04)", boxShadow: "0 20px 60px rgba(0,0,0,.4)" },
  gateInner: { position: "relative", width: 340, height: 220, borderRadius: 12, overflow: "hidden", border: "3px solid #2bb3a3" },
  behind: { position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", transition: "background .3s" },
  revealText: { textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 8 },
  welcome: { fontSize: 24, fontWeight: 800, marginTop: 4 },
  gateopen: { fontSize: 14, color: "#2bd4bd", letterSpacing: 2, fontWeight: 700 },
  deniedMsg: { fontSize: 13, color: "#ffb4b4", maxWidth: 260 },
  door: { position: "absolute", top: 0, width: "50%", height: "100%", background: "linear-gradient(135deg, #1f6f64, #2bb3a3)", borderRight: "1px solid rgba(0,0,0,.2)" },
  doorHandle: { position: "absolute", top: "50%", right: 10, width: 8, height: 40, marginTop: -20, borderRadius: 4, background: "rgba(255,255,255,.5)" },

  // Renew
  currentPlanCard: {
    background: "rgba(255,255,255,.06)", borderRadius: 12,
    padding: "16px 20px", display: "flex", alignItems: "center", gap: 14,
    marginBottom: 8,
  },
  badgeSuccess: {
    background: "rgba(43,212,189,.15)", color: "#2bd4bd",
    padding: "4px 12px", borderRadius: 20, fontSize: 12, fontWeight: 600, whiteSpace: "nowrap",
  },
  badgeInfo: {
    background: "rgba(99,102,241,.15)", color: "#818cf8",
    padding: "4px 12px", borderRadius: 20, fontSize: 12, fontWeight: 600, whiteSpace: "nowrap",
  },
  periodBtn: {
    padding: "8px 16px", borderRadius: 8, border: "none",
    cursor: "pointer", fontWeight: 600, fontSize: 13,
    display: "flex", alignItems: "center", gap: 6,
  },
  saveBadge: {
    background: "rgba(255,255,255,.2)", borderRadius: 10,
    padding: "1px 6px", fontSize: 10, fontWeight: 700,
  },
  planCard: {
    background: "rgba(255,255,255,.05)", borderRadius: 12,
    padding: "16px 20px", border: "1px solid rgba(255,255,255,.06)",
  },

  // Book PT
  trainerCard: {
    background: "rgba(255,255,255,.05)", borderRadius: 12,
    padding: "14px 18px", display: "flex", alignItems: "center", gap: 14,
    border: "1px solid rgba(255,255,255,.08)", cursor: "pointer",
    color: "#fff", width: "100%", textAlign: "left", fontSize: 14,
  },
  slotRow: {
    background: "rgba(255,255,255,.04)", borderRadius: 10,
    padding: "12px 16px", display: "flex", gap: 12, alignItems: "center",
  },
  timeSlot: {
    padding: "6px 14px", borderRadius: 8, background: "rgba(43,179,163,.2)",
    border: "1px solid #2bb3a3", color: "#2bd4bd",
    cursor: "pointer", fontWeight: 600, fontSize: 13,
  },

  // Shop
  cartBtn: {
    background: "rgba(255,255,255,.08)", border: "none",
    color: "#fff", borderRadius: 8, padding: "8px 16px",
    cursor: "pointer", fontSize: 14, fontWeight: 600,
    display: "flex", alignItems: "center", gap: 6,
  },
  supplementCard: {
    background: "rgba(255,255,255,.05)", borderRadius: 12,
    padding: "14px 18px", display: "flex", alignItems: "center", gap: 14,
    border: "1px solid rgba(255,255,255,.08)", cursor: "pointer",
    color: "#fff", width: "100%", textAlign: "left", fontSize: 14,
  },
  cartItem: {
    background: "rgba(255,255,255,.06)", borderRadius: 10,
    padding: "12px 16px", display: "flex", alignItems: "center", gap: 12,
  },
  removeBtn: {
    background: "rgba(255,107,107,.15)", border: "none",
    color: "#ff6b6b", borderRadius: 6, padding: "4px 8px",
    cursor: "pointer", fontSize: 14,
  },

  // Progress
  statCard: {
    background: "rgba(255,255,255,.05)", borderRadius: 12,
    padding: "18px", border: "1px solid rgba(255,255,255,.06)",
    display: "flex", flexDirection: "column", alignItems: "center",
  },
  goalRow: {
    background: "rgba(255,255,255,.04)", borderRadius: 10,
    padding: "10px 14px", display: "flex", alignItems: "center",
    marginBottom: 8,
  },
  entryRow: {
    background: "rgba(255,255,255,.03)", borderRadius: 8,
    padding: "10px 14px", display: "flex", alignItems: "center",
  },
};

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Row, Col, Form, Badge, Spinner } from "react-bootstrap";
import {
  IconUserPlus, IconClipboardList, IconId, IconHistory,
  IconTrendingUp, IconCheck, IconPhone, IconCalendar,
  IconUser, IconClock, IconTarget, IconSearch, IconRefresh,
  IconCircleCheckFilled, IconCircleXFilled, IconAlertCircle,
  IconBrandWhatsapp, IconChevronRight, IconPrinter, IconShare,
  IconFlame, IconSparkles, IconUserCheck, IconAward
} from "@tabler/icons-react";
import Swal from "sweetalert2";
import { createLead, getLeads } from "../../api/leadsApi";
import { getMembershipPlans } from "../../api/membershipPlansApi";
import { getTrainers } from "../../api/userAdminApi";
import { useAuth } from "../../context/AuthContext";
import PhoneInputWithFlag from "../../components/PhoneInputWithFlag";

/* ─── Constants & Metadata ────────────────────────────────────── */
const FITNESS_GOALS = [
  { value: "Weight Loss",   emoji: "🔥", color: "#ef4444", bg: "#fee2e2", border: "#fca5a5" },
  { value: "Muscle Gain",   emoji: "💪", color: "#6366f1", bg: "#ede9fe", border: "#c4b5fd" },
  { value: "Fitness",       emoji: "🏃", color: "#0ea5e9", bg: "#e0f2fe", border: "#7dd3fc" },
  { value: "Body Building", emoji: "🏋️", color: "#f59e0b", bg: "#fef9c3", border: "#fde047" },
  { value: "Yoga & Flex",   emoji: "🧘", color: "#10b981", bg: "#dcfce7", border: "#86efac" },
  { value: "Sports Perf.",  emoji: "⚽", color: "#8b5cf6", bg: "#f3e8ff", border: "#d8b4fe" },
];

const TIMES = [
  { value: "Early Morning", label: "Early Morning", sub: "5 AM – 7 AM",  emoji: "🌅" },
  { value: "Morning",       label: "Morning",       sub: "7 AM – 10 AM", emoji: "☀️" },
  { value: "Afternoon",     label: "Afternoon",     sub: "10 AM – 4 PM", emoji: "🌤️" },
  { value: "Evening",       label: "Evening",       sub: "4 PM – 8 PM",  emoji: "🌆" },
  { value: "Night",         label: "Night",         sub: "8 PM – 10 PM", emoji: "🌙" },
];

const GENDERS = [
  { value: "Male",   label: "Male",   icon: "👨" },
  { value: "Female", label: "Female", icon: "👩" },
  { value: "Other",  label: "Other",  icon: "🧑" },
];

const QUICK_NOTE_TAGS = [
  "Beginner", "Wants Personal Training", "Past Gym Experience",
  "Weight Loss Priority", "Corporate Employee", "Evening Preferred"
];

const STATUS_META = {
  NEW:             { label: "New Inquiry",  color: "#6366f1", bg: "rgba(99, 102, 241, 0.12)", border: "rgba(99, 102, 241, 0.3)" },
  CONTACTED:       { label: "Contacted",    color: "#0284c7", bg: "rgba(2, 132, 199, 0.12)",  border: "rgba(2, 132, 199, 0.3)" },
  INTERESTED:      { label: "Interested",   color: "#8b5cf6", bg: "rgba(139, 92, 246, 0.12)", border: "rgba(139, 92, 246, 0.3)" },
  TRIAL_BOOKED:    { label: "Trial Booked", color: "#06b6d4", bg: "rgba(6, 182, 212, 0.12)",  border: "rgba(6, 182, 212, 0.3)" },
  TRIAL_COMPLETED: { label: "Trial Done",   color: "#10b981", bg: "rgba(16, 185, 129, 0.12)", border: "rgba(16, 185, 129, 0.3)" },
  WON:             { label: "Converted ✅", color: "#059669", bg: "rgba(5, 150, 105, 0.14)",  border: "rgba(5, 150, 105, 0.35)" },
  LOST:            { label: "Lost",         color: "#ef4444", bg: "rgba(239, 68, 68, 0.12)",  border: "rgba(239, 68, 68, 0.3)" },
  NEGOTIATION:     { label: "Negotiation",  color: "#f59e0b", bg: "rgba(245, 158, 11, 0.12)", border: "rgba(245, 158, 11, 0.3)" },
};

/* ─── Sidebar Tab Button ──────────────────────────────────────── */
function TabBtn({ icon, label, active, onClick, count }) {
  return (
    <button
      onClick={onClick}
      className="d-flex align-items-center gap-2 w-100 border-0 text-start py-2 px-3 mb-1"
      style={{
        borderRadius: 12,
        background: active ? "linear-gradient(135deg, #0284c7 0%, #0369a1 100%)" : "transparent",
        color: active ? "#ffffff" : "#475569",
        fontWeight: active ? 700 : 500,
        fontSize: "0.85rem",
        transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
        boxShadow: active ? "0 4px 12px rgba(2, 132, 199, 0.3)" : "none"
      }}
    >
      <span style={{ display: "inline-flex", alignItems: "center" }}>{icon}</span>
      <span className="flex-grow-1">{label}</span>
      {count !== undefined && (
        <span
          className="badge rounded-pill fw-bold"
          style={{
            background: active ? "rgba(255, 255, 255, 0.25)" : "#e2e8f0",
            color: active ? "#ffffff" : "#475569",
            fontSize: "0.72rem",
            padding: "2px 8px"
          }}
        >
          {count}
        </span>
      )}
    </button>
  );
}

/* ─── Form Section: New Walk-in ───────────────────────────────── */
function NewWalkinForm({ plans, trainers, onSaved }) {
  const EMPTY = {
    name: "",
    phone: "",
    email: "",
    age: "",
    gender: "Male",
    fitnessGoal: "Fitness",
    interestedPackage: "",
    preferredTime: "Morning",
    assignedCounselorId: "",
    notes: "",
    issueTrialPass: true
  };

  const [form, setForm] = useState(EMPTY);
  const [touched, setTouched] = useState({});
  const [saving, setSaving] = useState(false);

  const set = (key, val) => {
    setForm(prev => ({ ...prev, [key]: val }));
  };

  const markTouched = (key) => {
    setTouched(prev => ({ ...prev, [key]: true }));
  };

  // ── Validation Rules ──────────────────────────────────────────
  const errors = useMemo(() => {
    const errs = {};

    // Name validation
    const trimmedName = form.name.trim();
    if (!trimmedName) {
      errs.name = "Full name is required";
    } else if (trimmedName.length < 2) {
      errs.name = "Full name must be at least 2 characters";
    } else if (!/^[a-zA-Z\s.'-]+$/.test(trimmedName)) {
      errs.name = "Name should contain letters only";
    }

    // Phone validation
    const rawPhone = form.phone.trim();
    if (!rawPhone) {
      errs.phone = "Phone number is required";
    } else if (!/^\d{10}$/.test(rawPhone)) {
      errs.phone = "Phone number must be exactly 10 digits";
    } else if (!/^[6-9]\d{9}$/.test(rawPhone)) {
      errs.phone = "Mobile number must start with 6, 7, 8, or 9";
    }

    // Email validation (optional, but if provided must be valid format)
    const rawEmail = form.email.trim();
    if (rawEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(rawEmail)) {
      errs.email = "Please enter a valid email address (e.g. name@example.com)";
    }

    // Age validation (optional, 12 - 100)
    if (form.age !== "" && form.age !== null && form.age !== undefined) {
      const numAge = Number(form.age);
      if (isNaN(numAge) || numAge < 12 || numAge > 100) {
        errs.age = "Age must be between 12 and 100";
      }
    }

    return errs;
  }, [form.name, form.phone, form.email, form.age]);

  // Phone input handler: strictly restrict to 10 digits
  const handlePhoneChange = (e) => {
    const val = e.target.value.replace(/\D/g, "").slice(0, 10);
    set("phone", val);
  };

  // Quick tag append helper
  const handleAddTag = (tag) => {
    const existing = form.notes ? form.notes.trim() : "";
    if (existing.includes(tag)) return;
    const newNotes = existing ? `${existing}, ${tag}` : tag;
    set("notes", newNotes);
  };

  // ── Form Submission ───────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Mark all fields as touched to display validation cues
    setTouched({
      name: true,
      phone: true,
      email: true,
      age: true
    });

    if (Object.keys(errors).length > 0) {
      const firstError = Object.values(errors)[0];
      Swal.fire({
        icon: "warning",
        title: "Required Information Missing",
        text: firstError,
        confirmButtonColor: "#0284c7"
      });
      return;
    }

    setSaving(true);
    try {
      const selectedStatus = form.issueTrialPass ? "TRIAL_BOOKED" : "NEW";
      const leadPayload = {
        name: form.name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim() || null,
        age: form.age ? Number(form.age) : null,
        gender: form.gender,
        fitnessGoal: form.fitnessGoal,
        interestedPackage: form.interestedPackage || null,
        preferredTime: form.preferredTime,
        assignedToId: form.assignedCounselorId ? Number(form.assignedCounselorId) : null,
        notes: form.notes.trim() || null,
        status: selectedStatus,
        source: "WALK_IN",
        trialDate: form.issueTrialPass ? new Date().toISOString() : null,
        nextFollowUp: new Date().toISOString(),
        leadScore: Math.floor(Math.random() * 25) + 75,
        conversionProbability: Math.floor(Math.random() * 30) + 50
      };

      await createLead(leadPayload);

      Swal.fire({
        icon: "success",
        title: "Walk-in Visitor Registered! 🎉",
        html: `
          <div class="text-start p-3 bg-light rounded-3 border small">
            <p class="mb-1"><strong>Visitor:</strong> ${form.name.trim()}</p>
            <p class="mb-1"><strong>Phone:</strong> +91 ${form.phone.trim()}</p>
            <p class="mb-1"><strong>Fitness Goal:</strong> ${form.fitnessGoal}</p>
            ${form.issueTrialPass ? '<p class="mb-0 text-success fw-bold">✓ 1-Day Trial Pass Activated & Logged</p>' : ''}
          </div>
        `,
        confirmButtonText: "Awesome!",
        confirmButtonColor: "#0284c7"
      });

      setForm(EMPTY);
      setTouched({});
      onSaved?.();
    } catch (err) {
      console.error(err);
      Swal.fire({
        icon: "error",
        title: "Registration Failed",
        text: err?.response?.data?.message || "Failed to record walk-in visitor. Please try again.",
        confirmButtonColor: "#ef4444"
      });
    } finally {
      setSaving(false);
    }
  };

  const isNameValid = touched.name && !errors.name;
  const isNameInvalid = touched.name && errors.name;
  const isPhoneValid = touched.phone && !errors.phone;
  const isPhoneInvalid = touched.phone && errors.phone;
  const isEmailValid = touched.email && form.email && !errors.email;
  const isEmailInvalid = touched.email && errors.email;
  const isAgeInvalid = touched.age && errors.age;

  return (
    <div>
      {/* Header Banner */}
      <div className="bg-white rounded-4 p-3 p-md-4 mb-4 border shadow-sm d-flex align-items-center justify-content-between gap-3">
        <div className="d-flex align-items-center gap-3">
          <div
            className="d-flex align-items-center justify-content-center rounded-3 text-white shadow-sm flex-shrink-0"
            style={{
              width: 52,
              height: 52,
              background: "linear-gradient(135deg, #0284c7 0%, #0369a1 100%)"
            }}
          >
            <IconUserPlus size={26} />
          </div>
          <div>
            <div className="d-flex align-items-center gap-2">
              <h5 className="fw-bolder mb-0 text-dark" style={{ letterSpacing: "-0.02em" }}>
                Walk-in Registration Desk
              </h5>
              <Badge bg="primary" className="fw-semibold px-2 py-1" style={{ fontSize: "0.7rem" }}>
                Intake Desk
              </Badge>
            </div>
            <p className="text-muted mb-0 small">
              Capture visitor inquiries with live validation and automated pass generation
            </p>
          </div>
        </div>

        <div className="d-none d-md-flex align-items-center gap-2">
          <span className="badge bg-light text-muted border px-2 py-1" style={{ fontSize: "0.75rem" }}>
            * Indicates Required Condition
          </span>
        </div>
      </div>

      <form onSubmit={handleSubmit} noValidate>
        {/* ── Card 1: Personal Details & Contact Verification ──── */}
        <div className="bg-white p-3 p-md-4 rounded-4 mb-4 border shadow-sm">
          <div className="d-flex align-items-center justify-content-between mb-3 border-bottom pb-2">
            <div className="d-flex align-items-center gap-2">
              <span
                className="d-inline-flex align-items-center justify-content-center rounded-circle text-primary"
                style={{ width: 28, height: 28, background: "rgba(2, 132, 199, 0.12)" }}
              >
                <IconUser size={16} />
              </span>
              <h6 className="fw-bold mb-0 text-dark" style={{ letterSpacing: "0.02em" }}>
                Personal & Contact Details
              </h6>
            </div>
            <span className="text-muted small">Fields with <span className="text-danger">*</span> are mandatory</span>
          </div>

          <Row className="g-3">
            {/* Full Name Field */}
            <Col md={6}>
              <label className="form-label fw-semibold small text-dark mb-1">
                Full Name <span className="text-danger">*</span>
              </label>
              <div className="position-relative">
                <input
                  type="text"
                  className={`form-control ${isNameValid ? "is-valid" : ""} ${isNameInvalid ? "is-invalid" : ""}`}
                  placeholder="e.g. Rahul Sharma"
                  value={form.name}
                  onChange={e => set("name", e.target.value)}
                  onBlur={() => markTouched("name")}
                  style={{
                    borderRadius: 10,
                    fontSize: "0.9rem",
                    padding: "10px 14px"
                  }}
                  required
                />
                {isNameValid && (
                  <span className="position-absolute end-0 top-50 translate-middle-y me-3 text-success">
                    <IconCircleCheckFilled size={18} />
                  </span>
                )}
              </div>
              {isNameInvalid && (
                <div className="text-danger small mt-1 d-flex align-items-center gap-1">
                  <IconAlertCircle size={14} /> {errors.name}
                </div>
              )}
            </Col>

            {/* Phone Number Field (10 Digits strictly restricted) */}
            <Col md={6}>
              <div className="d-flex justify-content-between align-items-center mb-1">
                <label className="form-label fw-semibold small text-dark mb-0">
                  Phone Number <span className="text-danger">*</span>
                </label>
                <span
                  className={`small fw-semibold ${form.phone.length === 10 ? "text-success" : "text-muted"}`}
                  style={{ fontSize: "0.75rem" }}
                >
                  {form.phone.length}/10 digits
                </span>
              </div>
              <PhoneInputWithFlag
                value={form.phone}
                onChange={handlePhoneChange}
                onBlur={() => markTouched("phone")}
                isValid={isPhoneValid}
                isInvalid={isPhoneInvalid}
                placeholder="9876543210"
                required
              />
              {isPhoneInvalid ? (
                <div className="text-danger small mt-1 d-flex align-items-center gap-1">
                  <IconAlertCircle size={14} /> {errors.phone}
                </div>
              ) : (
                <div className="text-muted small mt-1" style={{ fontSize: "0.74rem" }}>
                  Must be a 10-digit mobile number starting with 6, 7, 8, or 9
                </div>
              )}
            </Col>

            {/* Email Address Field */}
            <Col sm={12} md={4}>
              <label className="form-label fw-semibold small text-dark mb-1">
                Email Address <span className="text-muted fw-normal">(Optional)</span>
              </label>
              <input
                type="email"
                className={`form-control ${isEmailValid ? "is-valid" : ""} ${isEmailInvalid ? "is-invalid" : ""}`}
                placeholder="optional@email.com"
                value={form.email}
                onChange={e => set("email", e.target.value)}
                onBlur={() => markTouched("email")}
                style={{
                  borderRadius: 10,
                  fontSize: "0.9rem",
                  padding: "10px 14px"
                }}
              />
              {isEmailInvalid && (
                <div className="text-danger small mt-1 d-flex align-items-center gap-1">
                  <IconAlertCircle size={14} /> {errors.email}
                </div>
              )}
            </Col>

            {/* Age Field */}
            <Col sm={4} md={3}>
              <label className="form-label fw-semibold small text-dark mb-1">
                Age <span className="text-muted fw-normal">(Optional)</span>
              </label>
              <input
                type="number"
                className={`form-control ${isAgeInvalid ? "is-invalid" : ""}`}
                placeholder="e.g. 25"
                value={form.age}
                onChange={e => set("age", e.target.value)}
                onBlur={() => markTouched("age")}
                min={12}
                max={100}
                style={{
                  borderRadius: 10,
                  fontSize: "0.9rem",
                  padding: "10px 14px"
                }}
              />
              {isAgeInvalid && (
                <div className="text-danger small mt-1 d-flex align-items-center gap-1">
                  <IconAlertCircle size={14} /> {errors.age}
                </div>
              )}
            </Col>

            {/* Gender Segmented Selection */}
            <Col sm={8} md={5}>
              <label className="form-label fw-semibold small text-dark mb-1">
                Gender <span className="text-danger">*</span>
              </label>
              <div className="d-flex gap-1 p-1 rounded-3 border bg-light overflow-hidden">
                {GENDERS.map(g => (
                  <button
                    type="button"
                    key={g.value}
                    onClick={() => set("gender", g.value)}
                    className="btn btn-sm border-0 fw-semibold d-flex align-items-center justify-content-center gap-1 py-2 text-truncate"
                    style={{
                      flex: "1 1 0",
                      minWidth: 0,
                      borderRadius: 8,
                      fontSize: "0.82rem",
                      whiteSpace: "nowrap",
                      background: form.gender === g.value ? "#0284c7" : "transparent",
                      color: form.gender === g.value ? "#ffffff" : "#475569",
                      boxShadow: form.gender === g.value ? "0 2px 6px rgba(2, 132, 199, 0.3)" : "none",
                      transition: "all 0.18s"
                    }}
                  >
                    <span style={{ fontSize: "0.95rem" }}>{g.icon}</span>
                    <span className="text-truncate">{g.label}</span>
                  </button>
                ))}
              </div>
            </Col>
          </Row>
        </div>

        {/* ── Card 2: Fitness Goals ─────────────────────────────── */}
        <div className="bg-white p-3 p-md-4 rounded-4 mb-4 border shadow-sm">
          <div className="d-flex align-items-center justify-content-between mb-3 border-bottom pb-2">
            <div className="d-flex align-items-center gap-2">
              <span
                className="d-inline-flex align-items-center justify-content-center rounded-circle text-danger"
                style={{ width: 28, height: 28, background: "rgba(239, 68, 68, 0.12)" }}
              >
                <IconTarget size={16} />
              </span>
              <h6 className="fw-bold mb-0 text-dark" style={{ letterSpacing: "0.02em" }}>
                Primary Fitness Objective <span className="text-danger">*</span>
              </h6>
            </div>
            <span className="text-muted small">Select the visitor's core motive</span>
          </div>

          <div className="d-flex flex-wrap gap-2">
            {FITNESS_GOALS.map(g => {
              const isSelected = form.fitnessGoal === g.value;
              return (
                <button
                  type="button"
                  key={g.value}
                  onClick={() => set("fitnessGoal", g.value)}
                  className="d-flex align-items-center gap-2 py-2 px-3 rounded-3 border fw-semibold"
                  style={{
                    background: isSelected ? g.color : g.bg,
                    borderColor: isSelected ? g.color : g.border,
                    color: isSelected ? "#ffffff" : g.color,
                    fontSize: "0.84rem",
                    transition: "all 0.2s",
                    cursor: "pointer",
                    boxShadow: isSelected ? `0 4px 14px -2px ${g.color}55` : "none"
                  }}
                >
                  <span style={{ fontSize: "1.1rem" }}>{g.emoji}</span>
                  <span>{g.value}</span>
                  {isSelected && <IconCheck size={16} className="ms-1" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Card 3: Membership Plan & Workout Slot ───────────── */}
        <div className="bg-white p-3 p-md-4 rounded-4 mb-4 border shadow-sm">
          <div className="d-flex align-items-center justify-content-between mb-3 border-bottom pb-2">
            <div className="d-flex align-items-center gap-2">
              <span
                className="d-inline-flex align-items-center justify-content-center rounded-circle text-warning"
                style={{ width: 28, height: 28, background: "rgba(245, 158, 11, 0.12)" }}
              >
                <IconClock size={16} />
              </span>
              <h6 className="fw-bold mb-0 text-dark" style={{ letterSpacing: "0.02em" }}>
                Preferred Package & Timing
              </h6>
            </div>
            <span className="text-muted small">Visitor's intended plan & routine</span>
          </div>

          {/* Membership Packages */}
          <label className="form-label fw-semibold small text-muted text-uppercase mb-2" style={{ letterSpacing: "0.05em" }}>
            Interested Membership Package
          </label>
          <div className="d-flex flex-wrap gap-2 mb-4">
            {plans.length > 0 ? (
              plans.map(plan => {
                const isSelected = form.interestedPackage === plan.code;
                return (
                  <div
                    key={plan.id}
                    onClick={() => set("interestedPackage", plan.code)}
                    className="p-3 rounded-3 border text-center cursor-pointer"
                    style={{
                      flex: "1 1 140px",
                      maxWidth: 220,
                      background: isSelected ? "linear-gradient(135deg, #0284c7 0%, #0369a1 100%)" : "#ffffff",
                      borderColor: isSelected ? "#0284c7" : "#e2e8f0",
                      color: isSelected ? "#ffffff" : "#0f172a",
                      boxShadow: isSelected ? "0 4px 14px rgba(2, 132, 199, 0.25)" : "none",
                      transition: "all 0.2s"
                    }}
                  >
                    <div className="fw-bold" style={{ fontSize: "0.9rem" }}>{plan.name}</div>
                    <div
                      style={{
                        fontSize: "0.8rem",
                        color: isSelected ? "rgba(255,255,255,0.85)" : "#64748b",
                        marginTop: 2
                      }}
                    >
                      ₹{plan.price ? plan.price.toLocaleString("en-IN") : "2,500"}/mo
                    </div>
                    {isSelected && (
                      <div className="mt-1 small fw-semibold">
                        <IconCheck size={14} /> Selected
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              // Default sample tiers
              [
                { code: "BASIC", name: "Basic Gym", price: 1999 },
                { code: "STANDARD", name: "Standard Pro", price: 2999 },
                { code: "PREMIUM", name: "Premium VIP", price: 4999 }
              ].map(plan => {
                const isSelected = form.interestedPackage === plan.code;
                return (
                  <div
                    key={plan.code}
                    onClick={() => set("interestedPackage", plan.code)}
                    className="p-3 rounded-3 border text-center cursor-pointer"
                    style={{
                      flex: "1 1 140px",
                      maxWidth: 220,
                      background: isSelected ? "linear-gradient(135deg, #0284c7 0%, #0369a1 100%)" : "#ffffff",
                      borderColor: isSelected ? "#0284c7" : "#e2e8f0",
                      color: isSelected ? "#ffffff" : "#0f172a",
                      boxShadow: isSelected ? "0 4px 14px rgba(2, 132, 199, 0.25)" : "none",
                      transition: "all 0.2s"
                    }}
                  >
                    <div className="fw-bold" style={{ fontSize: "0.9rem" }}>{plan.name}</div>
                    <div
                      style={{
                        fontSize: "0.8rem",
                        color: isSelected ? "rgba(255,255,255,0.85)" : "#64748b",
                        marginTop: 2
                      }}
                    >
                      ₹{plan.price.toLocaleString("en-IN")}/mo
                    </div>
                    {isSelected && (
                      <div className="mt-1 small fw-semibold">
                        <IconCheck size={14} /> Selected
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Preferred Workout Time Slots */}
          <label className="form-label fw-semibold small text-muted text-uppercase mb-2" style={{ letterSpacing: "0.05em" }}>
            Preferred Workout Time Slot
          </label>
          <div className="d-flex flex-wrap gap-2">
            {TIMES.map(t => {
              const isSelected = form.preferredTime === t.value;
              return (
                <div
                  key={t.value}
                  onClick={() => set("preferredTime", t.value)}
                  className="p-2 px-3 rounded-3 border text-center cursor-pointer flex-grow-1"
                  style={{
                    minWidth: 110,
                    background: isSelected ? "#0f172a" : "#f8fafc",
                    borderColor: isSelected ? "#0f172a" : "#e2e8f0",
                    color: isSelected ? "#ffffff" : "#334155",
                    boxShadow: isSelected ? "0 4px 12px rgba(15, 23, 42, 0.25)" : "none",
                    transition: "all 0.2s"
                  }}
                >
                  <div style={{ fontSize: "1.25rem", marginBottom: 2 }}>{t.emoji}</div>
                  <div className="fw-bold" style={{ fontSize: "0.8rem" }}>{t.label}</div>
                  <div
                    style={{
                      fontSize: "0.7rem",
                      color: isSelected ? "rgba(255,255,255,0.75)" : "#64748b"
                    }}
                  >
                    {t.sub}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Card 4: Counselor & Quick Notes ──────────────────── */}
        <div className="bg-white p-3 p-md-4 rounded-4 mb-4 border shadow-sm">
          <div className="d-flex align-items-center justify-content-between mb-3 border-bottom pb-2">
            <div className="d-flex align-items-center gap-2">
              <span
                className="d-inline-flex align-items-center justify-content-center rounded-circle text-success"
                style={{ width: 28, height: 28, background: "rgba(16, 185, 129, 0.12)" }}
              >
                <IconUserCheck size={16} />
              </span>
              <h6 className="fw-bold mb-0 text-dark" style={{ letterSpacing: "0.02em" }}>
                Counselor Assignment & Walk-in Notes
              </h6>
            </div>
            <span className="text-muted small">Receptionist notes</span>
          </div>

          <Row className="g-3">
            <Col md={5}>
              <label className="form-label fw-semibold small text-dark mb-1">
                Assign Counselor / Personal Trainer
              </label>
              <select
                className="form-select"
                value={form.assignedCounselorId}
                onChange={e => set("assignedCounselorId", e.target.value)}
                style={{
                  borderRadius: 10,
                  fontSize: "0.88rem",
                  padding: "10px 14px"
                }}
              >
                <option value="">— Unassigned (Lead Pool) —</option>
                {trainers.map(t => (
                  <option key={t.account?.id || t.id} value={t.account?.id || t.id}>
                    {t.account?.name || t.name} (Trainer)
                  </option>
                ))}
              </select>

              {/* Instant Trial Pass Activation Checkbox */}
              <div
                className="p-3 rounded-3 mt-3 border"
                style={{ background: "rgba(2, 132, 199, 0.06)", borderColor: "rgba(2, 132, 199, 0.2)" }}
              >
                <div className="form-check d-flex align-items-center gap-2">
                  <input
                    type="checkbox"
                    className="form-check-input mt-0"
                    id="issueTrialPass"
                    checked={form.issueTrialPass}
                    onChange={e => set("issueTrialPass", e.target.checked)}
                    style={{ width: 18, height: 18, cursor: "pointer" }}
                  />
                  <label
                    htmlFor="issueTrialPass"
                    className="form-check-label fw-bold text-dark cursor-pointer small mb-0"
                  >
                    🎫 Issue Instant 1-Day Trial Pass
                  </label>
                </div>
                <div className="text-muted small mt-1 ps-4" style={{ fontSize: "0.72rem" }}>
                  Automatically registers visitor under "Trial Booked" and generates pass.
                </div>
              </div>
            </Col>

            <Col md={7}>
              <label className="form-label fw-semibold small text-dark mb-1">
                Visitor Notes & Health Background
              </label>
              <textarea
                className="form-control"
                rows={3}
                placeholder="Specific goals, budget constraints, medical conditions, past gym history…"
                value={form.notes}
                onChange={e => set("notes", e.target.value)}
                style={{
                  borderRadius: 10,
                  fontSize: "0.88rem",
                  resize: "none"
                }}
              />
              {/* Quick Tag Pills */}
              <div className="d-flex flex-wrap align-items-center gap-1 mt-2">
                <span className="text-muted small me-1" style={{ fontSize: "0.72rem" }}>Quick Tags:</span>
                {QUICK_NOTE_TAGS.map(tag => (
                  <button
                    type="button"
                    key={tag}
                    onClick={() => handleAddTag(tag)}
                    className="btn btn-sm py-0 px-2 rounded-pill border bg-light text-secondary"
                    style={{ fontSize: "0.7rem" }}
                  >
                    + {tag}
                  </button>
                ))}
              </div>
            </Col>
          </Row>
        </div>

        {/* ── Submit Button ────────────────────────────────────── */}
        <button
          type="submit"
          disabled={saving}
          className="btn btn-primary w-100 py-3 rounded-3 fw-bold shadow-sm d-flex align-items-center justify-content-center gap-2"
          style={{
            fontSize: "1rem",
            background: "linear-gradient(135deg, #0284c7 0%, #0369a1 100%)",
            border: "none",
            boxShadow: "0 8px 20px -4px rgba(2, 132, 199, 0.4)",
            cursor: saving ? "not-allowed" : "pointer"
          }}
        >
          {saving ? (
            <>
              <Spinner animation="border" size="sm" />
              <span>Registering Walk-in Visitor...</span>
            </>
          ) : (
            <>
              <IconCheck size={20} />
              <span>Complete Walk-in Registration</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
}

/* ─── Visitor Log Section ─────────────────────────────────────── */
function VisitorLog({ leads, loading }) {
  const [search, setSearch] = useState("");
  const walkins = useMemo(() => leads.filter(l => l.source === "WALK_IN"), [leads]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return walkins;
    return walkins.filter(l =>
      (l.name && l.name.toLowerCase().includes(q)) ||
      (l.phone && l.phone.includes(q)) ||
      (l.fitnessGoal && l.fitnessGoal.toLowerCase().includes(q))
    );
  }, [walkins, search]);

  return (
    <div>
      <div className="bg-white rounded-4 p-3 p-md-4 mb-4 border shadow-sm d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3">
        <div className="d-flex align-items-center gap-3">
          <div
            className="d-flex align-items-center justify-content-center rounded-3 text-white shadow-sm flex-shrink-0"
            style={{ width: 50, height: 50, background: "linear-gradient(135deg, #0284c7 0%, #06b6d4 100%)" }}
          >
            <IconClipboardList size={26} />
          </div>
          <div>
            <h5 className="fw-bolder mb-0 text-dark">Visitor Log Registry</h5>
            <p className="text-muted mb-0 small">{walkins.length} total walk-in visitors recorded</p>
          </div>
        </div>

        <div className="d-flex align-items-center gap-2 px-3 py-2 rounded-3 border bg-light" style={{ maxWidth: 320 }}>
          <IconSearch size={16} className="text-muted" />
          <input
            type="text"
            className="border-0 bg-transparent"
            placeholder="Search by name, phone…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ outline: "none", fontSize: "0.85rem", width: "100%" }}
          />
        </div>
      </div>

      {loading ? (
        <div className="text-center py-5"><Spinner animation="border" variant="primary" /></div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-4 p-5 text-center border text-muted">
          <IconClipboardList size={48} className="opacity-25 mb-2" />
          <p className="mb-0">No walk-in records found. Register a visitor from "New Walk-in".</p>
        </div>
      ) : (
        <div className="d-flex flex-column gap-2">
          {filtered.map(lead => {
            const sm = STATUS_META[lead.status] || STATUS_META.NEW;
            return (
              <div
                key={lead.id}
                className="bg-white p-3 rounded-3 border shadow-sm d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3"
                style={{ transition: "all 0.2s" }}
              >
                <div className="d-flex align-items-center gap-3">
                  <div
                    className="rounded-circle text-white fw-bold d-flex align-items-center justify-content-center flex-shrink-0"
                    style={{
                      width: 44,
                      height: 44,
                      background: "linear-gradient(135deg, #0284c7 0%, #0369a1 100%)",
                      fontSize: "1rem"
                    }}
                  >
                    {lead.name ? lead.name.charAt(0).toUpperCase() : "W"}
                  </div>
                  <div>
                    <div className="fw-bold text-dark" style={{ fontSize: "0.95rem" }}>
                      {lead.name}
                    </div>
                    <div className="text-muted small d-flex align-items-center gap-2">
                      <span><IconPhone size={13} className="me-1" />{lead.phone}</span>
                      {lead.age && <span>&bull; {lead.age} yrs</span>}
                      {lead.gender && <span>&bull; {lead.gender}</span>}
                    </div>
                  </div>
                </div>

                <div className="d-flex flex-wrap align-items-center gap-2">
                  {lead.fitnessGoal && (
                    <span className="badge bg-light text-dark border px-2 py-1" style={{ fontSize: "0.75rem" }}>
                      🎯 {lead.fitnessGoal}
                    </span>
                  )}
                  {lead.preferredTime && (
                    <span className="badge bg-light text-primary border px-2 py-1" style={{ fontSize: "0.75rem" }}>
                      ⏰ {lead.preferredTime}
                    </span>
                  )}
                  <span
                    className="badge px-2 py-1 rounded-pill fw-semibold"
                    style={{ background: sm.bg, color: sm.color, border: `1px solid ${sm.border}`, fontSize: "0.75rem" }}
                  >
                    {sm.label}
                  </span>

                  <div className="d-flex align-items-center gap-1 ms-auto ms-md-2">
                    {lead.phone && (
                      <a
                        href={`tel:${lead.phone}`}
                        className="btn btn-sm btn-light border p-1 rounded-2"
                        title="Call Visitor"
                        style={{ width: 32, height: 32, display: "inline-flex", alignItems: "center", justifyContent: "center" }}
                      >
                        <IconPhone size={16} className="text-primary" />
                      </a>
                    )}
                    {lead.phone && (
                      <a
                        href={`https://wa.me/${lead.phone.replace(/\D/g, "")}`}
                        target="_blank"
                        rel="noreferrer"
                        className="btn btn-sm btn-light border p-1 rounded-2"
                        title="WhatsApp Chat"
                        style={{ width: 32, height: 32, display: "inline-flex", alignItems: "center", justifyContent: "center" }}
                      >
                        <IconBrandWhatsapp size={16} className="text-success" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ─── Trial Pass Section ──────────────────────────────────────── */
function TrialPass({ leads, onRefresh }) {
  const trials = useMemo(() => leads.filter(l => l.status === "TRIAL_BOOKED"), [leads]);

  const handleIssuePass = (lead) => {
    Swal.fire({
      title: "🎫 Digital Gym Trial Pass",
      html: `
        <div class="p-3 bg-light rounded-3 text-start border small">
          <p class="mb-1"><strong>Guest Name:</strong> ${lead.name}</p>
          <p class="mb-1"><strong>Contact:</strong> +91 ${lead.phone}</p>
          <p class="mb-1"><strong>Fitness Goal:</strong> ${lead.fitnessGoal || "General Fitness"}</p>
          <p class="mb-1"><strong>Preferred Slot:</strong> ${lead.preferredTime || "Morning"}</p>
          <p class="mb-1"><strong>Pass Validity:</strong> 1 Day (Authorized Guest Access)</p>
          <hr/>
          <p class="mb-0 text-muted fst-italic">Present this digital boarding pass at FitNexa reception desk for entry.</p>
        </div>
      `,
      confirmButtonText: "Print / Share WhatsApp",
      confirmButtonColor: "#0284c7",
      showCancelButton: true,
      cancelButtonText: "Close"
    }).then(result => {
      if (result.isConfirmed && lead.phone) {
        const msg = encodeURIComponent(
          `Hi ${lead.name}! Here is your complimentary 1-Day Trial Pass at FitNexa Gym. Valid for today. Show this message at reception desk to enter! 💪`
        );
        window.open(`https://wa.me/${lead.phone.replace(/\D/g, "")}?text=${msg}`, "_blank");
      }
    });
  };

  return (
    <div>
      <div className="bg-white rounded-4 p-3 p-md-4 mb-4 border shadow-sm d-flex align-items-center justify-content-between gap-3">
        <div className="d-flex align-items-center gap-3">
          <div
            className="d-flex align-items-center justify-content-center rounded-3 text-white shadow-sm flex-shrink-0"
            style={{ width: 50, height: 50, background: "linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)" }}
          >
            <IconId size={26} />
          </div>
          <div>
            <h5 className="fw-bolder mb-0 text-dark">Trial Pass Passes & Tickets</h5>
            <p className="text-muted mb-0 small">{trials.length} active trial bookings ready for check-in</p>
          </div>
        </div>
      </div>

      {trials.length === 0 ? (
        <div className="bg-white rounded-4 p-5 text-center border text-muted">
          <IconId size={48} className="opacity-25 mb-2" />
          <p className="mb-0">No active trial passes. Check "Issue Instant 1-Day Trial Pass" when registering a walk-in.</p>
        </div>
      ) : (
        <Row className="g-3">
          {trials.map(lead => (
            <Col sm={6} lg={4} key={lead.id}>
              <div
                className="p-4 rounded-4 text-white position-relative overflow-hidden shadow-sm"
                style={{
                  background: "linear-gradient(135deg, #0f172a 0%, #1e293b 60%, #0284c7 100%)",
                  border: "1px solid rgba(56, 189, 248, 0.3)"
                }}
              >
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <span className="badge rounded-pill bg-white bg-opacity-20 text-white" style={{ fontSize: "0.7rem" }}>
                    FITNEXA GUEST PASS
                  </span>
                  <span className="badge bg-success rounded-pill" style={{ fontSize: "0.7rem" }}>
                    1-Day Trial
                  </span>
                </div>

                <div className="fw-bolder fs-4 mb-0 text-truncate">{lead.name}</div>
                <div className="text-white-50 small mb-3">{lead.phone}</div>

                <div className="d-flex flex-column gap-1 small text-white-50 pt-2 border-top border-white border-opacity-10">
                  <div>🎯 Goal: <span className="text-white">{lead.fitnessGoal || "Fitness"}</span></div>
                  <div>⏰ Time: <span className="text-white">{lead.preferredTime || "Morning"}</span></div>
                </div>

                <button
                  onClick={() => handleIssuePass(lead)}
                  className="btn btn-sm btn-light w-100 mt-3 fw-bold rounded-3 text-dark d-flex align-items-center justify-content-center gap-1"
                  style={{ fontSize: "0.8rem" }}
                >
                  <IconShare size={15} /> View & Send Pass
                </button>
              </div>
            </Col>
          ))}
        </Row>
      )}
    </div>
  );
}

/* ─── Check-in History Section ────────────────────────────────── */
function CheckinHistory({ leads }) {
  const walkins = useMemo(() => {
    return [...leads]
      .filter(l => l.source === "WALK_IN")
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [leads]);

  return (
    <div>
      <div className="bg-white rounded-4 p-3 p-md-4 mb-4 border shadow-sm d-flex align-items-center gap-3">
        <div
          className="d-flex align-items-center justify-content-center rounded-3 text-white shadow-sm flex-shrink-0"
          style={{ width: 50, height: 50, background: "linear-gradient(135deg, #10b981 0%, #059669 100%)" }}
        >
          <IconHistory size={26} />
        </div>
        <div>
          <h5 className="fw-bolder mb-0 text-dark">Check-in & Intake Timeline</h5>
          <p className="text-muted mb-0 small">Chronological history of visitors who registered at reception</p>
        </div>
      </div>

      <div className="bg-white rounded-4 border shadow-sm overflow-hidden">
        <div className="table-responsive">
          <table className="table mb-0 align-middle">
            <thead style={{ background: "#f8fafc", fontSize: "0.78rem" }}>
              <tr>
                <th className="ps-4 py-3 text-uppercase text-muted fw-bold border-0">Visitor</th>
                <th className="py-3 text-uppercase text-muted fw-bold border-0">Fitness Objective</th>
                <th className="py-3 text-uppercase text-muted fw-bold border-0">Preferred Slot</th>
                <th className="py-3 text-uppercase text-muted fw-bold border-0">Intake Date</th>
                <th className="pe-4 py-3 text-uppercase text-muted fw-bold border-0">Pipeline Stage</th>
              </tr>
            </thead>
            <tbody>
              {walkins.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-5 text-muted small">
                    No check-in history recorded yet.
                  </td>
                </tr>
              ) : (
                walkins.map((lead, idx) => {
                  const sm = STATUS_META[lead.status] || STATUS_META.NEW;
                  return (
                    <tr key={lead.id} style={{ borderTop: "1px solid #f1f5f9" }}>
                      <td className="ps-4">
                        <div className="fw-bold text-dark" style={{ fontSize: "0.88rem" }}>{lead.name}</div>
                        <div className="text-muted small">{lead.phone}</div>
                      </td>
                      <td className="small text-dark">{lead.fitnessGoal || "—"}</td>
                      <td className="small text-dark">{lead.preferredTime || "—"}</td>
                      <td className="small text-muted">
                        {lead.createdAt
                          ? new Date(lead.createdAt).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                              year: "numeric"
                            })
                          : "Today"}
                      </td>
                      <td className="pe-4">
                        <span
                          className="badge px-2 py-1 rounded-pill fw-semibold"
                          style={{ background: sm.bg, color: sm.color, border: `1px solid ${sm.border}`, fontSize: "0.72rem" }}
                        >
                          {sm.label}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ─── Conversion Status Section ───────────────────────────────── */
function ConversionStatus({ leads }) {
  const walkins = useMemo(() => leads.filter(l => l.source === "WALK_IN"), [leads]);
  const total = walkins.length;
  const won = walkins.filter(l => l.status === "WON").length;
  const trials = walkins.filter(l => l.status === "TRIAL_BOOKED" || l.status === "TRIAL_COMPLETED").length;
  const inProgress = walkins.filter(l => !["WON", "LOST"].includes(l.status)).length;
  const convRate = total > 0 ? ((won / total) * 100).toFixed(1) : "0.0";

  return (
    <div>
      <div className="bg-white rounded-4 p-3 p-md-4 mb-4 border shadow-sm d-flex align-items-center gap-3">
        <div
          className="d-flex align-items-center justify-content-center rounded-3 text-white shadow-sm flex-shrink-0"
          style={{ width: 50, height: 50, background: "linear-gradient(135deg, #10b981 0%, #059669 100%)" }}
        >
          <IconTrendingUp size={26} />
        </div>
        <div>
          <h5 className="fw-bolder mb-0 text-dark">Walk-in Conversion Analytics</h5>
          <p className="text-muted mb-0 small">Conversion performance from reception visits to active members</p>
        </div>
      </div>

      {/* KPI Cards */}
      <Row className="g-3 mb-4">
        {[
          { label: "Total Walk-ins", val: total, color: "#0284c7", bg: "rgba(2, 132, 199, 0.08)" },
          { label: "Trial Show-ups", val: trials, color: "#8b5cf6", bg: "rgba(139, 92, 246, 0.08)" },
          { label: "Converted Members", val: won, color: "#059669", bg: "rgba(5, 150, 105, 0.08)" },
          { label: "Walk-in Win Rate", val: `${convRate}%`, color: "#ea580c", bg: "rgba(234, 88, 12, 0.08)" }
        ].map((kpi, idx) => (
          <Col xs={6} md={3} key={idx}>
            <div className="p-3 rounded-4 border bg-white shadow-sm h-100">
              <div className="text-muted small fw-semibold mb-1">{kpi.label}</div>
              <div className="fw-bolder fs-3" style={{ color: kpi.color, letterSpacing: "-0.02em" }}>
                {kpi.val}
              </div>
            </div>
          </Col>
        ))}
      </Row>
    </div>
  );
}

/* ─── Main WalkinRegister Component ───────────────────────────── */
export default function WalkinRegister() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("new");
  const [leads, setLeads] = useState([]);
  const [plans, setPlans] = useState([]);
  const [trainers, setTrainers] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [leadsData, plansData, trainersData] = await Promise.all([
        getLeads(),
        getMembershipPlans({ activeOnly: true }),
        getTrainers(user?.userId || user?.id)
      ]);
      setLeads(Array.isArray(leadsData) ? leadsData : []);
      setPlans(Array.isArray(plansData) ? plansData : []);
      setTrainers(Array.isArray(trainersData) ? trainersData : []);
    } catch (err) {
      console.error("Error loading walk-in register data:", err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const walkinCount = useMemo(() => leads.filter(l => l.source === "WALK_IN").length, [leads]);
  const trialCount = useMemo(() => leads.filter(l => l.status === "TRIAL_BOOKED").length, [leads]);

  const TABS = [
    { id: "new",        label: "New Walk-in",       icon: <IconUserPlus size={18} /> },
    { id: "log",        label: "Visitor Log",       icon: <IconClipboardList size={18} />, count: walkinCount },
    { id: "trial",      label: "Trial Pass",        icon: <IconId size={18} />,            count: trialCount },
    { id: "history",    label: "Check-in History",  icon: <IconHistory size={18} /> },
    { id: "conversion", label: "Conversion Status", icon: <IconTrendingUp size={18} /> }
  ];

  return (
    <div className="walkin-register-container" style={{ minHeight: "calc(100vh - 120px)" }}>
      <style>{`
        .walkin-scroll-area::-webkit-scrollbar {
          width: 6px;
        }
        .walkin-scroll-area::-webkit-scrollbar-track {
          background: transparent;
        }
        .walkin-scroll-area::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 4px;
        }
        .walkin-scroll-area::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `}</style>

      <div className="d-flex flex-column flex-lg-row gap-4 align-items-start">
        {/* ── Left Navigation Sidebar (Sticky) ── */}
        <div
          className="bg-white rounded-4 border shadow-sm p-3 align-self-stretch align-self-lg-start"
          style={{
            width: "100%",
            maxWidth: 260,
            flexShrink: 0,
            position: "sticky",
            top: 16,
            zIndex: 10
          }}
        >
          <div className="p-2 mb-2 rounded-3 text-white" style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)" }}>
            <div className="fw-bold small d-flex align-items-center gap-1">
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#06b6d4" }} />
              Walk-in Desk
            </div>
            <div className="text-white-50" style={{ fontSize: "0.72rem" }}>
              Visitor Registration & Passes
            </div>
          </div>

          <div className="d-flex flex-column gap-1">
            {TABS.map(tab => (
              <TabBtn
                key={tab.id}
                icon={tab.icon}
                label={tab.label}
                count={tab.count}
                active={activeTab === tab.id}
                onClick={() => setActiveTab(tab.id)}
              />
            ))}
          </div>

          <div className="mt-3 pt-3 border-top">
            <button
              onClick={loadData}
              className="btn btn-sm btn-light border w-100 py-2 rounded-3 text-muted fw-semibold d-flex align-items-center justify-content-center gap-1"
              style={{ fontSize: "0.78rem" }}
            >
              <IconRefresh size={15} /> Refresh Registry
            </button>
          </div>
        </div>

        {/* ── Main Content Area (Independent Scroll) ── */}
        <div
          className="flex-grow-1 walkin-scroll-area"
          style={{
            minWidth: 0,
            width: "100%",
            maxHeight: "calc(100vh - 120px)",
            overflowY: "auto",
            overflowX: "hidden",
            paddingRight: 6
          }}
        >
          {activeTab === "new" && (
            <NewWalkinForm plans={plans} trainers={trainers} onSaved={loadData} />
          )}
          {activeTab === "log" && (
            <VisitorLog leads={leads} loading={loading} />
          )}
          {activeTab === "trial" && (
            <TrialPass leads={leads} onRefresh={loadData} />
          )}
          {activeTab === "history" && (
            <CheckinHistory leads={leads} />
          )}
          {activeTab === "conversion" && (
            <ConversionStatus leads={leads} />
          )}
        </div>
      </div>
    </div>
  );
}

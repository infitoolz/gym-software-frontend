import React, { useState } from 'react';
import { Link, useNavigate } from "react-router-dom";
import { Container, Row, Col, Form, InputGroup, Alert } from 'react-bootstrap';
import api from "../../utils/api";
import { useAuth } from '../../context/AuthContext';
import logo from "/src/assets/images/logo/logo.png";
import InputGroupText from 'react-bootstrap/esm/InputGroupText';
import {
  IconEye, IconEyeOff, IconChartBar, IconUsers,
  IconCalendarEvent, IconTarget, IconSparkles
} from '@tabler/icons-react';

const FEATURE_BULLETS = [
  { icon: <IconUsers size={16} />, text: "Manage & follow up on your leads" },
  { icon: <IconCalendarEvent size={16} />, text: "Scheduled follow-up calendar" },
  { icon: <IconChartBar size={16} />, text: "Track your pipeline & conversions" },
  { icon: <IconTarget size={16} />, text: "Walk-in register & trial management" },
];

export default function SalesLogin() {
  const [email, setEmail]           = useState('');
  const [password, setPassword]     = useState('');
  const [showPassword, setShowPwd]  = useState(false);
  const [error, setError]           = useState('');
  const [loading, setLoading]       = useState(false);

  const navigate  = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!email || !password) {
      setError('Please enter your email and password.');
      setLoading(false);
      return;
    }

    try {
      const response = await api.post("/auth/login", { email, password });
      const data     = response.data?.data;
      const token    = data?.token;

      if (!token) {
        setError("Login successful but no token received. Please contact your admin.");
        setLoading(false);
        return;
      }

      // Sales portal is exclusively for TRAINER role
      if (data.role !== 'TRAINER' && data.role !== 'COUNSELOR') {
        setError("Access denied. This portal is for Sales Team members only. Please use the main login.");
        setLoading(false);
        return;
      }

      login({
        token,
        accessToken: token,
        email:  data.email,
        name:   data.name,
        role:   data.role,
        userId: data.userId,
      });

      setTimeout(() => navigate("/sales-portal"), 800);
    } catch (err) {
      if (err.response?.status === 401) {
        setError("Invalid email or password.");
      } else if (err.code === 'ERR_NETWORK') {
        setError("Cannot connect to server. Please try again later.");
      } else {
        setError(err.response?.data?.message || "Login failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  /* ── Styles ─────────────────────────────────────────── */
  const leftPanel = {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #312e81 100%)',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    padding: '60px 56px',
    position: 'relative',
    overflow: 'hidden',
  };

  const rightPanel = {
    minHeight: '100vh',
    background: '#f8fafc',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    padding: '60px 56px',
  };

  const card = {
    background: '#fff',
    borderRadius: 24,
    padding: '40px 36px',
    boxShadow: '0 8px 40px rgba(99,102,241,0.10)',
    border: '1px solid #e2e8f0',
    maxWidth: 440,
    width: '100%',
  };

  const inputStyle = {
    padding: '13px 16px',
    background: '#f1f5f9',
    border: '1.5px solid transparent',
    borderRadius: 12,
    fontSize: 14,
    transition: 'border-color 0.2s',
  };

  const btnStyle = {
    padding: '14px',
    borderRadius: 14,
    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
    border: 'none',
    fontWeight: 700,
    fontSize: 15,
    letterSpacing: '0.02em',
    boxShadow: '0 4px 16px rgba(99,102,241,0.35)',
    transition: 'opacity 0.2s',
    width: '100%',
    color: '#fff',
  };

  /* ── Decorative blobs ─────────────────────────────── */
  const blob = (top, left, size, color, opacity = 0.12) => ({
    position: 'absolute', top, left,
    width: size, height: size,
    borderRadius: '50%',
    background: color,
    opacity,
    filter: 'blur(60px)',
    pointerEvents: 'none',
  });

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>

      {/* ── Left branding panel ─────────────────────────── */}
      <div style={leftPanel} className="d-none d-lg-flex">
        {/* Blobs */}
        <div style={blob('-60px', '-40px',  '320px', '#6366f1', 0.18)} />
        <div style={blob('60%',  '70%',    '260px', '#8b5cf6', 0.14)} />
        <div style={blob('30%',  '-80px',  '200px', '#0ea5e9', 0.10)} />

        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 56, position: 'relative', zIndex: 1 }}>
          <img src={logo} alt="FitNexus" style={{ height: 36, filter: 'brightness(0) invert(1)' }} />
          <span style={{ fontSize: 22, fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}>FitNexus CRM</span>
        </div>

        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'rgba(99,102,241,0.3)', borderRadius: 20,
            padding: '6px 14px', marginBottom: 24,
          }}>
            <IconSparkles size={14} color="#a5b4fc" />
            <span style={{ fontSize: 12, color: '#a5b4fc', fontWeight: 600, letterSpacing: '0.06em' }}>SALES TEAM PORTAL</span>
          </div>

          <h1 style={{ fontSize: 42, fontWeight: 800, color: '#fff', lineHeight: 1.15, marginBottom: 16 }}>
            Your CRM,<br />
            <span style={{ color: '#a5b4fc' }}>One Login Away</span>
          </h1>

          <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: 15, marginBottom: 40, lineHeight: 1.7 }}>
            Access your leads, follow-ups, and sales pipeline — everything you need to close more deals.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {FEATURE_BULLETS.map((f, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 10, flexShrink: 0,
                  background: 'rgba(99,102,241,0.35)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#a5b4fc',
                }}>
                  {f.icon}
                </div>
                <span style={{ color: 'rgba(255,255,255,0.82)', fontSize: 14 }}>{f.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom caption */}
        <div style={{
          position: 'absolute', bottom: 32, left: 56,
          color: 'rgba(255,255,255,0.3)', fontSize: 12, zIndex: 1
        }}>
          © {new Date().getFullYear()} FitNexus · Sales Team Access
        </div>
      </div>

      {/* ── Right login panel ─────────────────────────────── */}
      <div style={rightPanel} className="col-12 col-lg-5 d-flex align-items-center justify-content-center">
        <div style={card}>

          {/* Mobile logo */}
          <div className="d-flex d-lg-none align-items-center gap-2 mb-4">
            <img src={logo} alt="FitNexus" style={{ height: 28 }} />
            <span style={{ fontWeight: 700, fontSize: 16, color: '#1e293b' }}>FitNexus CRM</span>
          </div>

          <div style={{ marginBottom: 28 }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              background: '#ede9fe', borderRadius: 20,
              padding: '4px 12px', marginBottom: 16,
            }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#6366f1' }} />
              <span style={{ fontSize: 11, color: '#6366f1', fontWeight: 700, letterSpacing: '0.06em' }}>SALES PORTAL</span>
            </div>

            <h2 style={{ fontSize: 26, fontWeight: 800, color: '#0f172a', marginBottom: 6 }}>
              Welcome, Counselor 👋
            </h2>
            <p style={{ color: '#64748b', fontSize: 14 }}>
              Sign in with your credentials provided by the admin.
            </p>
          </div>

          {error && (
            <Alert variant="danger" dismissible onClose={() => setError('')} style={{ borderRadius: 12, fontSize: 13 }}>
              {error}
            </Alert>
          )}

          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label style={{ fontWeight: 600, fontSize: 13, color: '#475569', marginBottom: 6 }}>
                Email Address
              </Form.Label>
              <Form.Control
                id="sales-email"
                type="email"
                placeholder="your.name@gym.com"
                value={email}
                onChange={e => { setEmail(e.target.value); setError(''); }}
                disabled={loading}
                style={inputStyle}
              />
            </Form.Group>

            <Form.Group className="mb-4">
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <Form.Label style={{ fontWeight: 600, fontSize: 13, color: '#475569', marginBottom: 0 }}>
                  Password
                </Form.Label>
              </div>
              <InputGroup>
                <Form.Control
                  id="sales-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={e => { setPassword(e.target.value); setError(''); }}
                  disabled={loading}
                  style={{ ...inputStyle, borderRight: 'none', borderRadius: '12px 0 0 12px' }}
                />
                <InputGroupText
                  onClick={() => setShowPwd(!showPassword)}
                  style={{
                    cursor: 'pointer', background: '#f1f5f9',
                    border: '1.5px solid transparent', borderLeft: 'none',
                    borderRadius: '0 12px 12px 0',
                  }}
                >
                  {showPassword ? <IconEyeOff size={17} color="#94a3b8" /> : <IconEye size={17} color="#94a3b8" />}
                </InputGroupText>
              </InputGroup>
            </Form.Group>

            <button
              id="sales-login-btn"
              type="submit"
              style={{ ...btnStyle, opacity: loading ? 0.7 : 1 }}
              disabled={loading}
            >
              {loading ? (
                <span>
                  <span className="spinner-border spinner-border-sm me-2" role="status" />
                  Signing in…
                </span>
              ) : "Sign In to CRM Portal"}
            </button>
          </Form>

          <div style={{
            marginTop: 28, paddingTop: 20,
            borderTop: '1px solid #f1f5f9',
            display: 'flex', flexDirection: 'column', gap: 8,
          }}>
            <p style={{ color: '#94a3b8', fontSize: 12, textAlign: 'center', margin: 0 }}>
              Not a sales team member?
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 16, fontSize: 13 }}>
              <Link to="/sign-in" style={{ color: '#6366f1', fontWeight: 600, textDecoration: 'none' }}>
                Admin Login
              </Link>
              <span style={{ color: '#e2e8f0' }}>|</span>
              <Link to="/corporate-login" style={{ color: '#6366f1', fontWeight: 600, textDecoration: 'none' }}>
                Corporate Portal
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

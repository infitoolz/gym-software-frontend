import React, { useState } from 'react';
import { Link, useNavigate } from "react-router-dom";
import { Form, Alert, Spinner } from 'react-bootstrap';
import api from "../../utils/api";
import { useAuth } from '../../context/AuthContext';

import logo from "/src/assets/images/logo/logo.png";
import logoWhite from "/src/assets/images/logo/logo-white.png";
import {
  IconEye,
  IconEyeOff,
  IconMail,
  IconLock,
  IconRun,
  IconBarbell,
  IconMessageHeart,
  IconArrowRight,
  IconCheck,
  IconSparkles
} from '@tabler/icons-react';

export default function Signin() {
  const [searchInpval, setsearchInpval] = useState({
    email: '',
    password: '',
    remember: false
  });

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const { login } = useAuth();

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setsearchInpval({
      ...searchInpval,
      [name]: type === 'checkbox' ? checked : value
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!searchInpval.email || !searchInpval.password) {
      setError('Please enter both email and password');
      setLoading(false);
      return;
    }

    try {
      console.log("Attempting login with:", searchInpval.email);

      const response = await api.post("/auth/login", {
        email: searchInpval.email,
        password: searchInpval.password
      });

      console.log("✅ Login Response:", response.data);

      const tokenValue = response.data?.data?.token;

      if (tokenValue) {
        login({
          token: tokenValue,
          accessToken: tokenValue,
          email: response.data.data.email,
          name: response.data.data.name,
          role: response.data.data.role,
          userId: response.data.data.userId
        });

        console.log("✅ Auth context updated with user data");

        setTimeout(() => {
          if (response.data.data.role === 'CORPORATE_HR') {
            navigate("/hr-portal");
          } else {
            navigate("/");
          }
        }, 800);
      } else {
        setError("Login successful but no token received. Please contact support.");
      }
    } catch (error) {
      console.error("Login error:", error);

      if (error.response?.status === 401) {
        setError("Invalid email or password");
      } else if (error.response?.status === 404) {
        setError("User not found");
      } else if (error.code === 'ERR_NETWORK') {
        setError("Cannot connect to server. Make sure backend is running on localhost:8083");
      } else {
        setError(error.response?.data?.message || "Login failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-split-wrapper">
      {/* ── Left Showcase / Hero Panel (Desktop & Tablet) ── */}
      <div className="auth-showcase-panel d-none d-lg-flex">
        <div className="glow-orb orb-1" />
        <div className="glow-orb orb-2" />
        <div className="glow-orb orb-3" />

        {/* Brand Header */}
        <div className="auth-showcase-header">
          <img className="brand-logo-white" src={logoWhite} alt="FITNEXA" />
          <span className="brand-tag">FITNESS PLATFORM</span>
        </div>

        {/* Hero Body */}
        <div className="auth-showcase-body">
          <div className="auth-hero-pill">
            <IconSparkles size={14} />
            <span>NEXT-GEN FITNESS EXPERIENCE</span>
          </div>

          <h1 className="auth-hero-title">
            Elevate Your Strength.<br />
            <span className="text-gradient-cyan">Own Your Everyday.</span>
          </h1>

          <p className="auth-hero-desc">
            Access personalized workout routines, monitor live activity metrics, and connect directly with certified wellness trainers.
          </p>

          <div className="auth-feature-list">
            <div className="auth-feature-item">
              <div className="feat-icon-wrap">
                <IconRun size={18} />
              </div>
              <div className="feat-text">
                <div className="feat-title">Smart Metric Tracking</div>
                <div className="feat-desc">Monitor live steps, water intake, active calories & pulse.</div>
              </div>
            </div>

            <div className="auth-feature-item">
              <div className="feat-icon-wrap">
                <IconBarbell size={18} />
              </div>
              <div className="feat-text">
                <div className="feat-title">Guided Workout Programs</div>
                <div className="feat-desc">Custom plans tailored for muscle gain, stamina & wellness.</div>
              </div>
            </div>

            <div className="auth-feature-item">
              <div className="feat-icon-wrap">
                <IconMessageHeart size={18} />
              </div>
              <div className="feat-text">
                <div className="feat-title">Trainer & Wellness Chat</div>
                <div className="feat-desc">Instant 1-on-1 guidance from dedicated fitness experts.</div>
              </div>
            </div>
          </div>

          <div className="auth-social-proof">
            <div className="proof-badge-icon">
              <IconCheck size={16} />
            </div>
            <div className="proof-text">
              Joined by <strong>10,000+ active members</strong> consistently reaching their fitness goals.
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="auth-showcase-footer">
          © {new Date().getFullYear()} FitNexa Gym Management. All rights reserved.
        </div>
      </div>

      {/* ── Right Sign-In Form Panel (All screens) ── */}
      <div className="auth-form-panel">
        <div className="auth-card-main">
          {/* Mobile Logo */}
          <div className="auth-mobile-logo">
            <Link to="/" onClick={(e) => e.preventDefault()}>
              <img src={logo} alt="FITNEXA" />
            </Link>
          </div>

          <div className="auth-card-header">
            <div className="auth-brand-logo-desktop d-none d-lg-block">
              <Link to="/" onClick={(e) => e.preventDefault()}>
                <img src={logo} alt="FITNEXA" />
              </Link>
            </div>
            <h2 className="auth-title">Welcome Back 👋</h2>
            <p className="auth-subtitle">
              Today is a new day. It's your day. You shape it. Sign in to start managing your projects.
            </p>
          </div>

          {error && (
            <Alert variant="danger" dismissible onClose={() => setError('')} className="fade show">
              {error}
            </Alert>
          )}

          <Form onSubmit={handleSubmit}>
            {/* Email Field */}
            <div className="auth-field-group">
              <label className="field-label" htmlFor="user-email">Email Address</label>
              <div className="field-input-wrapper">
                <span className="leading-icon">
                  <IconMail size={18} />
                </span>
                <input
                  id="user-email"
                  type="email"
                  className="form-control auth-input"
                  placeholder="example@gmail.com"
                  name="email"
                  value={searchInpval.email}
                  onChange={handleChange}
                  disabled={loading}
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="auth-field-group">
              <label className="field-label" htmlFor="user-password">Password</label>
              <div className="field-input-wrapper">
                <span className="leading-icon">
                  <IconLock size={18} />
                </span>
                <input
                  id="user-password"
                  type={showPassword ? "text" : "password"}
                  className="form-control auth-input"
                  placeholder="At least 8 characters"
                  name="password"
                  value={searchInpval.password}
                  onChange={handleChange}
                  disabled={loading}
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  className="trailing-action-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <IconEyeOff size={18} /> : <IconEye size={18} />}
                </button>
              </div>
            </div>

            {/* Aux Row: Remember Me + Forgot Password */}
            <div className="auth-aux-row">
              <Form.Check
                id="remember-me-check"
                type="checkbox"
                label="Remember me"
                name="remember"
                checked={!!searchInpval.remember}
                onChange={handleChange}
                disabled={loading}
              />
              <Link to="/forgot-password" className="forgot-link">
                Forgot Password?
              </Link>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="btn-auth-submit"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Spinner animation="border" size="sm" className="me-2" />
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <span>Sign in</span>
                  <IconArrowRight size={16} />
                </>
              )}
            </button>
          </Form>

          {/* Footer Links */}
          <div className="auth-card-footer">
            <div className="signup-prompt">
              Don't you have an account?
              <Link to="/sign-up" className="signup-link">Sign Up</Link>
            </div>

            <div>
              <Link to="/sales-login" className="sales-badge-callout">
                <span>Sales Team member?</span>
                <span className="badge-role">Sales Portal Login →</span>
              </Link>
            </div>

            <div className="portal-alternatives">
              <Link to="/corporate-login">Corporate Partner Login</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
